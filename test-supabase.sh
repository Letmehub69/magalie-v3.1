#!/bin/bash
# Test de connexion Supabase

echo "🔗 Test de connexion Supabase..."
echo "=================================="

# Charger les variables
if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé"
    exit 1
fi

source .env 2>/dev/null

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Variables SUPABASE_URL ou SUPABASE_ANON_KEY non définies"
    exit 1
fi

echo "✅ Fichier .env chargé"
echo "   URL: $SUPABASE_URL"
echo "   Clé anon: ${SUPABASE_ANON_KEY:0:20}..."

# Test de connexion API
echo ""
echo "📡 Test de l'API REST..."

response_code=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/" \
  --connect-timeout 10)

echo "   Code HTTP: $response_code"

if [ "$response_code" = "200" ] || [ "$response_code" = "201" ] || [ "$response_code" = "204" ]; then
    echo "   ✅ API Supabase accessible"
    
    # Tester les tables Magalie
    echo ""
    echo "🗄️  Vérification des tables Magalie..."
    
    tables=("project_tree" "project_budgets" "decision_cache")
    existing_tables=0
    
    for table in "${tables[@]}"; do
        table_code=$(curl -s -o /dev/null -w "%{http_code}" \
          -H "apikey: $SUPABASE_ANON_KEY" \
          -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
          "$SUPABASE_URL/rest/v1/$table?select=id&limit=1" \
          --connect-timeout 5)
        
        if [ "$table_code" = "200" ]; then
            echo "   ✅ $table: Existe"
            ((existing_tables++))
        else
            echo "   ❌ $table: Manquante (HTTP $table_code)"
        fi
    done
    
    echo ""
    echo "📊 Résumé:"
    echo "   Tables existantes: $existing_tables/${#tables[@]}"
    
    if [ $existing_tables -eq ${#tables[@]} ]; then
        echo ""
        echo "🎉 SUCCÈS: Supabase est correctement lié!"
        echo "   Toutes les tables Magalie existent."
        echo ""
        echo "🚀 Prochaine étape:"
        echo "   ./scripts/quick-start.sh mission-control-v2 150000"
    else
        echo ""
        echo "⚠️  ATTENTION: Tables manquantes"
        echo "   Le schéma Magalie n'a pas été appliqué."
        echo ""
        echo "📋 Prochaine étape:"
        echo "   Appliquer le schéma avec psql:"
        echo "   psql \"postgresql://postgres:[MOT_DE_PASSE]@db.$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||').supabase.co:5432/postgres\" \\"
        echo "     -f migrations/20260406000000_magalie_v3_1.sql"
    fi
    
else
    echo ""
    echo "❌ ÉCHEC: Impossible de se connecter à Supabase"
    echo "   Code HTTP: $response_code"
    echo ""
    echo "🔧 Dépannage:"
    echo "   1. Vérifie que l'URL est correcte"
    echo "   2. Vérifie que la clé anon est valide"
    echo "   3. Vérifie les permissions CORS dans Supabase Dashboard"
    echo "   4. Vérifie que le projet est actif"
    exit 1
fi

# Tester la clé service_role (optionnel)
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo ""
    echo "🔐 Test de la clé service_role..."
    
    service_code=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
      "$SUPABASE_URL/rest/v1/" \
      --connect-timeout 5)
    
    if [ "$service_code" = "200" ] || [ "$service_code" = "201" ] || [ "$service_code" = "204" ]; then
        echo "   ✅ Service_role fonctionne"
    else
        echo "   ⚠️  Service_role échoue (HTTP $service_code)"
        echo "      (Peut être normal selon les permissions)"
    fi
fi

echo ""
echo "=================================="