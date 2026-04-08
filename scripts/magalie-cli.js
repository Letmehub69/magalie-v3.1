#!/usr/bin/env node
// Interface CLI pour Magalie v3.1
// Fournit des commandes pour gérer Magalie via OpenClaw

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const configPath = path.join(__dirname, '../config/openclaw-magalie.json');
const sqliteMode = process.env.SQLITE_MODE === 'true' || process.env.SQLITE_DB_PATH;
const supabase = !sqliteMode && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Logger
function log(level, message, data = {}) {
  const entry = { level, message, timestamp: new Date().toISOString(), ...data };
  console.log(JSON.stringify(entry));
}

// Commandes disponibles
const commands = {
  /**
   * Démarrer Magalie pour un projet
   */
  async start({ project, budget = '100000', parallelism = 'dynamic', config = configPath }) {
    log('info', 'Démarrage de Magalie', { project, budget, parallelism });
    
    // Vérifier les prérequis
    await checkPrerequisites();
    
    // Appliquer la configuration seulement si pas en mode SQLite
    const sqliteMode = process.env.SQLITE_MODE === 'true' || process.env.SQLITE_DB_PATH;
    if (!sqliteMode) {
      try {
        await applyConfig(config);
      } catch (error) {
        log('warn', 'Échec application config, continuation', { error: error.message });
      }
    } else {
      log('info', 'Mode SQLite - skipping config application');
    }
    
    // Créer l'entrée budget si nécessaire
    if (supabase) {
      await ensureBudget(project, parseInt(budget));
    }
    
    // Démarrer les agents
    const magalieSession = spawn('openclaw', [
      'agent',
      '--agent', 'magalie',
      '--message', `Orchestrer le projet ${project} avec budget ${budget} tokens`,
      '--thinking', 'high'
    ], { stdio: 'inherit', detached: true });
    
    // Démarrer Fiton (monitor)
    setTimeout(() => {
      spawn('openclaw', [
        'agent',
        '--agent', 'fiton',
        '--message', `Surveillance Magalie v3.1 - projet ${project}`,
        '--thinking', 'low'
      ], { stdio: 'inherit', detached: true });
    }, 5000);
    
    log('info', 'Magalie démarré avec succès', { project, pid: magalieSession.pid });
    
    // Enregistrer les PID pour arrêt ultérieur
    const pidFile = `/tmp/magalie-${project}.pids`;
    require('fs').writeFileSync(pidFile, JSON.stringify({
      magalie: magalieSession.pid,
      timestamp: new Date().toISOString()
    }));
    
    // Garder le processus en vie
    process.on('SIGINT', () => {
      log('info', 'Arrêt de Magalie...');
      magalieSession.kill('SIGINT');
      process.exit(0);
    });
    
    magalieSession.on('exit', (code) => {
      log(code === 0 ? 'info' : 'error', 'Magalie terminé', { code });
      process.exit(code);
    });
  },
  
  /**
   * Arrêter Magalie pour un projet
   */
  async stop({ project, saveState = true }) {
    log('info', 'Arrêt de Magalie', { project, saveState });
    
    // Sauvegarder l'état si demandé
    if (saveState && supabase) {
      await saveProjectState(project);
    }
    
    // Arrêter via les PID enregistrés
    const pidFile = `/tmp/magalie-${project}.pids`;
    try {
      if (require('fs').existsSync(pidFile)) {
        const pids = JSON.parse(require('fs').readFileSync(pidFile, 'utf8'));
        if (pids.magalie) {
          try {
            process.kill(pids.magalie, 'SIGINT');
            log('info', 'Processus Magalie arrêté', { pid: pids.magalie });
          } catch (e) {
            log('warn', 'Impossible d\'arrêter le processus Magalie', { pid: pids.magalie, error: e.message });
          }
        }
        // Supprimer le fichier PID
        require('fs').unlinkSync(pidFile);
      }
    } catch (error) {
      log('warn', 'Erreur lors de l\'arrêt via PID', { error: error.message });
    }
    
    // Également essayer d'arrêter via openclaw sessions (si disponible)
    try {
      execSync('openclaw sessions --json', { stdio: 'pipe' });
      // Si la commande fonctionne, on peut essayer d'arrêter les sessions
      // Pour l'instant, on se contente des PID
    } catch (e) {
      // Command non disponible, ignorer
    }
    
    log('info', 'Magalie arrêté', { project });
  },
  
  /**
   * Obtenir le statut d'un projet
   */
  async status({ project }) {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    // Récupérer les statistiques du projet
    const { data: nodes, error } = await supabase
      .from('project_tree')
      .select('state')
      .eq('project_id', project);
    
    if (error) throw error;
    
    const counts = (nodes || []).reduce((acc, node) => {
      acc[node.state] = (acc[node.state] || 0) + 1;
      return acc;
    }, {});
    
    // Récupérer le budget
    const { data: budget } = await supabase
      .from('project_budgets')
      .select('*')
      .eq('project_id', project)
      .single()
      .catch(() => ({ data: null }));
    
    // Récupérer les métriques récentes
    const { data: metrics } = await supabase
      .from('orchestration_metrics')
      .select('metric_name, metric_value, timestamp')
      .eq('project_id', project)
      .order('timestamp', { ascending: false })
      .limit(10);
    
    const status = {
      project,
      node_counts: counts,
      total_nodes: Object.values(counts).reduce((a, b) => a + b, 0),
      budget: budget ? {
        allocated_tokens: budget.allocated_tokens,
        spent_tokens: budget.spent_tokens,
        remaining_percent: ((budget.allocated_tokens - budget.spent_tokens) / budget.allocated_tokens * 100).toFixed(1)
      } : null,
      recent_metrics: metrics,
      timestamp: new Date().toISOString()
    };
    
    console.log(JSON.stringify(status, null, 2));
    return status;
  },
  
  /**
   * Obtenir les métriques d'un projet
   */
  async metrics({ project, detailed = false }) {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    const queries = [
      // Métriques de performance
      supabase
        .from('project_metrics')
        .select('metric_type, AVG(value) as avg_value, COUNT(*) as count')
        .eq('metric_type', 'build_time')
        .group('metric_type'),
      
      // Métriques d'orchestration
      supabase
        .from('orchestration_metrics')
        .select('metric_name, metric_value, timestamp')
        .eq('project_id', project)
        .order('timestamp', { ascending: false })
        .limit(detailed ? 100 : 20),
      
      // Budget
      supabase
        .from('project_budgets')
        .select('*')
        .eq('project_id', project)
        .single(),
      
      // Cache stats
      supabase
        .rpc('get_cache_stats')
        .catch(() => ({ data: null }))
    ];
    
    const [perf, orch, budget, cache] = await Promise.all(queries);
    
    const metrics = {
      project,
      performance: perf.data || [],
      orchestration: orch.data || [],
      budget: budget.data || null,
      cache: cache.data || null,
      collected_at: new Date().toISOString()
    };
    
    console.log(JSON.stringify(metrics, null, 2));
    return metrics;
  },
  
  /**
   * Gérer le budget d'un projet
   */
  async budget({ project, addTokens, showDetailed = false }) {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    if (addTokens) {
      // Ajouter des tokens au budget
      const { data: current, error: fetchError } = await supabase
        .from('project_budgets')
        .select('allocated_tokens')
        .eq('project_id', project)
        .single();
      
      if (fetchError && fetchError.code === 'PGRST116') {
        // Créer une nouvelle entrée
        const { error: insertError } = await supabase
          .from('project_budgets')
          .insert({
            project_id: project,
            allocated_tokens: parseInt(addTokens),
            spent_tokens: 0
          });
        
        if (insertError) throw insertError;
        log('info', 'Budget créé', { project, allocated_tokens: addTokens });
      } else if (fetchError) {
        throw fetchError;
      } else {
        // Mettre à jour l'existant
        const { error: updateError } = await supabase
          .from('project_budgets')
          .update({
            allocated_tokens: current.allocated_tokens + parseInt(addTokens),
            updated_at: new Date().toISOString()
          })
          .eq('project_id', project);
        
        if (updateError) throw updateError;
        log('info', 'Budget mis à jour', { 
          project, 
          added_tokens: addTokens,
          new_total: current.allocated_tokens + parseInt(addTokens)
        });
      }
    }
    
    // Afficher le budget actuel
    const { data: budget, error } = await supabase
      .from('project_budgets')
      .select('*')
      .eq('project_id', project)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`Aucun budget trouvé pour le projet ${project}`);
        return null;
      }
      throw error;
    }
    
    const remaining = budget.allocated_tokens - budget.spent_tokens;
    const percent = (budget.spent_tokens / budget.allocated_tokens * 100).toFixed(1);
    
    const output = {
      project,
      allocated_tokens: budget.allocated_tokens,
      spent_tokens: budget.spent_tokens,
      remaining_tokens: remaining,
      spent_percent: percent,
      alert_threshold: budget.alert_threshold_percent,
      is_over_threshold: budget.spent_tokens >= (budget.allocated_tokens * budget.alert_threshold_percent / 100),
      last_alert: budget.last_alert_sent
    };
    
    if (showDetailed) {
      // Ajouter l'historique des dépenses
      const { data: expenses } = await supabase
        .from('project_metrics')
        .select('created_at, value, context')
        .eq('metric_type', 'token_usage')
        .order('created_at', { ascending: true });
      
      output.expense_history = expenses || [];
    }
    
    console.log(JSON.stringify(output, null, 2));
    return output;
  },
  
  /**
   * Lister les nœuds d'un projet
   */
  async nodes({ project, state, limit = 50 }) {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    let query = supabase
      .from('project_tree')
      .select('id, title, state, cycle_type, atomic, assigned_to, updated_at, metrics')
      .eq('project_id', project)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }
    
    const { data: nodes, error } = await query;
    
    if (error) throw error;
    
    const output = {
      project,
      filter_state: state,
      total: nodes.length,
      nodes: nodes.map(node => ({
        id: node.id,
        title: node.title,
        state: node.state,
        cycle_type: node.cycle_type,
        atomic: node.atomic,
        assigned_to: node.assigned_to,
        last_updated: node.updated_at,
        complexity: node.metrics?.complexity_score || 1
      }))
    };
    
    console.log(JSON.stringify(output, null, 2));
    return output;
  },
  
  /**
   * Gérer un nœud spécifique
   */
  async node({ project, node, reset = false }) {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }
    
    if (reset) {
      const { error } = await supabase
        .from('project_tree')
        .update({
          state: 'PENDING',
          blocked_reason: 'Reset manuel',
          attempt_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', node)
        .eq('project_id', project);
      
      if (error) throw error;
      
      log('info', 'Nœud réinitialisé', { project, node });
      return { success: true, action: 'reset' };
    }
    
    // Afficher les détails du nœud
    const { data: nodeData, error } = await supabase
      .from('project_tree')
      .select('*')
      .eq('id', node)
      .eq('project_id', project)
      .single();
    
    if (error) throw error;
    
    console.log(JSON.stringify(nodeData, null, 2));
    return nodeData;
  },
  
  /**
   * Afficher les logs
   */
  async logs({ project, tail = 100 }) {
    // Lire les logs OpenClaw
    const logPath = path.join(process.env.HOME, '.openclaw/logs/gateway.log');
    
    try {
      const logs = await fs.readFile(logPath, 'utf-8');
      const lines = logs.split('\n').filter(line => line.includes(`magalie-${project}`));
      const recent = lines.slice(-tail);
      
      console.log(recent.join('\n'));
      return { lines: recent.length };
    } catch (error) {
      console.error('Impossible de lire les logs:', error.message);
      return { error: error.message };
    }
  },
  
  /**
   * Pause/Reprise d'un projet
   */
  async pause({ project }) {
    log('info', 'Mise en pause du projet', { project });
    
    // Marquer tous les nœuds non terminés comme PAUSED
    if (supabase) {
      const { error } = await supabase
        .from('project_tree')
        .update({
          state: 'PAUSED',
          updated_at: new Date().toISOString()
        })
        .eq('project_id', project)
        .not('state', 'in', '("DONE", "FAILED")');
      
      if (error) throw error;
    }
    
    // Arrêter les agents
    await commands.stop({ project, saveState: true });
    
    log('info', 'Projet mis en pause', { project });
    return { success: true, action: 'pause' };
  },
  
  async resume({ project, budget }) {
    log('info', 'Reprise du projet', { project, budget });
    
    // Remettre les nœuds PAUSED en PENDING
    if (supabase) {
      const { error } = await supabase
        .from('project_tree')
        .update({
          state: 'PENDING',
          updated_at: new Date().toISOString()
        })
        .eq('project_id', project)
        .eq('state', 'PAUSED');
      
      if (error) throw error;
    }
    
    // Redémarrer avec le nouveau budget
    if (budget) {
      await commands.budget({ project, addTokens: budget });
    }
    
    await commands.start({ project, budget: budget || '100000' });
    
    return { success: true, action: 'resume' };
  },
  
  /**
   * Vérifier la santé du système
   */
  async health() {
    const checks = [];
    
    // OpenClaw
    try {
      execSync('openclaw status', { stdio: 'pipe' });
      checks.push({ service: 'OpenClaw', status: 'healthy' });
    } catch {
      checks.push({ service: 'OpenClaw', status: 'unhealthy' });
    }
    
    // Supabase
    if (supabase) {
      try {
        await supabase.from('project_tree').select('count').limit(1);
        checks.push({ service: 'Supabase', status: 'healthy' });
      } catch {
        checks.push({ service: 'Supabase', status: 'unhealthy' });
      }
    }
    
    // Redis (optionnel)
    if (process.env.REDIS_URL) {
      try {
        const redis = require('redis');
        const client = redis.createClient({ url: process.env.REDIS_URL });
        await client.ping();
        client.quit();
        checks.push({ service: 'Redis', status: 'healthy' });
      } catch {
        checks.push({ service: 'Redis', status: 'unhealthy' });
      }
    }
    
    const allHealthy = checks.every(c => c.status === 'healthy');
    const result = {
      timestamp: new Date().toISOString(),
      healthy: allHealthy,
      checks
    };
    
    console.log(JSON.stringify(result, null, 2));
    return result;
  },
  
  /**
   * Aide
   */
  help() {
    console.log(`
Usage: node magalie-cli.js <command> [options]

Commandes disponibles:
  start --project <id> [--budget <tokens>] [--parallelism <n>] [--config <path>]
  stop --project <id> [--save-state]
  status --project <id>
  metrics --project <id> [--detailed]
  budget --project <id> [--add-tokens <n>] [--detailed]
  nodes --project <id> [--state <state>] [--limit <n>]
  node --project <id> --node <node-id> [--reset]
  logs --project <id> [--tail <n>]
  pause --project <id>
  resume --project <id> [--budget <tokens>]
  health

Exemples:
  node magalie-cli.js start --project mission-control-v2 --budget 150000
  node magalie-cli.js status --project mission-control-v2
  node magalie-cli.js budget --project mission-control-v2 --add-tokens 50000
    `);
  }
};

// Fonctions utilitaires
async function checkPrerequisites() {
  // Mode SQLite autorisé
  const sqliteMode = process.env.SQLITE_MODE === 'true' || process.env.SQLITE_DB_PATH;
  
  if (!sqliteMode) {
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
    }
  }
  
  // Vérifier qu'OpenClaw est installé
  try {
    execSync('which openclaw', { stdio: 'pipe' });
  } catch {
    throw new Error('OpenClaw non trouvé dans PATH');
  }
}

async function applyConfig(configFile) {
  try {
    const configContent = await fs.readFile(configFile, 'utf-8');
    const config = JSON.parse(configContent);
    
    // Fusionner avec la config existante
    let currentConfig = {};
    try {
      const configPath = execSync('openclaw config file', { encoding: 'utf-8' }).trim();
      const expandedPath = configPath.replace(/^~/, require('os').homedir());
      const currentContent = await fs.readFile(expandedPath, 'utf-8');
      currentConfig = JSON.parse(currentContent);
    } catch (readError) {
      log('warn', 'Impossible de lire la config OpenClaw, utilisation config vide', { error: readError.message });
      currentConfig = {};
    }
    
    // Fusion profonde
    const merged = deepMerge(currentConfig, config);
    
    // Écrire la config temporaire
    const tempFile = '/tmp/openclaw-magalie-merged.json';
    await fs.writeFile(tempFile, JSON.stringify(merged, null, 2));
    
    // Appliquer avec openclaw config set --batch-file
    try {
      execSync(`openclaw config set --batch-file ${tempFile}`, { stdio: 'pipe' });
      log('info', 'Configuration appliquée', { config_file: configFile });
    } catch (applyError) {
      log('warn', 'Échec application config via batch, essai manuel', { error: applyError.message });
      // Fallback: essayer de patcher directement le fichier
      try {
        const configPath = execSync('openclaw config file', { encoding: 'utf-8' }).trim();
        const expandedPath = configPath.replace(/^~/, require('os').homedir());
        await fs.writeFile(expandedPath, JSON.stringify(merged, null, 2));
        log('info', 'Configuration écrite directement dans le fichier', { path: expandedPath });
      } catch (fallbackError) {
        log('error', 'Échec de l\'écriture directe', { error: fallbackError.message });
      }
    }
  } catch (error) {
    log('error', 'Erreur lors de l\'application de la configuration', { error: error.message });
    // Ne pas throw, continuer malgré l'erreur
  }
}

async function ensureBudget(projectId, budget) {
  if (!supabase) return;
  
  try {
    const { data: existing, error } = await supabase
      .from('project_budgets')
      .select('id')
      .eq('project_id', projectId)
      .single();
    
    if (error || !existing) {
      await supabase.from('project_budgets').insert({
        project_id: projectId,
        allocated_tokens: budget,
        spent_tokens: 0
      });
      log('info', 'Budget créé', { project: projectId, budget });
    }
  } catch (err) {
    // Si la table n'existe pas ou autre erreur, on continue
    log('warn', 'Erreur lors de la vérification du budget', { error: err.message });
  }
}

async function saveProjectState(projectId) {
  if (!supabase) return;
  
  // Exporter l'état actuel
  const { data: nodes } = await supabase
    .from('project_tree')
    .select('*')
    .eq('project_id', projectId);
  
  const { data: budget } = await supabase
    .from('project_budgets')
    .select('*')
    .eq('project_id', projectId)
    .single()
    .catch(() => ({ data: null }));
  
  const state = {
    project_id: projectId,
    nodes: nodes || [],
    budget: budget,
    exported_at: new Date().toISOString()
  };
  
  const stateFile = path.join(__dirname, `../state/${projectId}-${Date.now()}.json`);
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
  
  log('info', 'État sauvegardé', { project: projectId, file: stateFile });
}

function deepMerge(target, source) {
  const output = { ...target };
  
  for (const key in source) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  
  return output;
}

// Parse les arguments de ligne de commande
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { _: [] };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      
      if (next && !next.startsWith('--')) {
        result[key] = next;
        i++;
      } else {
        result[key] = true;
      }
    } else {
      result._.push(arg);
    }
  }
  
  return result;
}

// Point d'entrée principal
async function main() {
  try {
    const args = parseArgs();
    const command = args._[0] || 'help';
    
    if (!commands[command]) {
      console.error(`Commande inconnue: ${command}`);
      commands.help();
      process.exit(1);
    }
    
    await commands[command](args);
    
  } catch (error) {
    log('error', 'Erreur fatale', { error: error.message, stack: error.stack });
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = commands;