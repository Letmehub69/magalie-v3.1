# 🐳 GUIDE VISUEL - Démarrer Docker Desktop

## 📋 ÉTAPES VISUELLES

### **Étape 1 : Trouver Docker Desktop**
```
1. Ouvrez le Launchpad (⌘ + Espace)
2. Tapez "Docker" dans la recherche
3. Vous devriez voir : 
   ┌─────────────────────┐
   │      🐳 Docker      │
   │      Desktop        │
   └─────────────────────┘
4. Cliquez pour ouvrir
```

### **Étape 2 : Premier lancement (si nécessaire)**
```
Si c'est la première fois :
┌─────────────────────────────────┐
│  Docker Desktop                 │
│  ─────────────────────────────  │
│                                 │
│  Bienvenue dans Docker Desktop  │
│                                 │
│  [ ] J'accepte les conditions   │
│                                 │
│        [Continuer]              │
└─────────────────────────────────┘

1. Cochez "J'accepte les conditions"
2. Cliquez "Continuer"
```

### **Étape 3 : Attendre le démarrage**
```
Une fois ouvert, vous verrez :
┌─────────────────────────────────┐
│  Docker Desktop                 │
│  ─────────────────────────────  │
│                                 │
│  🐳 Démarrage de Docker...      │
│                                 │
│  ████████████████░░ 85%        │
│                                 │
│  Cela peut prendre quelques     │
│  minutes la première fois.      │
└─────────────────────────────────┘

• Laissez la fenêtre ouverte
• Ne fermez pas Docker Desktop
• Attendez que la barre soit à 100%
```

### **Étape 4 : Vérifier que Docker est prêt**
```
Regardez en haut à droite de votre écran :
┌─────────────────────────────────────┐
│  🔔  🔋  🔊  🌐  🐳  🕐  Johnas    │
│                                     │
│  Si vous voyez l'icône 🐳 :         │
│  • 🟥 Rouge = En cours de démarrage │
│  • 🟨 Jaune = Presque prêt         │
│  • 🟩 Vert = Prêt à utiliser       │
└─────────────────────────────────────┘

Attendez que l'icône soit VERTE 🟩
```

### **Étape 5 : Vérification terminal**
```
Une fois l'icône verte, revenez au terminal
et exécutez :
./check-docker.sh

Vous devriez voir :
✅ Docker est installé
✅ Docker daemon est en cours d'exécution
```

## ⏱️ TEMPS ATTENDU

### **Premier lancement :**
- **2-5 minutes** : Téléchargement des images Docker
- **1-2 minutes** : Configuration initiale
- **30 secondes** : Démarrage des services

### **Lancements suivants :**
- **30-60 secondes** : Démarrage rapide

## 🚨 PROBLÈMES COURANTS

### **Problème 1 : "Docker Desktop cannot be opened"**
```
Solution :
1. Allez dans Applications
2. Ctrl+clic sur Docker Desktop
3. Choisir "Ouvrir"
4. Cliquer "Ouvrir" dans la popup
```

### **Problème 2 : Icône reste rouge/jaune**
```
Solution :
1. Patienter 2-3 minutes supplémentaires
2. Redémarrer Docker Desktop
3. Vérifier les mises à jour système
```

### **Problème 3 : Demande de mot de passe**
```
Docker peut demander votre mot de passe
pour installer des composants système.
C'est normal, entrez votre mot de passe.
```

## ✅ INDICATEURS DE SUCCÈS

### **Dans la barre de menu :**
- Icône 🐳 visible
- Icône VERTE (pas rouge/jaune)
- Au survol : "Docker Desktop is running"

### **Dans la fenêtre Docker :**
- Message "Docker Desktop is running"
- Statut "En cours d'exécution"
- Pas de messages d'erreur

### **Dans le terminal :**
```bash
$ docker ps
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
# (Peut être vide au début, c'est normal)
```

## 🎯 CE QUI VA SE PASSER ENSUITE

Une fois Docker démarré, nous exécuterons :
```
./launch-juriplateforme.sh
```

Ce script va :
1. ✅ Vérifier que Docker est prêt
2. ✅ Démarrer Supabase (PostgreSQL + Auth + Storage)
3. ✅ Configurer la base de données
4. ✅ Démarrer votre application
5. ✅ Vous donner les URLs d'accès

## 📱 ACCÈS RAPIDE

### **Une fois tout démarré :**
- **Votre app** : http://localhost:3000
- **Base de données** : http://localhost:54323
- **API** : http://localhost:54321/rest/v1/

### **Première connexion :**
1. Ouvrez http://localhost:3000
2. Cliquez "Créer un compte"
3. Utilisez votre email réel
4. Confirmez par email (simulé en local)
5. Explorez votre plateforme juridique !

## ⚠️ IMPORTANT

**Ne fermez pas :**
- La fenêtre Docker Desktop
- Le terminal qui lance l'application
- Votre navigateur avec l'application ouverte

**Vous pouvez fermer :**
- Le Launchpad
- Les autres fenêtres inutiles

## 🆘 BESOIN D'AIDE ?

Si Docker ne démarre pas après 5 minutes :
1. Redémarrez Docker Desktop
2. Vérifiez les mises à jour macOS
3. Consultez : https://docs.docker.com/desktop/troubleshoot/

Ou utilisez la version sans Docker :
```bash
./start-local.sh
```

---

**🎯 Objectif : Avoir l'icône Docker 🐳 VERTE dans la barre de menu**

**Une fois atteint, revenez ici et je lancerai tout automatiquement !**