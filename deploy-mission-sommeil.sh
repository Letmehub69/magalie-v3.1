#!/bin/bash

# Script pour déployer Mission Sommeil sur GitHub Pages

set -e

echo "🌙 Déploiement de Mission Sommeil sur GitHub Pages..."

# Vérifier le token GitHub
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Erreur: GITHUB_TOKEN n'est pas défini"
    echo ""
    echo "Pour définir le token, exécute:"
    echo "  export GITHUB_TOKEN=ton_token_github"
    echo ""
    echo "Pour créer un token GitHub:"
    echo "1. Va sur https://github.com/settings/tokens"
    echo "2. Clique sur 'Generate new token'"
    echo "3. Donne-lui un nom (ex: 'Mission Sommeil Deploy')"
    echo "4. Sélectionne 'repo' scope"
    echo "5. Copie le token généré"
    echo ""
    exit 1
fi

# Nom du repo
REPO_NAME="mission-sommeil"
USERNAME="johnazzz"  # Ton username GitHub

echo "📦 Préparation du déploiement..."

# Créer le repo sur GitHub (s'il n'existe pas déjà)
echo "Création du repo GitHub..."
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"Guide pour aider les parents à guider leurs enfants (2-4 ans) vers l'autonomie du sommeil\",
    \"homepage\": \"https://$USERNAME.github.io/$REPO_NAME\",
    \"private\": false,
    \"has_issues\": false,
    \"has_projects\": false,
    \"has_wiki\": false,
    \"auto_init\": false
  }" || echo "Le repo existe peut-être déjà, continuation..."

# Créer un dossier temporaire pour le déploiement
DEPLOY_DIR="/tmp/mission-sommeil-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copier les fichiers nécessaires
cp mission-sommeil.html "$DEPLOY_DIR/index.html"
cp README-mission-sommeil.md "$DEPLOY_DIR/README.md"

# Créer un fichier .nojekyll pour GitHub Pages
touch "$DEPLOY_DIR/.nojekyll"

# Initialiser git dans le dossier de déploiement
cd "$DEPLOY_DIR"
git init
git config user.name "Mission Sommeil Deploy"
git config user.email "deploy@mission-sommeil.com"
git add .
git commit -m "Deploy Mission Sommeil to GitHub Pages"

# Ajouter le remote GitHub
git remote add origin "https://$GITHUB_TOKEN@github.com/$USERNAME/$REPO_NAME.git"

# Pousser sur GitHub
echo "📤 Pushing to GitHub..."
git push -f origin main

echo ""
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
echo "🎉 Ta page sera en ligne dans 1-2 minutes !"
echo ""
echo "💡 Tu peux aussi déployer manuellement:"
echo "1. Crée un nouveau repo sur GitHub nommé '$REPO_NAME'"
echo "2. Upload les fichiers: index.html et README.md"
echo "3. Active GitHub Pages dans les settings"
echo ""
echo "Bonne chance avec les nuits paisibles ! 🌙"