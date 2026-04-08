#!/bin/bash
# Script interactif de setup Magalie v3.1
# Exécute: chmod +x setup-magalie-interactive.sh && ./setup-magalie-interactive.sh

echo "🚀 MAGALIE v3.1 - SETUP INTERACTIF"
echo "=================================="
echo ""
echo "Je vais tout faire pour toi, mais j'ai besoin de quelques infos."
echo ""

# 1. Vérifier les dépendances
echo "📦 1. Vérification des dépendances..."
echo "----------------------------------"

if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js n'est pas installé"
    echo "   Installe-le avec: brew install node"
    exit 1
fi
echo "✅ Node.js $(node --version)"

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm n'est pas installé"
    exit 1
fi
echo "✅ npm $(npm --version)"

# 2. Installer les dépendances Node.js si besoin
echo ""
echo "📦 2. Installation des dépendances Node.js..."
echo "-------------------------------------------"
cd "$(dirname "$0")"
npm install 2>/dev/null || echo "⚠️  npm install a échoué ou déjà installé"

# 3. Vérifier le fichier .env
echo ""
echo "🔐 3. Configuration Supabase..."
echo "-----------------------------"

if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé"
    echo "   Je vais créer un template, mais tu devras le remplir."
    cp .env.example .env
    echo ""
    echo "📝 Ouvre ton fichier .env dans un éditeur:"
    echo "   code .env  # ou nano .env, vim .env, etc."
    echo ""
    echo "Tu as besoin de 3 choses de Supabase:"
    echo "   1. URL: https://ton-projet.supabase.co"
    echo "   2. Clé anon (Settings → API → anon public)"
    echo "   3. Clé service_role (Settings → API → service_role secret)"
    echo ""
    read -p "Appuie sur Entrée quand tu as rempli le fichier .env..."
fi

# Charger les variables
source .env 2>/dev/null

# 4. Tester la connexion Supabase
echo ""
echo "🔗 4. Test de connexion Supabase..."
echo "---------------------------------"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Variables manquantes dans .env"
    echo "   Vérifie que SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont définis"
    exit 1
fi

echo "📡 Test de l'API Supabase..."
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/" \
  --connect-timeout 10)

if [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "204" ]; then
    echo "✅ Connexion Supabase réussie (HTTP $response)"
else
    echo "❌ Échec de connexion (HTTP $response)"
    echo ""
    echo "🔧 Problèmes possibles:"
    echo "   - Clés API invalides (régénère-les dans Supabase Dashboard)"
    echo "   - Projet suspendu/inactif"
    echo "   - Problèmes de réseau/CORS"
    echo ""
    echo "📋 Que faire:"
    echo "   1. Va sur dashboard.supabase.com"
    echo "   2. Settings → API"
    echo "   3. Clique 'Regenerate' sur anon public et service_role secret"
    echo "   4. Copie les NOUVELLES clés dans ton fichier .env"
    echo "   5. Relance ce script"
    exit 1
fi

# 5. Installer psql si besoin
echo ""
echo "🗄️  5. Installation de psql (pour la base de données)..."
echo "------------------------------------------------------"

if ! command -v psql >/dev/null 2>&1; then
    echo "psql n'est pas installé."
    echo "Je vais l'installer avec Homebrew..."
    
    if ! command -v brew >/dev/null 2>&1; then
        echo "❌ Homebrew n'est pas installé"
        echo "   Installe-le d'abord: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    brew install postgresql
    echo "✅ psql installé"
else
    echo "✅ psql déjà installé"
fi

# 6. Demander le mot de passe de la base de données
echo ""
echo "🔑 6. Mot de passe de la base de données Supabase..."
echo "---------------------------------------------------"
echo ""
echo "Tu as besoin du mot de passe de ta base de données PostgreSQL."
echo ""
echo "Pour le trouver:"
echo "   1. dashboard.supabase.com → ton projet"
echo "   2. Settings → Database"
echo "   3. Connection Info → Password"
echo ""
echo "Si tu ne le vois pas/ne t'en souviens pas:"
echo "   - Clique 'Reset password' (juste à côté)"
echo "   - Copie le NOUVEAU mot de passe (il s'affiche une seule fois!)"
echo ""
read -s -p "🔒 Entre ton mot de passe PostgreSQL: " DB_PASSWORD
echo ""

# 7. Appliquer le schéma Magalie
echo ""
echo "📊 7. Application du schéma Magalie à Supabase..."
echo "-----------------------------------------------"

# Extraire le nom du projet de l'URL
PROJECT_NAME=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|.supabase.co||')

echo "🔄 Application du schéma à: $PROJECT_NAME"
echo ""

# Construire la commande psql
PSQL_CMD="psql \"postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_NAME}.supabase.co:5432/postgres\" -f migrations/20260406000000_magalie_v3_1.sql"

echo "📋 Commande à exécuter:"
echo "   $PSQL_CMD"
echo ""
read -p "🔧 Appuie sur Entrée pour appliquer le schéma..."

# Exécuter la commande
eval "$PSQL_CMD"

if [ $? -eq 0 ]; then
    echo "✅ Schéma appliqué avec succès!"
else
    echo "❌ Erreur lors de l'application du schéma"
    echo ""
    echo "🔧 Problèmes possibles:"
    echo "   - Mot de passe incorrect"
    echo "   - Problème de connexion réseau"
    echo "   - Le projet n'existe pas/est suspendu"
    echo ""
    echo "📋 Réessaie avec:"
    echo "   $PSQL_CMD"
    exit 1
fi

# 8. Tester que les tables existent
echo ""
echo "🧪 8. Vérification des tables créées..."
echo "--------------------------------------"

echo "Vérification via API Supabase..."
for table in project_tree project_budgets decision_cache; do
    response=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      "$SUPABASE_URL/rest/v1/$table?select=id&limit=1")
    
    if [ "$response" = "200" ]; then
        echo "✅ Table $table existe"
    else
        echo "❌ Table $table manquante (HTTP $response)"
    fi
done

# 9. Démarrer Magalie
echo ""
echo "🚀 9. Démarrage de Magalie v3.1..."
echo "--------------------------------"

echo "Configuration terminée! Je vais démarrer Magalie..."
echo ""
echo "Projet: mission-control-v2"
echo "Budget: 150000 tokens"
echo ""

read -p "🎯 Appuie sur Entrée pour démarrer Magalie..."

# Démarrer en arrière-plan
export SUPABASE_URL
export SUPABASE_ANON_KEY
export SUPABASE_SERVICE_ROLE_KEY

node scripts/magalie-cli.js start --project mission-control-v2 --budget 150000 &

echo ""
echo "⏳ Magalie démarre en arrière-plan..."
echo ""
echo "📋 Commandes utiles:"
echo "   Pour voir le statut: node scripts/magalie-cli.js status --project mission-control-v2"
echo "   Pour voir les logs: node scripts/magalie-cli.js logs --project mission-control-v2"
echo "   Pour arrêter: node scripts/magalie-cli.js stop --project mission-control-v2"
echo ""
echo "🎉 MAGALIE v3.1 EST MAINTENANT OPÉRATIONNEL!"
echo ""
echo "Prochaines étapes:"
echo "   1. Magalie va décomposer le projet en nœuds atomiques"
echo "   2. Les agents Bob travailleront en parallèle (2-6 simultanés)"
echo "   3. Fiton surveillera le budget et les performances"
echo "   4. Tu recevras des alertes si besoin"
echo ""
echo "✨ Bonne aventure avec Magalie v3.1!"