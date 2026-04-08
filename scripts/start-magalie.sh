#!/bin/bash
# Démarrage de Magalie v3.1 avec toutes les dépendances

set -e

# Couleurs pour le logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les variables d'environnement
check_env() {
  local missing=()
  
  for var in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
    if [ -z "${!var}" ]; then
      missing+=("$var")
    fi
  done
  
  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Variables d'environnement manquantes: ${missing[*]}"
    log_error "Sourcez le fichier .env ou exportez-les manuellement"
    exit 1
  fi
  
  log_info "Variables d'environnement vérifiées"
}

# Vérifier la santé des services
check_services() {
  log_info "Vérification des services..."
  
  # Supabase
  if curl -s -f "${SUPABASE_URL}/rest/v1/" -H "apikey: ${SUPABASE_ANON_KEY}" > /dev/null; then
    log_info "✓ Supabase connecté"
  else
    log_error "✗ Supabase inaccessible"
    exit 1
  fi
  
  # Redis (optionnel)
  if command -v redis-cli &> /dev/null; then
    if redis-cli -u "${REDIS_URL:-redis://localhost:6379}" ping > /dev/null; then
      log_info "✓ Redis connecté"
    else
      log_warn "⚠ Redis inaccessible (le cache sera désactivé)"
    fi
  fi
  
  # Prometheus (optionnel)
  if curl -s -f "${PROMETHEUS_URL:-http://localhost:9090}/api/v1/query?query=up" > /dev/null 2>&1; then
    log_info "✓ Prometheus connecté"
  else
    log_warn "⚠ Prometheus inaccessible (les métriques seront stockées localement)"
  fi
  
  # OpenClaw
  if openclaw status > /dev/null 2>&1; then
    log_info "✓ OpenClaw disponible"
  else
    log_error "✗ OpenClaw non disponible"
    exit 1
  fi
}

# Appliquer les migrations Supabase
run_migrations() {
  local migration_file="migrations/20260406000000_magalie_v3_1.sql"
  
  if [ -f "$migration_file" ]; then
    log_info "Application des migrations Magalie v3.1..."
    
    # Exécuter via Supabase CLI si disponible
    if command -v supabase &> /dev/null; then
      supabase db execute --file "$migration_file"
      log_info "✓ Migrations appliquées"
    else
      # Fallback: curl vers l'API Supabase
      log_warn "Supabase CLI non trouvé, tentative via API..."
      # Note: Implémenter l'appel API si nécessaire
      log_warn "Migration manuelle requise"
    fi
  else
    log_warn "Fichier de migration non trouvé: $migration_file"
  fi
}

# Configurer OpenClaw
configure_openclaw() {
  log_info "Configuration d'OpenClaw pour Magalie..."
  
  # Fusionner la configuration
  local temp_config=$(mktemp)
  
  # Lire la config actuelle
  openclaw config show > "$temp_config"
  
  # Fusionner avec la config Magalie
  jq -s '.[0] * .[1]' "$temp_config" "config/openclaw-magalie.json" > "$temp_config.merged"
  
  # Appliquer
  openclaw config patch --file "$temp_config.merged"
  
  rm "$temp_config" "$temp_config.merged"
  
  log_info "✓ Configuration OpenClaw mise à jour"
}

# Démarrer les agents
start_agents() {
  local project="$1"
  local budget="${2:-100000}"
  
  log_info "Démarrage des agents pour le projet: $project"
  
  # Démarrer Magalie
  openclaw magalie start \
    --project "$project" \
    --budget "$budget" \
    --parallelism dynamic \
    --config "config/openclaw-magalie.json"
  
  log_info "✓ Magalie démarré"
  
  # Attendre que Magalie soit prêt
  sleep 5
  
  # Démarrer Fiton (monitor)
  openclaw sessions_spawn \
    --agent-id fiton \
    --task "Surveillance Magalie v3.1 - projet $project" \
    --label "fiton-monitor-$project" \
    --runtime subagent
  
  log_info "✓ Fiton démarré"
  
  # Démarrer les sessions persistantes
  openclaw sessions_spawn \
    --agent-id magalie \
    --task "Orchestrer le projet $project avec budget $budget tokens" \
    --label "magalie-$project" \
    --runtime acp \
    --mode session \
    --thread true
  
  log_info "✓ Session Magalie persistante créée"
}

# Fonction principale
main() {
  local project="$1"
  local budget="${2:-100000}"
  
  if [ -z "$project" ]; then
    log_error "Usage: $0 <project-id> [budget-tokens]"
    log_error "Exemple: $0 mission-control-v2 150000"
    exit 1
  fi
  
  log_info "🚀 Démarrage de Magalie v3.1"
  log_info "Projet: $project"
  log_info "Budget: $budget tokens"
  
  # Vérifications
  check_env
  check_services
  
  # Configuration
  run_migrations
  configure_openclaw
  
  # Démarrage
  start_agents "$project" "$budget"
  
  log_info "========================================"
  log_info "Magalie v3.1 est opérationnel !"
  log_info ""
  log_info "Dashboard: http://localhost:3001/d/magalie-overview"
  log_info "API Supabase: $SUPABASE_URL"
  log_info "Projet: $project"
  log_info "Budget initial: $budget tokens"
  log_info ""
  log_info "Commandes utiles:"
  log_info "  openclaw magalie status --project $project"
  log_info "  openclaw magalie metrics --project $project"
  log_info "  openclaw magalie stop --project $project"
  log_info "========================================"
}

# Exécuter
main "$@"