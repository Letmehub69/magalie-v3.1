#!/bin/bash
# Script de setup Magalie v3.1

echo "🔧 Setup Magalie v3.1"

# 1. Vérifier les dépendances
echo "1. Vérification des dépendances..."
command -v node >/dev/null 2>&1 || { echo "Node.js requis"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm requis"; exit 1; }

# 2. Installer les dépendances Node.js
echo "2. Installation des dépendances..."
cd "$(dirname "$0")"
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