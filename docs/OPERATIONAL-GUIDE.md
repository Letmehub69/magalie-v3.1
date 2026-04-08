# Guide Opérationnel Magalie v3.1

## 📋 Vue d'Ensemble

Magalie v3.1 est une architecture multi-agent optimisée pour la production avec :
- **Décomposition récursive** des projets en nœuds atomiques
- **Parallélisme dynamique** (2-6 instances Bob simultanées)
- **Observabilité complète** (métriques, alertes, dashboards)
- **Gestion budgétaire** en temps réel
- **Cache intelligent** des décisions
- **Auto-healing** et récupération automatique

## 🚀 Démarrage Rapide

### Prérequis
```bash
# 1. Supabase (cloud ou self-hosted)
# 2. Redis (optionnel, pour le cache)
# 3. Prometheus + Grafana (optionnel, pour le monitoring)
# 4. OpenClaw configuré avec accès ACP

# Variables d'environnement minimales
export SUPABASE_URL="https://votre-projet.supabase.co"
export SUPABASE_ANON_KEY="votre_cle_anon"
export SUPABASE_SERVICE_ROLE_KEY="votre_cle_service_role"
export REDIS_URL="redis://localhost:6379"  # Optionnel
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."  # Optionnel
```

### Installation
```bash
# 1. Cloner/copier les fichiers Magalie v3.1
cp -r magalie-v3.1/ /Users/house/.openclaw/workspace-main/

# 2. Appliquer les migrations Supabase
cd magalie-v3.1
psql "$SUPABASE_DB_URL" -f migrations/20260406000000_magalie_v3_1.sql

# 3. Configurer OpenClaw
chmod +x scripts/start-magalie.sh
./scripts/start-magalie.sh mission-control-v2 150000
```

### Vérification
```bash
# Vérifier que Magalie tourne
openclaw magalie status --project mission-control-v2

# Vérifier les métriques
openclaw magalie metrics --project mission-control-v2

# Accéder au dashboard (si Grafana configuré)
open http://localhost:3001/d/magalie-overview
```

## 🔧 Configuration

### Fichiers Principaux
```
magalie-v3.1/
├── config/
│   └── openclaw-magalie.json      # Configuration des agents et intégrations
├── scripts/
│   ├── start-magalie.sh           # Script de démarrage principal
│   ├── fiton-monitor.js           # Surveillance et alertes
│   ├── parallelism-calculator.js  # Calcul du parallélisme optimal
│   └── decision-cache.js          # Gestion du cache des décisions
├── migrations/
│   └── 20260406000000_magalie_v3_1.sql  # Tables Supabase
└── docs/
    └── OPERATIONAL-GUIDE.md       # Ce document
```

### Agents Configurés

| Agent | Modèle | Rôle | Outils |
|-------|--------|------|--------|
| **Magalie** | Claude Sonnet 4.6 | Orchestrateur principal | Supabase, Git, Prometheus, Redis, Budget |
| **Bob** | Claude Sonnet 4.6 | Builder atomique | Git, Supabase, Code Review |
| **Fiton** | Claude Haiku 3.5 | Monitor | Prometheus, Supabase, Alertes |
| **Scout** | Claude Haiku 3.5 | Évaluateur | Supabase, Analyse de complexité |
| **Tester** | Claude Haiku 3.5 | Validateur | Supabase, Test Runner |
| **Louix** | Claude Sonnet 4.6 (vision) | Validateur UI/UX | Browser, Screenshot, Analyse visuelle |

### Variables d'Environnement

| Variable | Obligatoire | Description | Valeur par défaut |
|----------|-------------|-------------|-------------------|
| `SUPABASE_URL` | ✅ | URL de votre instance Supabase | - |
| `SUPABASE_ANON_KEY` | ✅ | Clé anonyme Supabase | - |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Clé service role Supabase | - |
| `REDIS_URL` | ❌ | URL Redis pour le cache | `redis://localhost:6379` |
| `PROMETHEUS_URL` | ❌ | URL Prometheus | `http://localhost:9090` |
| `GRAFANA_URL` | ❌ | URL Grafana | `http://localhost:3001` |
| `DISCORD_WEBHOOK_URL` | ❌ | Webhook Discord pour les alertes | - |
| `TELEGRAM_BOT_TOKEN` | ❌ | Token du bot Telegram | - |
| `TELEGRAM_CHAT_ID` | ❌ | ID du chat Telegram | - |
| `PROJECT_ID` | ✅ (runtime) | ID du projet en cours | - |

## 📊 Monitoring

### Métriques Clés à Surveiller

| Métrique | Seuil d'Alerte | Action |
|----------|----------------|--------|
| **Budget utilisé** | > 80% | Avertissement Discord/Telegram |
| **Budget utilisé** | > 95% | Alerte critique, pause automatique possible |
| **Nœuds bloqués** | > 15 min | Reset automatique, alerte |
| **Taux d'échec builds** | > 30% | Réduction parallélisme, investigation |
| **Taux hit cache** | < 50% | Optimisation requise |
| **Temps moyen build** | > 10 min | Ajustement complexité estimation |

### Dashboards Grafana

1. **Vue Projet** (`/d/magalie-project`)
   - Arbre du projet avec états en temps réel
   - Progression globale
   - Nœuds bloqués/en cours/terminés

2. **Vue Performance** (`/d/magalie-performance`)
   - Temps de build par nœud
   - Utilisation des tokens
   - Coût par phase

3. **Vue Budget** (`/d/magalie-budget`)
   - Budget alloué vs dépensé
   - Prévision de dépassement
   - Coût par agent/modèle

4. **Vue Système** (`/d/magalie-system`)
   - Santé des services (Supabase, Redis, etc.)
   - Métriques d'orchestration
   - Taux de succès/échec

### Alertes Automatiques

Les alertes sont gérées par **Fiton** (script `fiton-monitor.js`) qui :
- Vérifie les budgets toutes les minutes
- Détecte les nœuds bloqués (>15 min)
- Surveille la santé des services
- Envoie des alertes via Discord/Telegram

## 🔄 Gestion des Projets

### Démarrer un Nouveau Projet
```bash
# Via le script principal
./scripts/start-magalie.sh <project-id> <budget-tokens>

# Exemple: Mission Control v2 avec 150k tokens
./scripts/start-magalie.sh mission-control-v2 150000

# Via OpenClaw directement
openclaw magalie start \
  --project mission-control-v2 \
  --budget 150000 \
  --parallelism dynamic \
  --config config/openclaw-magalie.json
```

### Structure d'un Projet

```
[L0] Projet Racine
├── [L1] Module Infrastructure (cycle: complet)
│   ├── [L2 ATOMIQUE] Setup Next.js
│   ├── [L2 ATOMIQUE] Couche Supabase
│   └── [L2 ATOMIQUE] Composants UI de base
├── [L1] Module Dashboard (cycle: complet)
│   ├── [L2 ATOMIQUE] API route /api/usage
│   ├── [L2 ATOMIQUE] Composant Charts
│   └── [L2 ATOMIQUE] UI Dashboard
└── [L1 ATOMIQUE] Intégration finale
```

### Cycles d'Exécution

#### Cycle Express (5 phases)
Pour les nœuds simples (<100 lignes, 0 dépendances)
```
BRIEF → PLAN → BUILD → TEST → DONE
```

#### Cycle Complet (9 phases)
Pour les nœuds complexes (dépendances, architecture)
```
BRIEF → DECOMPOSE → RESEARCH → COUNCIL → PLAN → VALIDATE → BUILD → INTEGRATE → TEST → DONE
```

## 💰 Gestion Budgétaire

### Allocation par Défaut
- **Nouveau projet** : 100,000 tokens (~$10)
- **Projet moyen** : 150,000-200,000 tokens (~$15-$20)
- **Projet complexe** : 500,000+ tokens (~$50+)

### Optimisation des Coûts

Magalie sélectionne automatiquement le modèle optimal :

| Complexité | Modèle Recommandé | Coût (par MTok) | Critères |
|------------|-------------------|-----------------|----------|
| 1-2 | Haiku 3.5 | $0.25/$1.25 | Nœuds simples, validation |
| 2-4 | Sonnet 4.6 | $3/$15 | Build standard, raisonnement moyen |
| 4-5 | Opus 4.6 | $15/$75 | Décisions critiques, raisonnement complexe |

### Surveillance des Dépenses

```bash
# Vérifier le budget en temps réel
openclaw magalie budget --project mission-control-v2

# Obtenir un rapport détaillé
openclaw magalie budget --project mission-control-v2 --detailed

# Mettre à jour le budget
openclaw magalie budget --project mission-control-v2 --add-tokens 50000
```

## 🛠️ Dépannage

### Problèmes Courants

#### 1. Magalie ne démarre pas
```bash
# Vérifier les services
./scripts/start-magalie.sh check-services

# Vérifier la configuration OpenClaw
openclaw config validate

# Vérifier les logs
tail -f ~/.openclaw/logs/gateway.log
```

#### 2. Nœuds bloqués
```bash
# Lister les nœuds bloqués
openclaw magalie nodes --project <id> --state BLOCKED

# Reset un nœud spécifique
openclaw magalie node --project <id> --node <node-id> --reset

# Reset tous les nœuds bloqués
openclaw magalie nodes --project <id> --state BLOCKED --reset-all
```

#### 3. Budget épuisé
```bash
# Ajouter du budget
openclaw magalie budget --project <id> --add-tokens 100000

# Mettre en pause le projet
openclaw magalie pause --project <id>

# Reprendre avec nouveau budget
openclaw magalie resume --project <id> --budget 100000
```

#### 4. Performances médiocres
```bash
# Ajuster le parallélisme manuellement
openclaw config set agents.defaults.subagents.maxConcurrent 4

# Vérifier le cache
node scripts/decision-cache.js stats

# Nettoyer le cache expiré
node scripts/decision-cache.js cleanup
```

### Logs et Diagnostics

```bash
# Logs OpenClaw
tail -f ~/.openclaw/logs/gateway.log

# Logs Magalie
openclaw magalie logs --project <id>

# Logs Fiton (monitor)
tail -f /tmp/fiton-monitor.log

# Métriques Prometheus
curl "http://localhost:9090/api/v1/query?query=magalie_nodes_total"

# Santé Supabase
curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/"
```

## 🔐 Sécurité

### Bonnes Pratiques

1. **Secrets** : Ne jamais commettre les clés API
2. **Permissions** : Utiliser RLS (Row Level Security) dans Supabase
3. **Audit** : Journaliser toutes les décisions importantes
4. **Backup** : Sauvegarder régulièrement la base `project_tree`

### RLS (Row Level Security)

Exemple de politique pour `project_tree` :
```sql
-- Seuls les agents authentifiés peuvent lire/écrire
CREATE POLICY "Agents full access" ON project_tree
  FOR ALL USING (auth.role() = 'authenticated');
```

### Rotation des Clés

```bash
# Rotation mensuelle recommandée
# 1. Générer de nouvelles clés JWT
openssl rand -base64 64

# 2. Mettre à jour Supabase
supabase secrets set JWT_SECRET="nouvelle_cle"

# 3. Mettre à jour les variables d'environnement
export SUPABASE_ANON_KEY="nouveau_jwt_anon"
export SUPABASE_SERVICE_ROLE_KEY="nouveau_jwt_service_role"
```

## 📈 Optimisation

### Ajustement des Performances

1. **Parallélisme** : Ajuster dynamiquement basé sur la charge
2. **Cache** : Surveiller le hit rate (>80% target)
3. **Batch size** : Ajuster le nombre de nœuds par batch
4. **Modèles** : Utiliser Haiku pour les tâches simples

### Scripts d'Optimisation

```bash
# Calculer le parallélisme optimal
node scripts/parallelism-calculator.js mission-control-v2

# Analyser le cache
node scripts/decision-cache.js stats

# Nettoyer les données expirées
node scripts/decision-cache.js cleanup
```

### Surveillance Continue

```bash
# Dashboard en temps réel
open http://localhost:3001/d/magalie-overview

# Alertes automatiques
# Configurer Discord/Telegram dans les variables d'environnement

# Rapports quotidiens
# Configurer un cron job pour openclaw magalie report --project <id> --daily
```

## 🤖 Commandes OpenClaw Étendues

### Commandes Magalie
```bash
# Démarrer/arrêter
openclaw magalie start --project <id> --budget <tokens>
openclaw magalie stop --project <id> --save-state

# Surveillance
openclaw magalie status --project <id>
openclaw magalie metrics --project <id>
openclaw magalie nodes --project <id> --state <state>

# Gestion
openclaw magalie pause --project <id>
openclaw magalie resume --project <id> --budget <tokens>
openclaw magalie budget --project <id> --add-tokens <tokens>

# Debug
openclaw magalie logs --project <id> --tail 100
openclaw magalie debug --project <id> --node <node-id>
```

### Commandes Projet
```bash
# Créer un projet
openclaw project create --name "Mission Control v2" --template "nextjs-supabase"

# Lister les projets
openclaw project list

# Obtenir des détails
openclaw project get --id mission-control-v2

# Exporter le projet
openclaw project export --id mission-control-v2 --format json
```

## 🔄 Maintenance

### Tâches Régulières

| Tâche | Fréquence | Commande |
|-------|-----------|----------|
| Nettoyage cache expiré | Quotidienne | `node scripts/decision-cache.js cleanup` |
| Backup base de données | Quotidienne | `pg_dump` vers stockage externe |
| Rotation des logs | Hebdomadaire | `logrotate` configuration |
| Mise à jour dépendances | Mensuelle | `npm update` dans `scripts/` |
| Audit sécurité | Trimestrielle | Vérification RLS, permissions |

### Mise à Jour de Magalie

```bash
# 1. Sauvegarder l'état actuel
openclaw magalie stop --all --save-state

# 2. Mettre à jour les fichiers
git pull origin main  # ou copier les nouveaux fichiers

# 3. Appliquer les migrations
psql "$SUPABASE_DB_URL" -f migrations/*.sql

# 4. Redémarrer
./scripts/start-magalie.sh <project-id>
```

## 📞 Support

### Escalade

1. **Auto-healing** : Magalie tente de résoudre automatiquement
2. **Fiton** : Alertes pour les problèmes détectés
3. **Jeremiah** : Escalade manuelle pour les décisions critiques

### Format d'Escalade
```
🔺 ESCALADE — [TITRE]

Contexte : [1-2 phrases]
Situation : [Ce qui se passe]
Options :
  A) [Option A] — avantages / inconvénients
  B) [Option B] — avantages / inconvénients

Ma recommandation : Option [X] parce que [raison courte]

@Jeremiah — Ton approbation est requise avant que je continue.
```

### Contact
- **Discord** : Salon `#magalie-alerts`
- **Telegram** : Groupe `Magalie Alerts`
- **Email** : `magalie-alerts@votre-domaine.com`

---

**Dernière mise à jour :** 2026-04-05  
**Version :** Magalie v3.1  
**Documentation :** Voir aussi `ARCHITECTURE-v3.1-OPTIMIZED.md`