#!/bin/bash

echo "🔍 Vérification de l'installation Docker..."

# Vérifier si Docker est installé
if command -v docker &> /dev/null; then
    echo "✅ Docker est installé"
    
    # Vérifier si le daemon Docker est en cours d'exécution
    if docker info &> /dev/null; then
        echo "✅ Docker daemon est en cours d'exécution"
        echo ""
        echo "🎉 Docker est prêt ! Vous pouvez maintenant :"
        echo "   1. Lancer Supabase: npx supabase start"
        echo "   2. Démarrer l'application: npm run dev"
        echo ""
        echo "Ou utiliser le script complet :"
        echo "   ./start-with-docker.sh"
    else
        echo "❌ Docker daemon n'est PAS en cours d'exécution"
        echo ""
        echo "📋 Pour démarrer Docker :"
        echo ""
        echo "Sur macOS :"
        echo "   1. Ouvrir 'Docker Desktop' depuis Applications"
        echo "   2. Attendre que l'icône dans la barre de menu soit verte"
        echo "   3. Relancer cette vérification"
        echo ""
        echo "Sur Windows :"
        echo "   1. Ouvrir 'Docker Desktop'"
        echo "   2. Attendre que le statut soit 'Docker Desktop is running'"
        echo "   3. Relancer cette vérification"
        echo ""
        echo "Sur Linux :"
        echo "   1. Exécuter: sudo systemctl start docker"
        echo "   2. Vérifier: sudo systemctl status docker"
    fi
else
    echo "❌ Docker n'est pas installé"
    echo ""
    echo "📥 Télécharger Docker Desktop :"
    echo "   https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "Après installation :"
    echo "   1. Ouvrir Docker Desktop"
    echo "   2. Suivre les instructions de configuration"
    echo "   3. Relancer cette vérification"
fi

echo ""
echo "💡 Alternative :"
echo "   Vous pouvez continuer sans Docker en utilisant :"
echo "   ./start-local.sh  (données mockées)"