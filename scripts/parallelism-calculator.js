#!/usr/bin/env node
// Calculateur de parallélisme dynamique pour Magalie v3.1
// Détermine le nombre optimal de Bob simultanés

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Modèles de coût (par million de tokens)
const MODEL_COSTS = {
  'haiku': { input: 0.25, output: 1.25 },
  'sonnet': { input: 3.00, output: 15.00 },
  'opus': { input: 15.00, output: 75.00 }
};

// Facteurs d'ajustement basés sur l'heure
const TIME_FACTORS = {
  'night': { // 2h-6h
    factor: 1.5,
    description: 'Période creuse nocturne'
  },
  'day': { // 9h-17h
    factor: 0.8,
    description: 'Période chargée journée'
  },
  'normal': { // autres heures
    factor: 1.0,
    description: 'Période normale'
  }
};

/**
 * Calcule le parallélisme optimal pour un projet
 * @param {string} projectId - ID du projet
 * @returns {Object} { optimal: number, factors: Object, recommendation: string }
 */
async function calculateOptimalParallelism(projectId) {
  try {
    // 1. Nombre de nœuds READY sans dépendances
    const readyNodes = await getReadyNodes(projectId);
    
    // 2. Budget restant
    const budgetRemaining = await getBudgetRemaining(projectId);
    
    // 3. Performance historique
    const historicalPerformance = await getHistoricalPerformance(projectId);
    
    // 4. Heure de la journée
    const timeFactor = getTimeFactor();
    
    // 5. Complexité des nœuds READY
    const nodeComplexities = await getNodeComplexities(readyNodes);
    
    // Calcul de base: 1 Bob par 2 nœuds
    let baseParallelism = Math.ceil(readyNodes.length / 2);
    
    // Ajustement budget
    const budgetFactor = calculateBudgetFactor(budgetRemaining);
    
    // Ajustement performance
    const performanceFactor = calculatePerformanceFactor(historicalPerformance);
    
    // Ajustement complexité
    const complexityFactor = calculateComplexityFactor(nodeComplexities);
    
    // Calcul final
    let optimal = Math.floor(
      baseParallelism * 
      budgetFactor * 
      timeFactor.factor * 
      performanceFactor *
      complexityFactor
    );
    
    // Limites: min 2, max 6
    optimal = Math.max(2, Math.min(6, optimal));
    
    // Vérifier la cohérence
    if (optimal > readyNodes.length) {
      optimal = Math.max(2, readyNodes.length);
    }
    
    return {
      optimal,
      factors: {
        baseParallelism,
        budgetFactor: parseFloat(budgetFactor.toFixed(2)),
        timeFactor: timeFactor.factor,
        timeDescription: timeFactor.description,
        performanceFactor: parseFloat(performanceFactor.toFixed(2)),
        complexityFactor: parseFloat(complexityFactor.toFixed(2)),
        readyNodesCount: readyNodes.length,
        budgetRemainingTokens: budgetRemaining.tokens,
        budgetRemainingPercent: budgetRemaining.percent
      },
      recommendation: generateRecommendation(
        optimal, 
        readyNodes.length, 
        budgetRemaining, 
        nodeComplexities
      )
    };
    
  } catch (error) {
    console.error('Erreur dans calculateOptimalParallelism:', error);
    // Fallback: retourner une valeur par défaut
    return {
      optimal: 2,
      factors: { error: error.message },
      recommendation: 'Utilisation du parallélisme par défaut en raison d\'une erreur'
    };
  }
}

/**
 * Récupère les nœuds READY sans dépendances
 */
async function getReadyNodes(projectId) {
  const { data: nodes, error } = await supabase
    .from('project_tree')
    .select('id, title, dependencies, metrics, optimization_hints')
    .eq('project_id', projectId)
    .eq('state', 'READY')
    .eq('atomic', true);
  
  if (error) throw error;
  
  // Filtrer les nœuds dont les dépendances sont satisfaites
  const readyNodes = [];
  
  for (const node of nodes || []) {
    if (!node.dependencies || node.dependencies.length === 0) {
      readyNodes.push(node);
    } else {
      // Vérifier si toutes les dépendances sont DONE
      const { data: deps, error: depsError } = await supabase
        .from('project_tree')
        .select('id, state')
        .in('id', node.dependencies);
      
      if (!depsError && deps && deps.every(dep => dep.state === 'DONE')) {
        readyNodes.push(node);
      }
    }
  }
  
  return readyNodes;
}

/**
 * Récupère le budget restant
 */
async function getBudgetRemaining(projectId) {
  const { data: budget, error } = await supabase
    .from('project_budgets')
    .select('allocated_tokens, spent_tokens, allocated_dollars, spent_dollars')
    .eq('project_id', projectId)
    .single();
  
  if (error) {
    // Budget non trouvé, utiliser les valeurs par défaut
    return {
      tokens: 100000,
      dollars: 10.00,
      percent: 100
    };
  }
  
  const remainingTokens = budget.allocated_tokens - budget.spent_tokens;
  const remainingPercent = (remainingTokens / budget.allocated_tokens) * 100;
  
  return {
    tokens: remainingTokens,
    dollars: budget.allocated_dollars - budget.spent_dollars,
    percent: remainingPercent
  };
}

/**
 * Récupère les performances historiques
 */
async function getHistoricalPerformance(projectId) {
  const { data: metrics, error } = await supabase
    .from('project_metrics')
    .select('metric_type, value, context')
    .eq('metric_type', 'build_time')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error || !metrics || metrics.length === 0) {
    return {
      avgBuildTime: 300, // 5 minutes par défaut
      successRate: 0.85, // 85% par défaut
      sampleSize: 0
    };
  }
  
  const buildTimes = metrics.map(m => parseFloat(m.value));
  const avgBuildTime = buildTimes.reduce((sum, time) => sum + time, 0) / buildTimes.length;
  
  // Calculer le taux de succès (approximatif)
  const successRate = metrics.filter(m => {
    const context = m.context || {};
    return context.success !== false; // Supposer succès si non explicitement false
  }).length / metrics.length;
  
  return {
    avgBuildTime,
    successRate,
    sampleSize: metrics.length
  };
}

/**
 * Détermine le facteur temporel
 */
function getTimeFactor() {
  const hour = new Date().getHours();
  
  if (hour >= 2 && hour < 6) {
    return TIME_FACTORS.night;
  } else if (hour >= 9 && hour < 17) {
    return TIME_FACTORS.day;
  } else {
    return TIME_FACTORS.normal;
  }
}

/**
 * Récupère les complexités des nœuds
 */
async function getNodeComplexities(nodes) {
  if (!nodes || nodes.length === 0) {
    return { avgComplexity: 1, maxComplexity: 1, distribution: [] };
  }
  
  const complexities = nodes.map(node => {
    const metrics = node.metrics || {};
    return metrics.complexity_score || 1;
  });
  
  const avgComplexity = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
  const maxComplexity = Math.max(...complexities);
  
  // Distribution des complexités
  const distribution = [1, 2, 3, 4, 5].map(level => ({
    level,
    count: complexities.filter(c => Math.round(c) === level).length
  }));
  
  return { avgComplexity, maxComplexity, distribution };
}

/**
 * Calcule le facteur budget
 */
function calculateBudgetFactor(budgetRemaining) {
  // Normalisé entre 0.5 et 1.5
  const normalized = budgetRemaining.percent / 100;
  
  if (normalized > 0.8) {
    return 1.5; // Budget abondant
  } else if (normalized > 0.5) {
    return 1.0; // Budget normal
  } else if (normalized > 0.2) {
    return 0.8; // Budget serré
  } else {
    return 0.5; // Budget critique
  }
}

/**
 * Calcule le facteur performance
 */
function calculatePerformanceFactor(historicalPerformance) {
  const { avgBuildTime, successRate, sampleSize } = historicalPerformance;
  
  if (sampleSize < 10) {
    return 1.0; // Pas assez de données
  }
  
  // Plus les builds sont rapides, plus on peut paralléliser
  let timeFactor = 1.0;
  if (avgBuildTime < 180) { // < 3 minutes
    timeFactor = 1.3;
  } else if (avgBuildTime < 600) { // < 10 minutes
    timeFactor = 1.0;
  } else { // > 10 minutes
    timeFactor = 0.7;
  }
  
  // Plus le taux de succès est élevé, plus on peut paralléliser
  let successFactor = 1.0;
  if (successRate > 0.9) {
    successFactor = 1.2;
  } else if (successRate > 0.7) {
    successFactor = 1.0;
  } else {
    successFactor = 0.8;
  }
  
  return (timeFactor + successFactor) / 2;
}

/**
 * Calcule le facteur complexité
 */
function calculateComplexityFactor(nodeComplexities) {
  const { avgComplexity, maxComplexity } = nodeComplexities;
  
  if (maxComplexity >= 4) {
    return 0.7; // Nœuds complexes → moins de parallélisme
  } else if (avgComplexity >= 3) {
    return 0.9; // Complexité moyenne
  } else {
    return 1.1; // Nœuds simples → plus de parallélisme
  }
}

/**
 * Génère une recommandation lisible
 */
function generateRecommendation(optimal, readyCount, budgetRemaining, nodeComplexities) {
  const recommendations = [];
  
  if (optimal === 2 && readyCount > 2) {
    recommendations.push("Parallélisme limité à 2 en raison de contraintes budgétaires ou de complexité");
  }
  
  if (budgetRemaining.percent < 30) {
    recommendations.push(`Budget restant faible: ${budgetRemaining.percent.toFixed(1)}%`);
  }
  
  if (nodeComplexities.maxComplexity >= 4) {
    recommendations.push("Nœuds complexes détectés - parallélisme réduit pour éviter les échecs");
  }
  
  if (optimal === 6) {
    recommendations.push("Conditions optimales pour le parallélisme maximum");
  }
  
  const defaultMsg = `Utiliser ${optimal} instance(s) de Bob simultanément pour traiter ${readyCount} nœuds READY`;
  
  if (recommendations.length > 0) {
    return `${defaultMsg}. ${recommendations.join('. ')}.`;
  }
  
  return defaultMsg;
}

/**
 * Met à jour la configuration OpenClaw avec le parallélisme calculé
 */
async function updateOpenClawParallelism(projectId, parallelism) {
  try {
    // Lire la config actuelle
    const { execSync } = require('child_process');
    const currentConfig = JSON.parse(execSync('openclaw config show --json', { encoding: 'utf-8' }));
    
    // Mettre à jour
    if (!currentConfig.agents) currentConfig.agents = {};
    if (!currentConfig.agents.defaults) currentConfig.agents.defaults = {};
    if (!currentConfig.agents.defaults.subagents) currentConfig.agents.defaults.subagents = {};
    
    currentConfig.agents.defaults.subagents.maxConcurrent = parallelism;
    
    // Écrire la config mise à jour
    const fs = require('fs');
    const configPath = '/Users/house/.openclaw/openclaw.json';
    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
    
    // Redémarrer le gateway si nécessaire
    if (process.env.AUTO_RESTART_GATEWAY === 'true') {
      execSync('openclaw gateway restart', { stdio: 'pipe' });
    }
    
    // Enregistrer la décision
    await supabase.from('orchestration_metrics').insert({
      project_id: projectId,
      metric_name: 'parallelism_adjustment',
      metric_value: parallelism,
      labels: { type: 'dynamic_adjustment', source: 'parallelism_calculator' }
    });
    
    return { success: true, message: `Parallélisme mis à jour à ${parallelism}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Interface CLI
if (require.main === module) {
  const projectId = process.argv[2] || process.env.PROJECT_ID;
  
  if (!projectId) {
    console.error('Usage: node parallelism-calculator.js <project-id>');
    console.error('Ou définir la variable d\'environnement PROJECT_ID');
    process.exit(1);
  }
  
  calculateOptimalParallelism(projectId)
    .then(async (result) => {
      console.log(JSON.stringify(result, null, 2));
      
      // Mettre à jour OpenClaw si demandé
      if (process.env.UPDATE_OPENCLAW === 'true') {
        const updateResult = await updateOpenClawParallelism(projectId, result.optimal);
        console.log('Mise à jour OpenClaw:', JSON.stringify(updateResult, null, 2));
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur:', error.message);
      process.exit(1);
    });
}

module.exports = {
  calculateOptimalParallelism,
  updateOpenClawParallelism,
  getTimeFactor,
  calculateBudgetFactor
};