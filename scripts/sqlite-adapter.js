#!/usr/bin/env node
// Adaptateur SQLite pour Magalie v3.1 (mode test)

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'magalie-test.db');

class SQLiteAdapter {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Exemple d'utilisation
if (require.main === module) {
  console.log('Adaptateur SQLite pour Magalie v3.1');
  console.log('Base de données:', DB_PATH);
  
  const adapter = new SQLiteAdapter();
  
  // Tester la connexion
  adapter.query('SELECT name FROM sqlite_master WHERE type="table"')
    .then(tables => {
      console.log('Tables disponibles:', tables.map(t => t.name));
      adapter.close();
    })
    .catch(err => {
      console.error('Erreur:', err.message);
      adapter.close();
    });
}

module.exports = SQLiteAdapter;