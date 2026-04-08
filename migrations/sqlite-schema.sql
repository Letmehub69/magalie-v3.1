-- Schéma SQLite pour Magalie v3.1 (mode test)
-- Exécuter: sqlite3 magalie-test.db < migrations/sqlite-schema.sql

CREATE TABLE IF NOT EXISTS project_tree (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    state TEXT DEFAULT 'PENDING',
    cycle_type TEXT DEFAULT 'EXPRESS',
    atomic BOOLEAN DEFAULT 1,
    dependencies TEXT, -- JSON array
    assigned_to TEXT,
    metrics TEXT, -- JSON object
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_budgets (
    project_id TEXT PRIMARY KEY,
    allocated_tokens INTEGER DEFAULT 100000,
    spent_tokens INTEGER DEFAULT 0,
    allocated_dollars REAL DEFAULT 10.0,
    spent_dollars REAL DEFAULT 0.0,
    alert_threshold_percent INTEGER DEFAULT 80,
    last_alert_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS decision_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_hash TEXT UNIQUE NOT NULL,
    question TEXT NOT NULL,
    context TEXT, -- JSON
    decision TEXT NOT NULL, -- JSON
    ttl TIMESTAMP NOT NULL,
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_tree_project ON project_tree(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tree_state ON project_tree(state);
CREATE INDEX IF NOT EXISTS idx_decision_cache_hash ON decision_cache(decision_hash);
CREATE INDEX IF NOT EXISTS idx_decision_cache_ttl ON decision_cache(ttl);

-- Données de test
INSERT OR IGNORE INTO project_budgets (project_id, allocated_tokens, spent_tokens)
VALUES ('test-project', 100000, 0);

INSERT OR IGNORE INTO project_budgets (project_id, allocated_tokens, spent_tokens)
VALUES ('mission-control-v2', 150000, 0);