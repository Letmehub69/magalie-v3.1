#!/bin/bash

echo "🚀 DÉPLOIEMENT FITMASTER PRO SUR GITHUB PAGES"
echo "=============================================="
echo ""

# Vérifier le token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Erreur: GITHUB_TOKEN non défini"
    exit 1
fi

USERNAME="Letmehub69"
REPO_NAME="fitmaster-pro"
REPO_URL="https://github.com/$USERNAME/$REPO_NAME"
PAGES_URL="https://$USERNAME.github.io/$REPO_NAME"

echo "👤 Utilisateur: $USERNAME"
echo "📦 Repository: $REPO_NAME"
echo ""

# Créer un dossier temporaire
echo "📁 Préparation des fichiers..."
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Copier les fichiers
cp /Users/house/.openclaw/workspace-main/magalie-v3.1/workout_timer_final.html index.html
cp /Users/house/.openclaw/workspace-main/magalie-v3.1/README.md .
cp /Users/house/.openclaw/workspace-main/magalie-v3.1/netlify.toml .

# Créer .nojekyll pour GitHub Pages
touch .nojekyll

# Créer un fichier CNAME pour le domaine personnalisé (optionnel)
# echo "fitmaster-pro.netlify.app" > CNAME

# Initialiser git
echo "📤 Initialisation Git..."
git init
git config user.name "FitMaster Pro"
git config user.email "deploy@fitmaster.pro"
git add .
git commit -m "Deploy FitMaster Pro - Application d'entraînement premium"

# Essayer de créer le repo via API
echo "🔄 Tentative de création du repository..."
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"FitMaster Pro - Application d'entraînement premium avec authentification\",
    \"private\": false
  }")

# Vérifier si le repo existe déjà ou a été créé
echo "🔗 Configuration du remote Git..."
git remote add origin "https://$GITHUB_TOKEN@github.com/$USERNAME/$REPO_NAME.git" 2>/dev/null || true

# Essayer de pousser
echo "📤 Pushing to GitHub..."
if git push -f origin main 2>/dev/null; then
    echo "✅ Push réussi !"
    
    # Essayer d'activer GitHub Pages
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
      }' > /dev/null 2>&1
    
    echo ""
    echo "🎉 DÉPLOIEMENT RÉUSSI !"
    echo ""
    echo "🌐 Ton application est disponible sur:"
    echo "   $PAGES_URL"
    echo ""
    echo "🔗 Repository GitHub:"
    echo "   $REPO_URL"
    echo ""
    echo "⚙️ Pour vérifier/activer GitHub Pages manuellement:"
    echo "   $REPO_URL/settings/pages"
    echo ""
    echo "📱 Pour tester immédiatement:"
    echo "   Ouvrir: $PAGES_URL"
    echo ""
    echo "⏱️ L'application sera visible dans 1-2 minutes."
    
else
    echo "⚠️ Impossible de pousser sur GitHub."
    echo ""
    echo "📋 Solution alternative:"
    echo "1. Crée manuellement un repo sur GitHub:"
    echo "   https://github.com/new"
    echo "   Nom: $REPO_NAME"
    echo "   Public, sans README"
    echo ""
    echo "2. Puis exécute cette commande:"
    echo "   cd $TEMP_DIR"
    echo "   git remote add origin https://github.com/$USERNAME/$REPO_NAME.git"
    echo "   git push -u origin main"
    echo ""
    echo "3. Active GitHub Pages dans les settings du repo."
fi

echo ""
echo "💡 Astuce: Tu peux aussi utiliser Netlify Drop pour un déploiement encore plus simple!"
echo "   https://app.netlify.com/drop"
echo "   Drag & drop le fichier: /Users/house/.openclaw/workspace-main/magalie-v3.1/fitmaster-pro.zip"

# Nettoyer
cd /
rm -rf "$TEMP_DIR"