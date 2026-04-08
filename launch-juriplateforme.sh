#!/bin/bash

# Script de lancement complet de JuriPlateforme avec Docker

echo "🚀 LANCEMENT DE JURIPLATEFORME AVEC DOCKER"
echo "=========================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Étape 1 : Vérifier Docker
info "Étape 1/5 : Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé"
    echo "Téléchargez Docker Desktop : https://www.docker.com/products/docker-desktop/"
    exit 1
fi

if ! docker info &> /dev/null; then
    error "Docker Desktop n'est pas en cours d'exécution"
    echo ""
    echo "Pour démarrer Docker Desktop :"
    echo "  1. Ouvrez 'Docker Desktop' depuis Applications"
    echo "  2. Attendez que l'icône dans la barre de menu soit verte"
    echo "  3. Relancez ce script"
    echo ""
    echo "En attendant, vous pouvez utiliser : ./start-local.sh"
    exit 1
fi
success "Docker est prêt"

# Étape 2 : Vérifier les dépendances
info "Étape 2/5 : Vérification des dépendances Node.js..."
if [ ! -d "node_modules" ]; then
    warning "Installation des dépendances..."
    npm install
    if [ $? -ne 0 ]; then
        error "Échec de l'installation des dépendances"
        exit 1
    fi
fi
success "Dépendances installées"

# Étape 3 : Démarrer Supabase
info "Étape 3/5 : Démarrage de Supabase avec Docker..."
echo "Cette étape peut prendre 1-2 minutes..."
npx supabase start

if [ $? -ne 0 ]; then
    error "Échec du démarrage de Supabase"
    echo "Vérifiez que Docker Desktop est bien démarré"
    exit 1
fi
success "Supabase démarré"

# Étape 4 : Configurer l'environnement
info "Étape 4/5 : Configuration de l'environnement..."
cat > .env.local << 'EOF'
# Configuration Supabase avec Docker
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Mode développement
NEXT_PUBLIC_USE_MOCK_AI=true

# URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_VERCEL_URL=http://localhost:3000
EOF
success "Environnement configuré"

# Étape 5 : Exécuter les migrations
info "Étape 5/5 : Exécution des migrations de base de données..."
npx supabase db reset
success "Migrations exécutées"

# Afficher les informations
echo ""
echo "🎉 JURIPLATEFORME EST PRÊT !"
echo "============================="
echo ""
echo "🌐 URLs IMPORTANTES :"
echo "   • Votre application : ${GREEN}http://localhost:3000${NC}"
echo "   • Supabase Studio : ${BLUE}http://localhost:54323${NC}"
echo "   • API REST : http://localhost:54321/rest/v1/"
echo ""
echo "🔧 FONCTIONNALITÉS ACTIVÉES :"
echo "   • Base de données PostgreSQL réelle"
echo "   • Authentification Supabase complète"
echo "   • Stockage de fichiers"
echo "   • Données persistantes"
echo "   • API GraphQL : http://localhost:54321/graphql/v1"
echo ""
echo "📊 CRÉDENTIALS PAR DÉFAUT :"
echo "   • Email : test@example.com"
echo "   • Mot de passe : (créez votre propre compte)"
echo ""
echo "🚀 DÉMARRAGE DU SERVEUR NEXT.JS..."
echo "   Appuyez sur ${YELLOW}Ctrl+C${NC} pour arrêter"
echo ""

# Démarrer Next.js
npm run dev