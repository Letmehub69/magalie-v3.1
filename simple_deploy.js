#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const REPO_NAME = 'fitmaster-pro';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌ Erreur: GITHUB_TOKEN non défini');
  console.error('Exportez votre token: export GITHUB_TOKEN=votre_token');
  process.exit(1);
}

// Fonction pour faire une requête GitHub API
function githubRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'FitMaster-Deploy',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function deploy() {
  console.log('🚀 Déploiement de FitMaster Pro sur GitHub Pages...\n');

  try {
    // 1. Vérifier l'utilisateur
    console.log('🔍 Vérification du token GitHub...');
    const userResponse = await githubRequest('GET', '/user');
    
    if (userResponse.status !== 200) {
      console.error('❌ Token GitHub invalide');
      console.error(userResponse.data);
      return;
    }

    const username = userResponse.data.login;
    console.log(`✅ Connecté en tant que: ${username}\n`);

    // 2. Créer le repo
    console.log('📦 Création du repository...');
    const createRepoResponse = await githubRequest('POST', '/user/repos', {
      name: REPO_NAME,
      description: 'FitMaster Pro - Application d\'entraînement premium avec authentification',
      homepage: `https://${username}.github.io/${REPO_NAME}`,
      private: false,
      auto_init: false,
      has_issues: true,
      has_projects: false,
      has_wiki: false
    });

    if (createRepoResponse.status === 201) {
      console.log(`✅ Repository créé: https://github.com/${username}/${REPO_NAME}`);
    } else if (createRepoResponse.status === 422 && createRepoResponse.data.message?.includes('already exists')) {
      console.log(`ℹ️ Repository existe déjà: https://github.com/${username}/${REPO_NAME}`);
    } else {
      console.error('❌ Erreur lors de la création du repo:', createRepoResponse.data);
      return;
    }

    // 3. Créer un dossier temporaire
    console.log('\n📁 Préparation des fichiers...');
    const tempDir = '/tmp/fitmaster-deploy-' + Date.now();
    fs.mkdirSync(tempDir, { recursive: true });

    // Copier les fichiers
    const filesToCopy = [
      { src: 'workout_timer_final.html', dst: 'index.html' },
      { src: 'README.md', dst: 'README.md' },
      { src: 'netlify.toml', dst: 'netlify.toml' }
    ];

    filesToCopy.forEach(({ src, dst }) => {
      const sourcePath = path.join(__dirname, src);
      const destPath = path.join(tempDir, dst);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  📄 ${src} → ${dst}`);
      } else {
        console.log(`  ⚠️ Fichier non trouvé: ${src}`);
      }
    });

    // Créer .nojekyll pour GitHub Pages
    fs.writeFileSync(path.join(tempDir, '.nojekyll'), '');
    console.log('  📄 .nojekyll créé');

    // 4. Initialiser git et pousser
    console.log('\n📤 Pushing to GitHub...');
    process.chdir(tempDir);

    // Initialiser git
    execSync('git init', { stdio: 'inherit' });
    execSync('git config user.name "FitMaster Deploy"', { stdio: 'inherit' });
    execSync('git config user.email "deploy@fitmaster.pro"', { stdio: 'inherit' });
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Deploy FitMaster Pro to GitHub Pages"', { stdio: 'inherit' });

    // Ajouter remote et pousser
    const repoUrl = `https://${GITHUB_TOKEN}@github.com/${username}/${REPO_NAME}.git`;
    execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
    execSync('git branch -M main', { stdio: 'inherit' });
    execSync('git push -f origin main', { stdio: 'inherit' });

    // 5. Activer GitHub Pages
    console.log('\n⚙️ Activation de GitHub Pages...');
    const pagesResponse = await githubRequest('POST', `/repos/${username}/${REPO_NAME}/pages`, {
      source: {
        branch: 'main',
        path: '/'
      }
    });

    if (pagesResponse.status === 201 || pagesResponse.status === 200) {
      console.log('✅ GitHub Pages activé !');
    } else {
      console.log('ℹ️ GitHub Pages peut nécessiter une activation manuelle');
    }

    // 6. Afficher les liens
    console.log('\n🎉 DÉPLOIEMENT RÉUSSI !\n');
    console.log('🌐 Ton application est disponible sur:');
    console.log(`   https://${username}.github.io/${REPO_NAME}`);
    console.log('\n🔗 Repository GitHub:');
    console.log(`   https://github.com/${username}/${REPO_NAME}`);
    console.log('\n⚙️ Configuration GitHub Pages:');
    console.log(`   https://github.com/${username}/${REPO_NAME}/settings/pages`);
    console.log('\n📱 Pour tester immédiatement:');
    console.log(`   Ouvrir: https://${username}.github.io/${REPO_NAME}`);
    console.log('\n💡 Note: L\'application peut prendre 1-2 minutes pour être visible.');

    // Nettoyer
    fs.rmSync(tempDir, { recursive: true, force: true });

  } catch (error) {
    console.error('\n❌ Erreur lors du déploiement:');
    console.error(error.message);
    process.exit(1);
  }
}

// Exécuter le déploiement
deploy();