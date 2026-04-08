const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'magalie-cli.js');
let content = fs.readFileSync(filePath, 'utf8');

const oldStart = `  async start({ project, budget = '100000', parallelism = 'dynamic', config = configPath }) {
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
      'sessions', 'spawn',
      '--agent', 'magalie',
      '--task', \`Orchestrer le projet \${project} avec budget \${budget} tokens\`,
      '--label', \`magalie-\${project}\`,
      '--runtime', 'acp',
      '--mode', 'session',
      '--thread'
    ], { stdio: 'inherit' });
    
    // Démarrer Fiton (monitor)
    setTimeout(() => {
      spawn('openclaw', [
        'sessions', 'spawn',
        '--agent', 'fiton',
        '--task', \`Surveillance Magalie v3.1 - projet \${project}\`,
        '--label', \`fiton-monitor-\${project}\`,
        '--runtime', 'subagent'
      ], { stdio: 'inherit' });
    }, 5000);
    
    log('info', 'Magalie démarré avec succès', { project, pid: magalieSession.pid });
    
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
  }`;

const newStart = `  async start({ project, budget = '100000', parallelism = 'dynamic', config = configPath }) {
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
    
    // Démarrer Magalie (agent principal)
    const magalieSession = spawn('openclaw', [
      'agent',
      '--agent', 'magalie',
      '--message', \`Orchestrer le projet \${project} avec budget \${budget} tokens\`,
      '--thinking', 'high'
    ], { stdio: 'inherit', detached: true });
    
    // Démarrer Fiton (monitor) après un délai
    setTimeout(() => {
      spawn('openclaw', [
        'agent',
        '--agent', 'fiton',
        '--message', \`Surveillance Magalie v3.1 - projet \${project}\`,
        '--thinking', 'low'
      ], { stdio: 'inherit', detached: true });
    }, 5000);
    
    log('info', 'Magalie démarré avec succès', { project, pid: magalieSession.pid });
    
    // Enregistrer les PID pour arrêt ultérieur
    const pidFile = \`/tmp/magalie-\${project}.pids\`;
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
  }`;

if (content.includes(oldStart)) {
  content = content.replace(oldStart, newStart);
  fs.writeFileSync(filePath, content);
  console.log('✅ Fonction start corrigée');
} else {
  console.log('❌ Ancien texte non trouvé');
  // Essayer avec une version légèrement différente
  const altOld = `async start({ project, budget = '100000', parallelism = 'dynamic', config = configPath }) {`;
  const startIdx = content.indexOf(altOld);
  if (startIdx !== -1) {
    // Trouver la fin de la fonction
    let braceCount = 0;
    let idx = startIdx;
    for (; idx < content.length; idx++) {
      if (content[idx] === '{') braceCount++;
      if (content[idx] === '}') {
        braceCount--;
        if (braceCount === 0) {
          // Trouvé la fin de la fonction
          idx++; // inclure '}'
          // Vérifier s'il y a une virgule après
          if (content[idx] === ',') idx++;
          const oldFunc = content.substring(startIdx, idx);
          console.log('Fonction trouvée, longueur:', oldFunc.length);
          // Remplacer
          content = content.substring(0, startIdx) + newStart + content.substring(idx);
          fs.writeFileSync(filePath, content);
          console.log('✅ Fonction start remplacée (méthode alternative)');
          break;
        }
      }
    }
  } else {
    console.log('❌ Impossible de trouver la fonction start');
  }
}