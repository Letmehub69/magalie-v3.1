#!/usr/bin/env node
// Gestionnaire de cache de décisions pour Magalie v3.1
// Fournit une interface pour stocker et récupérer des décisions

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Types de décisions avec leurs TTL
const DECISION_TYPES = {
  TECHNICAL: { ttlDays: 7, description: 'Décision technique (choix de librairie, pattern, etc.)' },
  ARCHITECTURE: { ttlDays: 30, description: 'Décision d\'architecture (structure, infrastructure)' },
  PRICING: { ttlDays: 1, description: 'Information de prix/coût (volatile)' },
  RESEARCH: { ttlDays: 14, description: 'Résultat de recherche externe' },
  COUNCIL: { ttlDays: 90, description: 'Décision du council' }
};

/**
 * Génère un hash unique pour une décision
 * @param {string} question - La question posée
 * @param {Object} context - Le contexte de la décision
 * @returns {string} Hash SHA256
 */
function generateDecisionHash(question, context) {
  // Normaliser pour éviter les variations superficielles
  const normalized = {
    q: question.toLowerCase().trim().replace(/\s+/g, ' '),
    c: JSON.stringify(context, Object.keys(context).sort())
  };
  
  const str = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Récupère une décision depuis le cache
 * @param {string} question - La question posée
 * @param {Object} context - Le contexte de la décision
 * @param {string} decisionType - Type de décision (optionnel)
 * @returns {Object|null} La décision cacheée ou null
 */
async function getCachedDecision(question, context, decisionType = null) {
  try {
    const hash = generateDecisionHash(question, context);
    
    const { data: cached, error } = await supabase
      .from('decision_cache')
      .select('*')
      .eq('decision_hash', hash)
      .gt('ttl', new Date().toISOString())
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Pas de résultat
        return null;
      }
      throw error;
    }
    
    // Mettre à jour le hit count
    await supabase
      .from('decision_cache')
      .update({ 
        hit_count: cached.hit_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', cached.id);
    
    // Vérifier le type si spécifié
    if (decisionType && cached.decision?.type !== decisionType) {
      console.warn(`Type de décision mismatch: attendu ${decisionType}, reçu ${cached.decision?.type}`);
      // On retourne quand même la décision, mais avec un avertissement
    }
    
    return {
      ...cached.decision,
      _cache: {
        hit_count: cached.hit_count + 1,
        created_at: cached.created_at,
        ttl: cached.ttl
      }
    };
    
  } catch (error) {
    console.error('Erreur lors de la récupération du cache:', error.message);
    return null;
  }
}

/**
 * Stocke une décision dans le cache
 * @param {string} question - La question posée
 * @param {Object} context - Le contexte de la décision
 * @param {Object} decision - La décision à stocker
 * @param {string} decisionType - Type de décision (voir DECISION_TYPES)
 * @param {Object} options - Options supplémentaires
 * @returns {Object} Résultat de l'opération
 */
async function cacheDecision(question, context, decision, decisionType = 'TECHNICAL', options = {}) {
  try {
    const hash = generateDecisionHash(question, context);
    const ttlDays = options.ttlDays || DECISION_TYPES[decisionType]?.ttlDays || 7;
    
    const ttl = new Date();
    ttl.setDate(ttl.getDate() + ttlDays);
    
    const decisionWithMetadata = {
      ...decision,
      type: decisionType,
      cached_at: new Date().toISOString(),
      ttl_days: ttlDays,
      model_used: options.modelUsed,
      confidence: options.confidence || decision.confidence
    };
    
    const { data, error } = await supabase
      .from('decision_cache')
      .upsert({
        decision_hash: hash,
        question: question.substring(0, 1000), // Limiter la longueur
        context: context || {},
        decision: decisionWithMetadata,
        ttl: ttl.toISOString(),
        hit_count: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'decision_hash'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      hash,
      ttl: ttl.toISOString(),
      decision_id: data.id
    };
    
  } catch (error) {
    console.error('Erreur lors du stockage dans le cache:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Recherche des décisions similaires
 * @param {string} query - Requête de recherche
 * @param {Object} filters - Filtres optionnels
 * @returns {Array} Décisions similaires
 */
async function searchSimilarDecisions(query, filters = {}) {
  try {
    let supabaseQuery = supabase
      .from('decision_cache')
      .select('question, decision, hit_count, created_at')
      .gt('ttl', new Date().toISOString());
    
    // Recherche textuelle (basique)
    if (query) {
      supabaseQuery = supabaseQuery.ilike('question', `%${query}%`);
    }
    
    // Filtres
    if (filters.decisionType) {
      supabaseQuery = supabaseQuery.contains('decision', { type: filters.decisionType });
    }
    
    if (filters.minHits) {
      supabaseQuery = supabaseQuery.gte('hit_count', filters.minHits);
    }
    
    if (filters.minConfidence) {
      supabaseQuery = supabaseQuery.gte('decision->confidence', filters.minConfidence);
    }
    
    // Tri et limite
    supabaseQuery = supabaseQuery
      .order('hit_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(filters.limit || 10);
    
    const { data: decisions, error } = await supabaseQuery;
    
    if (error) throw error;
    
    return decisions || [];
    
  } catch (error) {
    console.error('Erreur lors de la recherche de décisions:', error.message);
    return [];
  }
}

/**
 * Nettoie le cache expiré
 * @returns {Object} Statistiques de nettoyage
 */
async function cleanupExpiredCache() {
  try {
    const { data, error } = await supabase
      .rpc('cleanup_expired_cache');
    
    if (error) throw error;
    
    return {
      success: true,
      deleted_count: data || 0,
      message: `${data || 0} entrées expirées nettoyées`
    };
    
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtient des statistiques sur le cache
 * @returns {Object} Statistiques du cache
 */
async function getCacheStats() {
  try {
    // Nombre total d'entrées
    const { count: totalCount, error: countError } = await supabase
      .from('decision_cache')
      .select('*', { count: 'exact', head: true });
    
    // Nombre d'entrées valides (non expirées)
    const { count: validCount, error: validError } = await supabase
      .from('decision_cache')
      .select('*', { count: 'exact', head: true })
      .gt('ttl', new Date().toISOString());
    
    // Distribution par type
    const { data: typeDistribution, error: typeError } = await supabase
      .from('decision_cache')
      .select('decision->type as type')
      .gt('ttl', new Date().toISOString());
    
    // Top des hits
    const { data: topHits, error: hitsError } = await supabase
      .from('decision_cache')
      .select('question, hit_count')
      .order('hit_count', { ascending: false })
      .limit(5);
    
    if (countError || validError || typeError || hitsError) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }
    
    // Calculer la distribution
    const distribution = {};
    if (typeDistribution) {
      typeDistribution.forEach(item => {
        const type = item.type || 'UNKNOWN';
        distribution[type] = (distribution[type] || 0) + 1;
      });
    }
    
    // Taux d'utilisation
    const hitRate = await calculateHitRate();
    
    return {
      total_entries: totalCount || 0,
      valid_entries: validCount || 0,
      expired_entries: (totalCount || 0) - (validCount || 0),
      hit_rate: hitRate,
      type_distribution: distribution,
      top_hits: topHits || []
    };
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error.message);
    return {
      error: error.message
    };
  }
}

/**
 * Calcule le taux de hit du cache
 * @returns {number} Taux de hit (0-1)
 */
async function calculateHitRate() {
  try {
    // On estime le taux de hit en fonction des hit_count
    const { data: entries, error } = await supabase
      .from('decision_cache')
      .select('hit_count')
      .gt('ttl', new Date().toISOString());
    
    if (error || !entries || entries.length === 0) {
      return 0;
    }
    
    const totalHits = entries.reduce((sum, entry) => sum + entry.hit_count, 0);
    const avgHitsPerEntry = totalHits / entries.length;
    
    // Normaliser entre 0 et 1 (supposant que >5 hits = bon cache)
    return Math.min(1, avgHitsPerEntry / 5);
    
  } catch (error) {
    console.error('Erreur lors du calcul du hit rate:', error.message);
    return 0;
  }
}

/**
 * Interface pour Magalie - Récupère ou calcule une décision
 * @param {string} question - La question
 * @param {Function} computeFn - Fonction pour calculer la décision si non en cache
 * @param {Object} context - Contexte
 * @param {string} decisionType - Type de décision
 * @returns {Object} La décision (depuis le cache ou nouvellement calculée)
 */
async function getOrComputeDecision(question, computeFn, context = {}, decisionType = 'TECHNICAL') {
  // Essayer le cache d'abord
  const cached = await getCachedDecision(question, context, decisionType);
  
  if (cached) {
    console.log(`[CACHE HIT] Décision récupérée depuis le cache (${cached._cache.hit_count} hits)`);
    return {
      ...cached,
      _from_cache: true
    };
  }
  
  console.log('[CACHE MISS] Calcul de la décision...');
  
  // Calculer la nouvelle décision
  const startTime = Date.now();
  const decision = await computeFn();
  const computeTime = Date.now() - startTime;
  
  // Ajouter des métadonnées
  const decisionWithMetrics = {
    ...decision,
    compute_time_ms: computeTime,
    computed_at: new Date().toISOString()
  };
  
  // Stocker dans le cache
  const cacheResult = await cacheDecision(
    question,
    context,
    decisionWithMetrics,
    decisionType,
    {
      modelUsed: process.env.MODEL_USED,
      confidence: decision.confidence
    }
  );
  
  if (cacheResult.success) {
    console.log(`[CACHE STORED] Décision stockée avec TTL ${DECISION_TYPES[decisionType]?.ttlDays || 7} jours`);
  }
  
  return {
    ...decisionWithMetrics,
    _from_cache: false,
    _cache_result: cacheResult
  };
}

// Interface CLI
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  const commands = {
    get: async () => {
      const [question, contextJson] = args;
      const context = contextJson ? JSON.parse(contextJson) : {};
      const result = await getCachedDecision(question, context);
      console.log(JSON.stringify(result, null, 2));
    },
    
    store: async () => {
      const [question, contextJson, decisionJson, type] = args;
      const context = contextJson ? JSON.parse(contextJson) : {};
      const decision = decisionJson ? JSON.parse(decisionJson) : {};
      const result = await cacheDecision(question, context, decision, type || 'TECHNICAL');
      console.log(JSON.stringify(result, null, 2));
    },
    
    search: async () => {
      const [query, filtersJson] = args;
      const filters = filtersJson ? JSON.parse(filtersJson) : {};
      const results = await searchSimilarDecisions(query, filters);
      console.log(JSON.stringify(results, null, 2));
    },
    
    cleanup: async () => {
      const result = await cleanupExpiredCache();
      console.log(JSON.stringify(result, null, 2));
    },
    
    stats: async () => {
      const result = await getCacheStats();
      console.log(JSON.stringify(result, null, 2));
    },
    
    hash: async () => {
      const [question, contextJson] = args;
      const context = contextJson ? JSON.parse(contextJson) : {};
      const hash = generateDecisionHash(question, context);
      console.log(JSON.stringify({ hash }, null, 2));
    },
    
    help: () => {
      console.log(`
Commandes disponibles:
  node decision-cache.js get "<question>" "<context_json>"
  node decision-cache.js store "<question>" "<context_json>" "<decision_json>" [type]
  node decision-cache.js search "<query>" "<filters_json>"
  node decision-cache.js cleanup
  node decision-cache.js stats
  node decision-cache.js hash "<question>" "<context_json>"
  
Types de décision: TECHNICAL, ARCHITECTURE, PRICING, RESEARCH, COUNCIL
      `);
    }
  };
  
  if (commands[command]) {
    commands[command]().catch(error => {
      console.error('Erreur:', error.message);
      process.exit(1);
    });
  } else {
    console.error(`Commande inconnue: ${command}`);
    commands.help();
    process.exit(1);
  }
}

module.exports = {
  generateDecisionHash,
  getCachedDecision,
  cacheDecision,
  searchSimilarDecisions,
  cleanupExpiredCache,
  getCacheStats,
  getOrComputeDecision,
  DECISION_TYPES
};