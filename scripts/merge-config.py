#!/usr/bin/env python3
"""
Fusionne la configuration Magalie v3.1 avec la configuration OpenClaw existante
"""

import json
import os
import sys
from pathlib import Path

def merge_configs():
    # Chemins
    current_config_path = Path.home() / ".openclaw" / "openclaw.json"
    magalie_config_path = Path(__file__).parent.parent / "config" / "openclaw-magalie.json"
    backup_path = current_config_path.with_suffix(".json.backup")
    
    print(f"Configuration actuelle: {current_config_path}")
    print(f"Configuration Magalie: {magalie_config_path}")
    
    # Vérifier l'existence
    if not current_config_path.exists():
        print(f"ERREUR: Configuration OpenClaw non trouvée: {current_config_path}")
        return False
    
    if not magalie_config_path.exists():
        print(f"ERREUR: Configuration Magalie non trouvée: {magalie_config_path}")
        return False
    
    # Lire les configurations
    with open(current_config_path, 'r') as f:
        current = json.load(f)
    
    with open(magalie_config_path, 'r') as f:
        magalie = json.load(f)
    
    # Sauvegarder
    with open(backup_path, 'w') as f:
        json.dump(current, f, indent=2)
    print(f"✓ Backup créé: {backup_path}")
    
    # Fusionner agents.list
    if 'agents' not in current:
        current['agents'] = {}
    
    if 'list' not in current['agents']:
        current['agents']['list'] = []
    
    # Remplacer/ajouter les agents Magalie
    magalie_agents = magalie.get('agents', {}).get('list', [])
    
    # Garder les agents existants non-Magalie
    existing_agent_ids = [agent.get('id') for agent in current['agents']['list']]
    magalie_agent_ids = [agent.get('id') for agent in magalie_agents]
    
    # Filtrer les agents existants qui ne sont pas dans Magalie
    filtered_existing = [
        agent for agent in current['agents']['list']
        if agent.get('id') not in magalie_agent_ids
    ]
    
    # Combiner
    current['agents']['list'] = filtered_existing + magalie_agents
    print(f"✓ Agents fusionnés: {len(magalie_agents)} agents Magalie ajoutés")
    
    # Fusionner les intégrations
    if 'integrations' in magalie:
        current['integrations'] = magalie['integrations']
        print("✓ Intégrations ajoutées")
    
    # Fusionner les channels.routing si présent
    if 'channels' in magalie and 'routing' in magalie['channels']:
        if 'channels' not in current:
            current['channels'] = {}
        current['channels']['routing'] = magalie['channels']['routing']
        print("✓ Routing des canaux configuré")
    
    # Ajouter les features
    if 'features' in magalie:
        current['features'] = magalie['features']
        print("✓ Features activées")
    
    # Écrire la nouvelle configuration
    with open(current_config_path, 'w') as f:
        json.dump(current, f, indent=2)
    
    print(f"✓ Configuration fusionnée: {current_config_path}")
    print(f"  Total agents: {len(current['agents']['list'])}")
    
    return True

def create_env_template():
    """Crée un template de variables d'environnement"""
    env_template = """# Configuration Magalie v3.1
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
"""
    
    env_path = Path(__file__).parent.parent / ".env.example"
    with open(env_path, 'w') as f:
        f.write(env_template)
    
    print(f"✓ Template .env créé: {env_path}")
    
    # Créer aussi un script de setup
    setup_script = """#!/bin/bash
# Script de setup Magalie v3.1

echo "🔧 Setup Magalie v3.1"

# 1. Vérifier les dépendances
echo "1. Vérification des dépendances..."
command -v node >/dev/null 2>&1 || { echo "Node.js requis"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm requis"; exit 1; }

# 2. Installer les dépendances Node.js
echo "2. Installation des dépendances..."
cd "$(dirname "$0")/.."
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
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
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
"""
    
    setup_path = Path(__file__).parent.parent / "setup.sh"
    with open(setup_path, 'w') as f:
        f.write(setup_script)
    
    os.chmod(setup_path, 0o755)
    print(f"✓ Script de setup créé: {setup_path}")
    
    return env_path, setup_path

def create_sqlite_fallback():
    """Crée une version SQLite pour le test sans Supabase"""
    sqlite_schema = """-- Schéma SQLite pour Magalie v3.1 (mode test)
CREATE TABLE IF NOT EXISTS project_tree (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    state TEXT DEFAULT 'PENDING',
    cycle_type TEXT DEFAULT 'EXPRESS',
    atomic BOOLEAN DEFAULT 1,
    dependencies TEXT, -- JSON array
    assigned_to TEXT,
    metrics TEXT, -- JSON object
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
    context TEXT, -- JSON
    decision TEXT NOT NULL, -- JSON
    ttl TIMESTAMP NOT NULL,
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_tree_project ON project_tree(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tree_state ON project_tree(state);
CREATE INDEX IF NOT EXISTS idx_decision_cache_hash ON decision_cache(decision_hash);
CREATE INDEX IF NOT EXISTS idx_decision_cache_ttl ON decision_cache(ttl);
"""
    
    sqlite_path = Path(__file__).parent.parent / "magalie-test.db"
    
    # Créer le fichier avec le schéma
    import sqlite3
    conn = sqlite3.connect(str(sqlite_path))
    conn.executescript(sqlite_schema)
    conn.close()
    
    print(f"✓ Base SQLite de test créée: {sqlite_path}")
    
    # Créer un adaptateur SQLite pour les scripts
    sqlite_adapter = """#!/usr/bin/env node
// Adaptateur SQLite pour Magalie v3.1 (mode test sans Supabase)

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '../magalie-test.db');

class SQLiteAdapter {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Exemple d'utilisation pour remplacer Supabase temporairement
if (require.main === module) {
  console.log('Adaptateur SQLite pour Magalie v3.1');
  console.log('Base de données:', DB_PATH);
  
  const adapter = new SQLiteAdapter();
  
  // Tester la connexion
  adapter.query('SELECT name FROM sqlite_master WHERE type="table"')
    .then(tables => {
      console.log('Tables disponibles:', tables.map(t => t.name));
      adapter.close();
    })
    .catch(err => {
      console.error('Erreur:', err.message);
      adapter.close();
    });
}

module.exports = SQLiteAdapter;
"""
    
    adapter_path = Path(__file__).parent / "sqlite-adapter.js"
    with open(adapter_path, 'w') as f:
        f.write(sqlite_adapter)
    
    os.chmod(adapter_path, 0o755)
    print(f"✓ Adaptateur SQLite créé: {adapter_path}")
    
    return sqlite_path, adapter_path

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 Configuration Magalie v3.1")
    print("=" * 60)
    
    try:
        # 1. Fusionner la config OpenClaw
        if merge_configs():
            print("\n✓ Étape 1/3: Configuration OpenClaw fusionnée")
        else:
            print("\n❌ Étape 1 échouée")
            sys.exit(1)
        
        # 2. Créer les templates
        env_template, setup_script = create_env_template()
        print("\n✓ Étape 2/3: Templates créés")
        print(f"   - {env_template}")
        print(f"   - {setup_script}")
        
        # 3. Créer le fallback SQLite
        sqlite_db, sqlite_adapter = create_sqlite_fallback()
        print("\n✓ Étape 3/3: Fallback SQLite créé")
        print(f"   - {sqlite_db}")
        print(f"   - {sqlite_adapter}")
        
        print("\n" + "=" * 60)
        print("✅ Configuration terminée avec succès")
        print("=" * 60)
        print("\n📋 Prochaines étapes MANUELLES:")
        print("1. Créer un compte Supabase: https://supabase.com")
        print("2. Remplir .env avec tes clés API")
        print("3. Exécuter: ./setup.sh")
        print("4. Démarrer: node scripts/magalie-cli.js start --project test --budget 50000")
        print("\nPour tester immédiatement (sans Supabase):")
        print("  export SQLITE_MODE=true")
        print("  node scripts/magalie-cli.js start --project test --budget 50000")
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)