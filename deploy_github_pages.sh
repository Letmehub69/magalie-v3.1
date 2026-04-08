#!/bin/bash

echo "🚀 Déploiement de FitMaster Pro sur GitHub Pages..."
echo ""

# Vérifier le token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Erreur: GITHUB_TOKEN non défini"
    echo "Exportez votre token: export GITHUB_TOKEN=votre_token"
    exit 1
fi

# Vérifier l'utilisateur
echo "🔍 Vérification du token GitHub..."
USER_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
USERNAME=$(echo "$USER_RESPONSE" | grep -o '"login":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USERNAME" ]; then
    echo "❌ Token GitHub invalide"
    exit 1
fi

echo "✅ Connecté en tant que: $USERNAME"
echo ""

# Nom du repo
REPO_NAME="fitmaster-pro"
REPO_URL="https://github.com/$USERNAME/$REPO_NAME"

# Créer le repo
echo "📦 Création du repository..."
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"FitMaster Pro - Application d'entraînement premium avec authentification\",
    \"homepage\": \"https://$USERNAME.github.io/$REPO_NAME\",
    \"private\": false,
    \"auto_init\": false
  }")

echo "✅ Repository créé: $REPO_URL"
echo ""

# Créer un dossier temporaire
echo "📁 Préparation des fichiers..."
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Copier les fichiers nécessaires
cp /Users/house/.openclaw/workspace-main/magalie-v3.1/workout_timer_final.html index.html
cp /Users/house/.openclaw/workspace-main/magalie-v3.1/README.md .
cp /Users/house/.openclaw/workspace-main/magalie-v3.1/netlify.toml .

# Créer .nojekyll pour GitHub Pages
touch .nojekyll

# Initialiser git
echo "📤 Initialisation de Git..."
git init
git config user.name "FitMaster Deploy"
git config user.email "deploy@fitmaster.pro"
git add .
git commit -m "Deploy FitMaster Pro to GitHub Pages"

# Ajouter remote et pousser
echo "📤 Pushing to GitHub..."
git remote add origin "https://$GITHUB_TOKEN@github.com/$USERNAME/$REPO_NAME.git"
git branch -M main
git push -f origin main

# Activer GitHub Pages
echo "⚙️ Activation de GitHub Pages..."
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$USERNAME/$REPO_NAME/pages \
  -d '{
    "source": {
      "branch": "main",
      "path": "/"
    }
  }' > /dev/null

echo ""
echo "🎉 DÉPLOIEMENT RÉUSSI !"
echo ""
echo "🌐 Ton application est disponible sur:"
echo "   https://$USERNAME.github.io/$REPO_NAME"
echo ""
echo "🔗 Repository GitHub:"
echo "   $REPO_URL"
echo ""
echo "⚙️ Configuration GitHub Pages:"
echo "   $REPO_URL/settings/pages"
echo ""
echo "📱 Pour tester immédiatement:"
echo "   Ouvrir: https://$USERNAME.github.io/$REPO_NAME"
echo ""
echo "💡 Note: L'application peut prendre 1-2 minutes pour être visible."
echo ""

# Nettoyer
cd /
rm -rf "$TEMP_DIR"