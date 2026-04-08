#!/bin/bash
# Démarrage rapide Magalie v3.1 avec ou sans Supabase

echo "🚀 Magalie v3.1 - Démarrage rapide"
echo "================================="

# 1. Charger .env s'il existe
if [ -f "$(pwd)/.env" ]; then
    echo "📄 Chargement du fichier .env..."
    set -a
    source "$(pwd)/.env" 2>/dev/null
    set +a
fi

# 2. Vérifier Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js requis"
    exit 1
fi

# 3. Décider du mode (SQLite ou Supabase)
if [ "$SQLITE_MODE" = "true" ] || [ -n "$SQLITE_DB_PATH" ]; then
    # Mode SQLite forcé
    echo "🔧 Mode SQLite activé (forcé)"
    export SQLITE_MODE=true
    export SQLITE_DB_PATH="${SQLITE_DB_PATH:-$(pwd)/magalie-test.db}"
elif [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    # Supabase non configuré -> SQLite par défaut
    echo "⚠️  Supabase non configuré"
    echo "   Mode: SQLite (test local)"
    export SQLITE_MODE=true
    export SQLITE_DB_PATH="$(pwd)/magalie-test.db"
else
    # Supabase configuré
    echo "✅ Supabase configuré"
    echo "   URL: $SUPABASE_URL"
    # Ne pas activer SQLITE_MODE
fi

# 4. Vérifier la base SQLite si nécessaire
if [ "$SQLITE_MODE" = "true" ]; then
    SQLITE_DB_PATH="${SQLITE_DB_PATH:-$(pwd)/magalie-test.db}"
    echo "🗄️  Base SQLite: $SQLITE_DB_PATH"
    
    if [ ! -f "$SQLITE_DB_PATH" ]; then
        echo "❌ Base SQLite non trouvée: $SQLITE_DB_PATH"
        echo "   Exécute d'abord: sqlite3 magalie-test.db < migrations/sqlite-schema.sql"
        exit 1
    fi
fi

# Vérifier Anthropic API key (optionnel mais recommandé)
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY non configuré"
    echo "   Les agents utiliseront DeepSeek comme fallback"
fi

# Projet par défaut
PROJECT="${1:-mission-control-v2}"
BUDGET="${2:-50000}"

echo ""
echo "📋 Paramètres:"
echo "   Projet: $PROJECT"
echo "   Budget: $BUDGET tokens"
echo "   Mode: $([ -n "$SQLITE_MODE" ] && echo "SQLite" || echo "Supabase")"
echo ""

# Démarrer Magalie
echo "▶️  Démarrage de Magalie..."
node scripts/magalie-cli.js start \
  --project "$PROJECT" \
  --budget "$BUDGET" \
  --parallelism dynamic

# Code de sortie
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Magalie démarré avec succès"
    echo ""
    echo "Commandes utiles:"
    echo "   node scripts/magalie-cli.js status --project $PROJECT"
    echo "   node scripts/magalie-cli.js nodes --project $PROJECT"
    echo "   node scripts/magalie-cli.js logs --project $PROJECT --tail 20"
else
    echo ""
    echo "❌ Erreur lors du démarrage (code: $EXIT_CODE)"
    exit $EXIT_CODE
fi