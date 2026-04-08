#!/usr/bin/env node
/**
 * Fusionne la configuration Magalie v3.1 avec OpenClaw
 */

const fs = require('fs');
const path = require('path');

// Chemins
const HOME = process.env.HOME;
const currentConfigPath = path.join(HOME, '.openclaw', 'openclaw.json');
const magalieConfigPath = path.join(__dirname, '..', 'config', 'openclaw-magalie.json');
const backupPath = currentConfigPath + '.backup';

console.log('='.repeat(60));
console.log('🔧 Configuration Magalie v3.1');
console.log('='.repeat(60));

// 1. Fusionner la configuration
try {
  console.log('\n1. Fusion de la configuration OpenClaw...');
  
  // Vérifier l'existence
  if (!fs.existsSync(currentConfigPath)) {
    throw new Error(`Configuration OpenClaw non trouvée: ${currentConfigPath}`);
  }
  
  if (!fs.existsSync(magalieConfigPath)) {
    throw new Error(`Configuration Magalie non trouvée: ${magalieConfigPath}`);
  }
  
  // Lire
  const current = JSON.parse(fs.readFileSync(currentConfigPath, 'utf8'));
  const magalie = JSON.parse(fs.readFileSync(magalieConfigPath, 'utf8'));
  
  // Sauvegarder
  fs.writeFileSync(backupPath, JSON.stringify(current, null, 2));
  console.log(`✓ Backup créé: ${backupPath}`);
  
  // Fusionner agents.list
  if (!current.agents) current.agents = {};
  if (!current.agents.list) current.agents.list = [];
  
  const magalieAgents = magalie.agents?.list || [];
  const magalieAgentIds = magalieAgents.map(a => a.id).filter(Boolean);
  
  // Garder les agents existants non-Magalie
  const filteredExisting = current.agents.list.filter(agent => 
    !magalieAgentIds.includes(agent.id)
  );
  
  // Combiner
  current.agents.list = [...filteredExisting, ...magalieAgents];
  console.log(`✓ Agents fusionnés: ${magalieAgents.length} agents Magalie ajoutés`);
  
  // Fusionner les intégrations
  if (magalie.integrations) {
    current.integrations = magalie.integrations;
    console.log('✓ Intégrations ajoutées');
  }
  
  // Fusionner channels.routing
  if (magalie.channels?.routing) {
    if (!current.channels) current.channels = {};
    current.channels.routing = magalie.channels.routing;
    console.log('✓ Routing des canaux configuré');
  }
  
  // Ajouter les features
  if (magalie.features) {
    current.features = magalie.features;
    console.log('✓ Features activées');
  }
  
  // Ajouter budgeting si présent
  if (magalie.budgeting) {
    current.budgeting = magalie.budgeting;
    console.log('✓ Budgeting configuré');
  }
  
  // Ajouter monitoring si présent
  if (magalie.monitoring) {
    current.monitoring = magalie.monitoring;
    console.log('✓ Monitoring configuré');
  }
  
  // Écrire
  fs.writeFileSync(currentConfigPath, JSON.stringify(current, null, 2));
  console.log(`✓ Configuration fusionnée: ${currentConfigPath}`);
  console.log(`  Total agents: ${current.agents.list.length}`);
  
} catch (error) {
  console.error(`❌ Erreur lors de la fusion: ${error.message}`);
  process.exit(1);
}

// 2. Créer le template .env
console.log('\n2. Création des templates...');
const envTemplate = `# Configuration Magalie v3.1
# Copier ce fichier en .env et remplir les valeurs

# Supabase (obligatoire)
SUPABASE_URL=https://ton-projet.supabase.co
SUPABASE_ANON_KEY=ton_cle_anon_public
SUPABASE_SERVICE_ROLE_KEY=ton_cle_service_role_secret

# Anthropic (pour Claude Sonnet/Haiku)
ANTHROPIC_API_KEY=ta_clé_anthropic

# Redis (optionnel, pour le cache)
REDIS_URL=redis://localhost:6379

# Monitoring (optionnel)
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3001

# Alertes (optionnel)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
TELEGRAM_BOT_TOKEN=ton_token_bot
TELEGRAM_CHAT_ID=ton_chat_id

# Project spécifique
PROJECT_ID=mission-control-v2
`;

const envPath = path.join(__dirname, '..', '.env.example');
fs.writeFileSync(envPath, envTemplate);
console.log(`✓ Template .env créé: ${envPath}`);

// 3. Créer le script de setup
const setupScript = `#!/bin/bash
# Script de setup Magalie v3.1

echo "🔧 Setup Magalie v3.1"

# 1. Vérifier les dépendances
echo "1. Vérification des dépendances..."
command -v node >/dev/null 2>&1 || { echo "Node.js requis"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm requis"; exit 1; }

# 2. Installer les dépendances Node.js
echo "2. Installation des dépendances..."
cd "$(dirname "\$0")"
npm install 2>/dev/null || echo "Note: package.json peut nécessiter npm install manuel"

# 3. Vérifier les variables d'environnement
echo "3. Configuration de l'environnement..."
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé"
    echo "   Copie .env.example vers .env et remplis les valeurs:"
    echo "   cp .env.example .env"
    echo "   nano .env (ou ton éditeur préféré)"
    exit 1
fi

# 4. Charger les variables
set -a
source .env
set +a

# 5. Vérifier les variables requises
if [ -z "\$SUPABASE_URL" ] || [ -z "\$SUPABASE_ANON_KEY" ]; then
    echo "❌ Variables Supabase manquantes dans .env"
    exit 1
fi

echo "✅ Setup terminé"
echo ""
echo "Pour démarrer Magalie:"
echo "  node scripts/magalie-cli.js start --project mission-control-v2 --budget 150000"
echo ""
echo "Pour vérifier la santé:"
echo "  node scripts/magalie-cli.js health"
`;

const setupPath = path.join(__dirname, '..', 'setup.sh');
fs.writeFileSync(setupPath, setupScript);
fs.chmodSync(setupPath, 0o755);
console.log(`✓ Script de setup créé: ${setupPath}`);

// 4. Créer une base SQLite pour le test
console.log('\n3. Création du fallback SQLite...');
const sqlite3 = require('sqlite3');

const dbPath = path.join(__dirname, '..', 'magalie-test.db');
const db = new sqlite3.Database(dbPath);

const schema = `
CREATE TABLE IF NOT EXISTS project_tree (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    state TEXT DEFAULT 'PENDING',
    cycle_type TEXT DEFAULT 'EXPRESS',
    atomic BOOLEAN DEFAULT 1,
    dependencies TEXT,
    assigned_to TEXT,
    metrics TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_budgets (
    project_id TEXT PRIMARY KEY,
    allocated_tokens INTEGER DEFAULT 100000,
    spent_tokens INTEGER DEFAULT 0,
    allocated_dollars REAL DEFAULT 10.0,
    spent_dollars REAL DEFAULT 0.0,
    alert_threshold_percent INTEGER DEFAULT 80,
    last_alert_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS decision_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_hash TEXT UNIQUE NOT NULL,
    question TEXT NOT NULL,
    context TEXT,
    decision TEXT NOT NULL,
    ttl TIMESTAMP NOT NULL,
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_tree_project ON project_tree(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tree_state ON project_tree(state);
CREATE INDEX IF NOT EXISTS idx_decision_cache_hash ON decision_cache(decision_hash);
CREATE INDEX IF NOT EXISTS idx_decision_cache_ttl ON decision_cache(ttl);
`;

db.exec(schema, (err) => {
  if (err) {
    console.error(`❌ Erreur création SQLite: ${err.message}`);
  } else {
    console.log(`✓ Base SQLite de test créée: ${dbPath}`);
    
    // Créer l'adaptateur SQLite
    const adapterContent = `#!/usr/bin/env node
// Adaptateur SQLite pour Magalie v3.1 (mode test)

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.SQLITE_DB_PATH || '${dbPath}';

class SQLiteAdapter {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = SQLiteAdapter;
`;

    const adapterPath = path.join(__dirname, 'sqlite-adapter.js');
    fs.writeFileSync(adapterPath, adapterContent);
    fs.chmodSync(adapterPath, 0o755);
    console.log(`✓ Adaptateur SQLite créé: ${adapterPath}`);
  }
  
  db.close();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Configuration terminée avec succès');
  console.log('='.repeat(60));
  console.log('\n📋 Prochaines étapes MANUELLES:');
  console.log('1. Créer un compte Supabase: https://supabase.com');
  console.log('2. Remplir .env avec tes clés API');
  console.log('3. Exécuter: ./setup.sh');
  console.log('4. Démarrer: node scripts/magalie-cli.js start --project test --budget 50000');
  console.log('\nPour tester immédiatement (sans Supabase):');
  console.log('  export SQLITE_MODE=true');
  console.log('  node scripts/magalie-cli.js start --project test --budget 50000');
});