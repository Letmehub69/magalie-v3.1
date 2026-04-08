#!/bin/bash

# Script pour déployer FitMaster Pro sur GitHub Pages

set -e

echo "🚀 Déploiement de FitMaster Pro sur GitHub Pages..."

# Vérifier le token GitHub
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Erreur: GITHUB_TOKEN n'est pas défini"
    echo "Pour définir le token: export GITHUB_TOKEN=ton_token_github"
    exit 1
fi

# Nom du repo
REPO_NAME="fitmaster-pro"
USERNAME="johnazzz"  # À remplacer par ton username GitHub

echo "📦 Création du repo GitHub..."

# Créer le repo sur GitHub
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"FitMaster Pro - Application d'entraînement premium avec authentification\",
    \"homepage\": \"https://$USERNAME.github.io/$REPO_NAME\",
    \"private\": false,
    \"has_issues\": true,
    \"has_projects\": false,
    \"has_wiki\": false,
    \"auto_init\": false
  }"

echo "✅ Repo créé: https://github.com/$USERNAME/$REPO_NAME"

# Créer un dossier temporaire pour le déploiement
DEPLOY_DIR="/tmp/fitmaster-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copier les fichiers nécessaires
cp workout_timer_final.html "$DEPLOY_DIR/index.html"
cp README.md "$DEPLOY_DIR/"
cp netlify.toml "$DEPLOY_DIR/"

# Créer un fichier .nojekyll pour GitHub Pages
touch "$DEPLOY_DIR/.nojekyll"

# Initialiser git dans le dossier de déploiement
cd "$DEPLOY_DIR"
git init
git config user.name "FitMaster Deploy"
git config user.email "deploy@fitmaster.pro"
git add .
git commit -m "Deploy FitMaster Pro to GitHub Pages"

# Ajouter le remote GitHub
git remote add origin "https://$GITHUB_TOKEN@github.com/$USERNAME/$REPO_NAME.git"

# Pousser sur GitHub
echo "📤 Pushing to GitHub..."
git push -f origin main

echo "✅ Déploiement terminé !"
echo "🌐 Ton application est disponible sur:"
echo "   https://$USERNAME.github.io/$REPO_NAME"
echo ""
echo "📋 Pour activer GitHub Pages:"
echo "1. Va sur https://github.com/$USERNAME/$REPO_NAME/settings/pages"
echo "2. Sous 'Source', sélectionne 'Deploy from a branch'"
echo "3. Choisis 'main' branch et '/ (root)' folder"
echo "4. Clique sur 'Save'"
echo ""
echo "🎉 Ton application sera en ligne dans 1-2 minutes !"