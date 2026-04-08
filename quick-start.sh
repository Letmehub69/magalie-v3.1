#!/bin/bash

# Démarrage rapide de JuriPlateforme une fois Supabase prêt

echo "⚡ Démarrage rapide de JuriPlateforme"
echo "====================================="
echo ""

# Vérifier si Supabase est prêt
echo "🔍 Vérification de Supabase..."
if curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
    echo "✅ Supabase est prêt"
else
    echo "⚠️  Supabase n'est pas encore prêt"
    echo "   Attente de Supabase..."
    
    # Attendre que Supabase soit prêt (max 60 secondes)
    for i in {1..12}; do
        sleep 5
        if curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
            echo "✅ Supabase est maintenant prêt"
            break
        fi
        echo "   ... encore $((60 - i*5)) secondes"
        
        if [ $i -eq 12 ]; then
            echo "❌ Supabase ne répond pas après 60 secondes"
            echo "   Essayez: npx supabase status"
            exit 1
        fi
    done
fi

# Configurer l'environnement
echo "🔧 Configuration de l'environnement..."
cat > .env.local << 'EOF'
# Configuration Supabase locale
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Mode développement
NEXT_PUBLIC_USE_MOCK_AI=true

# URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_VERCEL_URL=http://localhost:3000
EOF

echo "✅ Environnement configuré"

# Démarrer Next.js
echo "🌐 Démarrage de l'application sur http://localhost:3000"
echo ""
echo "📋 URLs :"
echo "   • Application : http://localhost:3000"
echo "   • Supabase Studio : http://localhost:54323"
echo "   • API : http://localhost:54321/rest/v1/"
echo ""
echo "🔑 Compte de test :"
echo "   • Email : test@example.com"
echo "   • Mot de passe : (créez votre propre compte)"
echo ""
echo "🚀 Lancement..."
echo "   Appuyez sur Ctrl+C pour arrêter"
echo ""

npm run dev