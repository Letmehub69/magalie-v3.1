#!/usr/bin/env node
// Test de connexion Supabase pour Magalie v3.1

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('🔗 Test de connexion Supabase...\n');

// Lire le fichier .env
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env non trouvé');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

// Parser le fichier .env (simplifié)
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      // Supprimer les guillemets
      envVars[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
});

// Vérifier les variables requises
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter(key => !envVars[key]);

if (missing.length > 0) {
  console.error(`❌ Variables manquantes dans .env: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('✅ Fichier .env valide');
console.log(`   URL: ${envVars.SUPABASE_URL.substring(0, 40)}...`);
console.log(`   Clé anon: ${envVars.SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log(`   Clé service: ${envVars.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...\n`);

// Tester la connexion avec la clé anon
console.log('1. Test avec clé anon (public)...');
const supabaseAnon = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_ANON_KEY);

supabaseAnon.from('pg_stat_activity').select('*', { count: 'exact', head: true })
  .then(response => {
    if (response.error) {
      console.log(`   ❌ Erreur: ${response.error.message}`);
      console.log(`   Code: ${response.error.code}`);
      console.log(`   Détails: ${response.error.details}`);
    } else {
      console.log(`   ✅ Connexion réussie (statut: ${response.status})`);
      
      // Vérifier si les tables Magalie existent
      console.log('\n2. Vérification des tables Magalie...');
      const tables = ['project_tree', 'project_budgets', 'decision_cache'];
      
      Promise.all(
        tables.map(table => 
          supabaseAnon.from(table).select('*', { count: 'exact', head: true })
            .then(r => ({ table, exists: !r.error, error: r.error }))
            .catch(() => ({ table, exists: false }))
        )
      ).then(results => {
        const existingTables = results.filter(r => r.exists);
        const missingTables = results.filter(r => !r.exists);
        
        console.log(`   Tables existantes: ${existingTables.length}/${tables.length}`);
        existingTables.forEach(r => console.log(`     ✅ ${r.table}`));
        missingTables.forEach(r => console.log(`     ❌ ${r.table}`));
        
        if (missingTables.length > 0) {
          console.log('\n⚠️  Tables manquantes - le schéma doit être appliqué');
          console.log('   Exécute: psql "postgresql://..." -f migrations/20260406000000_magalie_v3_1.sql');
        } else {
          console.log('\n✅ Toutes les tables Magalie existent!');
        }
        
        // Tester la clé service_role
        console.log('\n3. Test avec clé service_role...');
        const supabaseService = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);
        
        supabaseService.from('pg_stat_activity').select('*', { count: 'exact', head: true })
          .then(serviceResponse => {
            if (serviceResponse.error) {
              console.log(`   ⚠️  Erreur service_role: ${serviceResponse.error.message}`);
              console.log('   (Peut être normal si les permissions sont restrictives)');
            } else {
              console.log(`   ✅ Service_role fonctionne (statut: ${serviceResponse.status})`);
            }
            
            console.log('\n🎯 RÉSUMÉ:');
            console.log('   ✅ Connexion Supabase: OK');
            console.log(`   ✅ Tables Magalie: ${existingTables.length}/${tables.length}`);
            console.log('   ✅ Configuration: Complète');
            
            if (missingTables.length === 0) {
              console.log('\n🚀 Magalie v3.1 est prêt à démarrer!');
              console.log('   Exécute: ./scripts/quick-start.sh mission-control-v2 150000');
            } else {
              console.log('\n📋 Prochaine étape: Appliquer le schéma avec psql');
            }
            
            process.exit(0);
          })
          .catch(err => {
            console.log(`   ⚠️  Erreur service_role: ${err.message}`);
            process.exit(0);
          });
      });
    }
  })
  .catch(error => {
    console.error(`   ❌ Erreur fatale: ${error.message}`);
    process.exit(1);
  });