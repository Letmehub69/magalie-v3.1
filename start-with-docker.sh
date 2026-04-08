#!/bin/bash

# Script pour démarrer JuriPlateforme avec Supabase Docker

echo "🐳 Démarrage de JuriPlateforme avec Docker..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker Desktop."
    exit 1
fi

# Vérifier si le daemon Docker est en cours d'exécution
if ! docker info &> /dev/null; then
    echo "⚠️  Le daemon Docker n'est pas en cours d'exécution."
    echo "   Veuillez démarrer Docker Desktop, puis réessayer."
    echo ""
    echo "Sur macOS :"
    echo "   1. Ouvrir Docker Desktop"
    echo "   2. Attendre que l'icône soit verte"
    echo "   3. Relancer ce script"
    exit 1
fi

echo "✅ Docker est en cours d'exécution"

# Vérifier les dépendances Node.js
echo "📦 Vérification des dépendances Node.js..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Démarrer Supabase
echo "🗄️  Démarrage de Supabase avec Docker..."
npx supabase start

# Attendre que Supabase soit prêt
echo "⏳ Attente que Supabase soit prêt..."
sleep 5

# Afficher les informations de connexion
echo ""
echo "📊 SUPABASE CONFIGURÉ :"
echo "   • URL: http://localhost:54321"
echo "   • Studio: http://localhost:54323"
echo "   • DB: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""

# Mettre à jour les variables d'environnement
echo "🔧 Configuration des variables d'environnement..."
cat > .env.local << 'EOF'
# Configuration avec Docker Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Mode développement avec vraie base de données
NEXT_PUBLIC_USE_MOCK_AI=true

# URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_VERCEL_URL=http://localhost:3000
EOF

echo "✅ Variables d'environnement configurées"

# Exécuter les migrations
echo "🗃️  Exécution des migrations de base de données..."
npx supabase db reset

# Démarrer Next.js
echo "🌐 Démarrage du serveur Next.js sur http://localhost:3000"
echo ""
echo "📋 URLs disponibles :"
echo "   • Application : http://localhost:3000"
echo "   • Supabase Studio : http://localhost:54323"
echo "   • API REST : http://localhost:54321/rest/v1/"
echo ""
echo "🔧 Mode avec Docker activé :"
echo "   • Base de données PostgreSQL réelle"
echo "   • Authentification Supabase réelle"
echo "   • Stockage de fichiers réel"
echo "   • Données persistantes"
echo ""
echo "🛑 Pour arrêter : Ctrl+C dans ce terminal"
echo "   (Supabase continuera de tourner en arrière-plan)"
echo ""

npm run dev