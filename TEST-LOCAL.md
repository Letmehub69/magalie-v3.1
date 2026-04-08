# 🧪 TEST LOCAL - JuriPlateforme

## 🚀 DÉMARRAGE RAPIDE

### Option 1 : Script automatique
```bash
cd /Users/house/.openclaw/workspace-main/magalie-v3.1
./start-local.sh
```

### Option 2 : Manuel
```bash
cd /Users/house/.openclaw/workspace-main/magalie-v3.1
npm run dev
```

## 🌐 ACCÈS À L'APPLICATION

**Serveur démarré sur :** http://localhost:3000

### Pages principales :
1. **Page d'accueil** - http://localhost:3000
2. **Dashboard** - http://localhost:3000/dashboard
3. **Création de dossier** - http://localhost:3000/dashboard/dossiers/new
4. **Assistant IA** - http://localhost:3000/dashboard/ai
5. **Authentification** - http://localhost:3000/auth/signin

## 🔧 MODE DÉVELOPPEMENT

### Fonctionnalités activées :
✅ **Données mockées** - Pas besoin de base de données  
✅ **Authentification simulée** - Connectez-vous automatiquement  
✅ **IA mockée** - Réponses pré-définies pour tests  
✅ **Stockage local** - Fichiers simulés en mémoire  

### Compte de test :
- **Email** : test@example.com
- **Mot de passe** : (authentification automatique)
- **Rôle** : Parent

## 🧪 TESTS À EFFECTUER

### Test 1 : Navigation de base
```
1. Ouvrir http://localhost:3000
2. Cliquer "Créer un compte gratuit"
3. Vous êtes automatiquement connecté
4. Accéder au dashboard
```

### Test 2 : Création de dossier
```
1. Aller sur http://localhost:3000/dashboard/dossiers/new
2. Remplir le formulaire :
   - Titre : "Test dossier"
   - Type : Droit familial
   - Priorité : Moyenne
3. Cliquer "Créer le dossier"
4. Vérifier la confirmation
```

### Test 3 : Assistant IA
```
1. Aller sur http://localhost:3000/dashboard/ai
2. Poser une question :
   - "Comment documenter un cas d'aliénation parentale?"
3. Vérifier la réponse
4. Tester l'upload de document
```

### Test 4 : Dashboard
```
1. Vérifier les statistiques
2. Vérifier la liste des dossiers
3. Vérifier l'activité récente
4. Tester la navigation latérale
```

## 🐛 DÉPANNAGE

### Problème : "Cannot find module"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Problème : Port 3000 occupé
```bash
# Tuer le processus sur le port 3000
lsof -ti:3000 | xargs kill -9
```

### Problème : Erreurs TypeScript
```bash
# Vérifier la configuration
npx tsc --noEmit
```

### Problème : Pages non trouvées
```bash
# Vérifier la structure des fichiers
ls -la app/
```

## 📱 FONCTIONNALITÉS TESTÉES

### ✅ Fonctionnel :
- [x] Navigation entre pages
- [x] Authentification simulée
- [x] Dashboard avec données mockées
- [x] Création de dossier
- [x] Assistant IA avec chat
- [x] Design responsive
- [x] Thème juridique

### ⚠️ À tester :
- [ ] Upload réel de fichiers
- [ ] Collaboration avocat-client
- [ ] Génération de documents
- [ ] Recherche juridique avancée

## 📊 DONNÉES MOCKÉES DISPONIBLES

### Dossiers :
1. **Dossier Tremblay** - Garde d'enfants (aliénation parentale)
2. **Dossier Martin** - Pension alimentaire
3. **Dossier Dubois** - Signalement DPJ

### Documents :
- Déclarations sous serment
- Photos de messages
- Relevés de paie

### Journal :
- Incidents documentés
- Communications
- Événements financiers

## 🔄 REINITIALISATION

Pour réinitialiser les données mockées :
```bash
# Arrêter le serveur (Ctrl+C)
# Redémarrer
npm run dev
```

Les données mockées sont rechargées à chaque démarrage.

## 📝 NOTES IMPORTANTES

### Pour le développement :
- Toutes les données sont en mémoire
- Pas de persistance entre les redémarrages
- Idéal pour tests et démonstrations

### Pour la production :
- Configurer Supabase réel
- Configurer l'IA réelle (Anthropic)
- Configurer le stockage (Cloudflare R2)

### Performance attendue :
- ⚡ Chargement instantané
- 🎨 Interface fluide
- 📱 Mobile-friendly
- 🔒 Sécurité simulée

## 🎯 PROCHAINES ÉTAPES

Après tests réussis :
1. **Déploiement Vercel** - Mettre en ligne gratuitement
2. **Supabase réel** - Configurer la base de données
3. **IA réelle** - Intégrer Claude 3.5 Sonnet
4. **Tests utilisateurs** - Recueillir du feedback
5. **Améliorations** - Itérer sur les retours

## 📞 SUPPORT

En cas de problème :
1. Vérifier les logs du serveur
2. Consulter `DEPLOYMENT.md` pour la production
3. Ouvrir une issue sur GitHub
4. Contacter le support

---

**🎉 Votre plateforme juridique est maintenant prête pour les tests locaux !**