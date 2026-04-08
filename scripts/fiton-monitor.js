#!/usr/bin/env node
// Fiton Monitor - Surveillance de Magalie v3.1
// Exécuté toutes les minutes via cron

require('./load-env.js');
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  projectId: process.env.PROJECT_ID || 'all',
  checkInterval: 60000, // 1 minute
  stuckThreshold: 15 * 60 * 1000, // 15 minutes en millisecondes
  budgetWarningThreshold: 80, // 80%
};

// Initialisation Supabase
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Logger
const logger = {
  info: (msg, data = {}) => console.log(JSON.stringify({ level: 'info', msg, ...data, timestamp: new Date().toISOString() })),
  warn: (msg, data = {}) => console.warn(JSON.stringify({ level: 'warn', msg, ...data, timestamp: new Date().toISOString() })),
  error: (msg, data = {}) => console.error(JSON.stringify({ level: 'error', msg, ...data, timestamp: new Date().toISOString() })),
};

// Vérifier les nœuds bloqués
async function checkStuckNodes() {
  try {
    const stuckTime = new Date(Date.now() - config.stuckThreshold).toISOString();
    
    const { data: stuckNodes, error } = await supabase
      .from('project_tree')
      .select('id, project_id, title, state, assigned_to, updated_at')
      .in('state', ['BUILDING', 'VALIDATING', 'INTEGRATING'])
      .lt('updated_at', stuckTime)
      .order('updated_at', { ascending: true });
    
    if (error) throw error;
    
    if (stuckNodes && stuckNodes.length > 0) {
      logger.warn('Nœuds bloqués détectés', { 
        count: stuckNodes.length,
        nodes: stuckNodes.map(n => ({ id: n.id, title: n.title, state: n.state, stuck_for: config.stuckThreshold / 60000 + 'min' }))
      });
      
      // Alerte Discord si configuré
      if (process.env.DISCORD_WEBHOOK_URL) {
        await sendDiscordAlert('stuck_nodes', {
          title: '⚠️ Nœuds bloqués détectés',
          description: `${stuckNodes.length} nœuds sont bloqués depuis plus de 15 minutes`,
          fields: stuckNodes.slice(0, 5).map(n => ({
            name: n.title,
            value: `État: ${n.state} | Assigné: ${n.assigned_to || 'none'}`
          }))
        });
      }
      
      // Tentative de récupération automatique pour les nœuds en BUILDING
      for (const node of stuckNodes.filter(n => n.state === 'BUILDING')) {
        logger.info('Tentative de récupération pour nœud bloqué', { node_id: node.id });
        
        // Reset l'état à PENDING pour retry
        const { error: updateError } = await supabase
          .from('project_tree')
          .update({ 
            state: 'PENDING',
            blocked_reason: `Auto-reset par Fiton après blocage de ${config.stuckThreshold / 60000} minutes`,
            updated_at: new Date().toISOString()
          })
          .eq('id', node.id);
        
        if (updateError) {
          logger.error('Échec de récupération du nœud', { node_id: node.id, error: updateError.message });
        } else {
          logger.info('Nœud réinitialisé avec succès', { node_id: node.id });
        }
      }
    }
    
    return stuckNodes || [];
  } catch (error) {
    logger.error('Erreur lors de la vérification des nœuds bloqués', { error: error.message });
    return [];
  }
}

// Vérifier les budgets
async function checkBudgets() {
  try {
    const { data: budgets, error } = await supabase
      .from('project_budgets')
      .select('project_id, allocated_tokens, spent_tokens, alert_threshold_percent, last_alert_sent')
      .not('project_id', 'is', null);
    
    if (error) throw error;
    
    const alerts = [];
    
    for (const budget of budgets || []) {
      const spentPercent = (budget.spent_tokens / budget.allocated_tokens) * 100;
      const shouldAlert = spentPercent >= budget.alert_threshold_percent;
      
      if (shouldAlert) {
        // Vérifier si une alerte a déjà été envoyée récemment (dans les 2 dernières heures)
        const lastAlert = budget.last_alert_sent ? new Date(budget.last_alert_sent) : null;
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        
        if (!lastAlert || lastAlert < twoHoursAgo) {
          alerts.push({
            project_id: budget.project_id,
            spent_percent: Math.round(spentPercent),
            allocated: budget.allocated_tokens,
            spent: budget.spent_tokens
          });
          
          // Mettre à jour last_alert_sent
          await supabase
            .from('project_budgets')
            .update({ last_alert_sent: new Date().toISOString() })
            .eq('project_id', budget.project_id);
        }
      }
    }
    
    if (alerts.length > 0) {
      logger.warn('Alertes budget déclenchées', { alerts });
      
      if (process.env.DISCORD_WEBHOOK_URL) {
        await sendDiscordAlert('budget_warning', {
          title: '💰 Alertes Budget',
          description: `${alerts.length} projet(s) approchent de leur limite budgétaire`,
          fields: alerts.map(a => ({
            name: `Projet: ${a.project_id}`,
            value: `Dépensé: ${a.spent_percent}% (${a.spent}/${a.allocated} tokens)`
          }))
        });
      }
    }
    
    return alerts;
  } catch (error) {
    logger.error('Erreur lors de la vérification des budgets', { error: error.message });
    return [];
  }
}

// Vérifier la santé des services
async function checkServicesHealth() {
  const services = [
    { name: 'Supabase', check: checkSupabaseHealth },
    { name: 'Redis', check: checkRedisHealth },
    { name: 'OpenClaw', check: checkOpenClawHealth },
    { name: 'Prometheus', check: checkPrometheusHealth }
  ];
  
  const results = [];
  
  for (const service of services) {
    try {
      const healthy = await service.check();
      results.push({ name: service.name, healthy });
      
      if (!healthy) {
        logger.warn(`Service ${service.name} unhealthy`);
      }
    } catch (error) {
      logger.error(`Erreur lors du check de santé pour ${service.name}`, { error: error.message });
      results.push({ name: service.name, healthy: false, error: error.message });
    }
  }
  
  // Si un service critique est down
  const criticalDown = results.filter(r => !r.healthy && ['Supabase', 'OpenClaw'].includes(r.name));
  if (criticalDown.length > 0) {
    logger.error('Services critiques down', { services: criticalDown.map(s => s.name) });
    
    if (process.env.DISCORD_WEBHOOK_URL) {
      await sendDiscordAlert('critical_service_down', {
        title: '🚨 Services Critiques Down',
        description: `${criticalDown.length} service(s) critique(s) sont hors ligne`,
        fields: criticalDown.map(s => ({ name: s.name, value: 'HORS LIGNE' }))
      });
    }
  }
  
  return results;
}

// Checks de santé individuels
async function checkSupabaseHealth() {
  const { data, error } = await supabase.from('project_tree').select('count').limit(1);
  return !error;
}

async function checkRedisHealth() {
  if (!process.env.REDIS_URL) return true; // Optionnel
  
  const { promisify } = require('util');
  const redis = require('redis');
  const client = redis.createClient({ url: process.env.REDIS_URL });
  const pingAsync = promisify(client.ping).bind(client);
  
  try {
    await pingAsync();
    return true;
  } catch {
    return false;
  } finally {
    client.quit();
  }
}

async function checkOpenClawHealth() {
  try {
    execSync('openclaw status', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function checkPrometheusHealth() {
  if (!process.env.PROMETHEUS_URL) return true; // Optionnel
  
  const fetch = require('node-fetch');
  try {
    const response = await fetch(`${process.env.PROMETHEUS_URL}/api/v1/query?query=up`);
    return response.ok;
  } catch {
    return false;
  }
}

// Envoyer une alerte Discord
async function sendDiscordAlert(type, data) {
  if (!process.env.DISCORD_WEBHOOK_URL) return;
  
  const fetch = require('node-fetch');
  const embed = {
    title: data.title,
    description: data.description,
    color: type.includes('critical') ? 0xff0000 : type.includes('warning') ? 0xff9900 : 0x00ff00,
    fields: data.fields || [],
    timestamp: new Date().toISOString(),
    footer: { text: 'Magalie v3.1 - Fiton Monitor' }
  };
  
  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    logger.error('Échec d\'envoi d\'alerte Discord', { error: error.message });
  }
}

// Collecter les métriques
async function collectMetrics() {
  try {
    // Compter les nœuds par état
    const { data: nodeCounts, error: countError } = await supabase
      .from('project_tree')
      .select('state')
      .not('project_id', 'is', null);
    
    if (!countError && nodeCounts) {
      const counts = nodeCounts.reduce((acc, node) => {
        acc[node.state] = (acc[node.state] || 0) + 1;
        return acc;
      }, {});
      
      // Enregistrer dans orchestration_metrics
      for (const [state, count] of Object.entries(counts)) {
        await supabase.from('orchestration_metrics').insert({
          project_id: config.projectId,
          metric_name: `nodes_${state.toLowerCase()}`,
          metric_value: count,
          labels: { state }
        });
      }
    }
    
    // Métriques de performance moyenne
    const { data: perfMetrics, error: perfError } = await supabase
      .from('project_metrics')
      .select('metric_type, value')
      .in('metric_type', ['build_time', 'token_usage'])
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (!perfError && perfMetrics) {
      const avgBuildTime = perfMetrics
        .filter(m => m.metric_type === 'build_time')
        .reduce((sum, m) => sum + parseFloat(m.value), 0) / 
        Math.max(perfMetrics.filter(m => m.metric_type === 'build_time').length, 1);
      
      const avgTokens = perfMetrics
        .filter(m => m.metric_type === 'token_usage')
        .reduce((sum, m) => sum + parseFloat(m.value), 0) / 
        Math.max(perfMetrics.filter(m => m.metric_type === 'token_usage').length, 1);
      
      await supabase.from('orchestration_metrics').insert([
        {
          project_id: config.projectId,
          metric_name: 'avg_build_time_seconds',
          metric_value: avgBuildTime,
          labels: { type: 'performance' }
        },
        {
          project_id: config.projectId,
          metric_name: 'avg_token_usage',
          metric_value: avgTokens,
          labels: { type: 'performance' }
        }
      ]);
    }
    
    logger.info('Métriques collectées avec succès');
  } catch (error) {
    logger.error('Erreur lors de la collecte des métriques', { error: error.message });
  }
}

// Boucle principale
async function main() {
  logger.info('Démarrage de Fiton Monitor', { config: { ...config, supabaseKey: '***' } });
  
  while (true) {
    const cycleStart = Date.now();
    
    try {
      logger.info('Début du cycle de monitoring');
      
      // Exécuter toutes les vérifications en parallèle
      const [stuckNodes, budgetAlerts, servicesHealth] = await Promise.all([
        checkStuckNodes(),
        checkBudgets(),
        checkServicesHealth()
      ]);
      
      // Collecter les métriques
      await collectMetrics();
      
      const cycleDuration = Date.now() - cycleStart;
      
      logger.info('Cycle de monitoring terminé', {
        duration_ms: cycleDuration,
        stuck_nodes: stuckNodes.length,
        budget_alerts: budgetAlerts.length,
        services_healthy: servicesHealth.filter(s => s.healthy).length,
        services_total: servicesHealth.length
      });
      
      // Enregistrer les métriques du monitoring lui-même
      await supabase.from('orchestration_metrics').insert({
        project_id: config.projectId,
        metric_name: 'monitor_cycle_duration_ms',
        metric_value: cycleDuration,
        labels: { component: 'fiton' }
      });
      
    } catch (error) {
      logger.error('Erreur critique dans le cycle de monitoring', { error: error.message, stack: error.stack });
    }
    
    // Attendre jusqu'au prochain cycle
    await new Promise(resolve => setTimeout(resolve, config.checkInterval));
  }
}

// Gestion des signaux
process.on('SIGINT', () => {
  logger.info('Arrêt de Fiton Monitor (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Arrêt de Fiton Monitor (SIGTERM)');
  process.exit(0);
});

// Démarrer
if (require.main === module) {
  main().catch(error => {
    logger.error('Erreur fatale de Fiton Monitor', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

module.exports = {
  checkStuckNodes,
  checkBudgets,
  checkServicesHealth,
  collectMetrics
};