#!/bin/bash

# Script pour démarrer JuriPlateforme en local

echo "🚀 Démarrage de JuriPlateforme en local..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18+"
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Vérifier les dépendances
echo "📦 Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Démarrer le serveur de développement
echo "🌐 Démarrage du serveur sur http://localhost:3000"
echo ""
echo "📋 URLs disponibles :"
echo "   • Page d'accueil : http://localhost:3000"
echo "   • Dashboard : http://localhost:3000/dashboard"
echo "   • Création de dossier : http://localhost:3000/dashboard/dossiers/new"
echo "   • Assistant IA : http://localhost:3000/dashboard/ai"
echo ""
echo "🔧 Mode développement activé :"
echo "   • Données mockées utilisées"
echo "   • Pas de base de données requise"
echo "   • Authentification simulée"
echo ""
echo "🛑 Pour arrêter : Ctrl+C"
echo ""

# Démarrer Next.js en mode développement
npm run dev