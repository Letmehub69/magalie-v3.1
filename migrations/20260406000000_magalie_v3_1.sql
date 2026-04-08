-- Migration Magalie v3.1
-- Ajoute les tables pour l'architecture optimisée

-- Métriques par nœud (pour auto-tuning)
CREATE TABLE IF NOT EXISTS project_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES project_tree(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- 'build_time', 'token_usage', 'retry_count', 'cycle_type'
  value NUMERIC NOT NULL,
  context JSONB DEFAULT '{}', -- {model_used, lines_of_code, complexity_score, duration_seconds}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes pour les requêtes courantes
  CONSTRAINT project_metrics_metric_type_check 
    CHECK (metric_type IN ('build_time', 'token_usage', 'retry_count', 'cycle_type', 'cost_usd', 'complexity_score'))
);

CREATE INDEX IF NOT EXISTS idx_project_metrics_node_id ON project_metrics(node_id);
CREATE INDEX IF NOT EXISTS idx_project_metrics_type ON project_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_project_metrics_created_at ON project_metrics(created_at);

-- Cache de décisions (évite recherches répétitives)
CREATE TABLE IF NOT EXISTS decision_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA256(question + context)
  question TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  decision JSONB NOT NULL, -- {answer, reasoning, confidence, sources, model_used}
  ttl TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'), -- Time To Live
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_cache_hash ON decision_cache(decision_hash);
CREATE INDEX IF NOT EXISTS idx_decision_cache_ttl ON decision_cache(ttl);
CREATE INDEX IF NOT EXISTS idx_decision_cache_hits ON decision_cache(hit_count DESC);

-- Budget par projet
CREATE TABLE IF NOT EXISTS project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(100) NOT NULL UNIQUE, -- Identifiant du projet (ex: mission-control-v2)
  allocated_tokens INTEGER NOT NULL DEFAULT 100000, -- ~$10
  spent_tokens INTEGER NOT NULL DEFAULT 0,
  allocated_dollars NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  spent_dollars NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  alert_threshold_percent INTEGER NOT NULL DEFAULT 80, -- Alerte à 80% du budget
  last_alert_sent TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT project_budgets_tokens_positive CHECK (allocated_tokens > 0),
  CONSTRAINT project_budgets_spent_not_negative CHECK (spent_tokens >= 0),
  CONSTRAINT project_budgets_alert_threshold CHECK (alert_threshold_percent BETWEEN 1 AND 99)
);

CREATE INDEX IF NOT EXISTS idx_project_budgets_project ON project_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_spent ON project_budgets(spent_tokens DESC);

-- Métriques d'orchestration (pour le monitoring)
CREATE TABLE IF NOT EXISTS orchestration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(100) NOT NULL,
  metric_name VARCHAR(50) NOT NULL, -- 'parallelism_level', 'cache_hit_rate', 'avg_build_time'
  metric_value NUMERIC NOT NULL,
  labels JSONB DEFAULT '{}', -- {phase, node_type, agent}
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orchestration_metrics_project ON orchestration_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_orchestration_metrics_name ON orchestration_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_orchestration_metrics_time ON orchestration_metrics(timestamp DESC);

-- Table project_tree (si elle n'existe pas déjà, basée sur v3.0)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'project_tree') THEN
    CREATE TABLE project_tree (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id VARCHAR(100) NOT NULL,
      parent_id UUID REFERENCES project_tree(id) ON DELETE CASCADE,
      depth INTEGER NOT NULL DEFAULT 0 CHECK (depth <= 3), -- max 3 niveaux
      title TEXT NOT NULL,
      description TEXT,
      state VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      cycle_type VARCHAR(10) DEFAULT 'express' CHECK (cycle_type IN ('express', 'complete')),
      atomic BOOLEAN DEFAULT FALSE,
      dependencies JSONB DEFAULT '[]',
      context JSONB DEFAULT '{}',
      build_output TEXT,
      test_criteria JSONB DEFAULT '[]',
      test_result JSONB,
      isolation JSONB DEFAULT '{"branch": "", "merge_strategy": "squash"}',
      assigned_to VARCHAR(50),
      blocked_reason VARCHAR(200),
      attempt_count INTEGER DEFAULT 0,
      metrics JSONB DEFAULT '{"estimated_tokens": 0, "estimated_cost_usd": 0, "complexity_score": 1, "priority": "normal"}',
      optimization_hints JSONB DEFAULT '{"preferred_model": "sonnet", "can_use_cache": true, "parallelizable": true}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_tree_project ON project_tree(project_id);
    CREATE INDEX idx_tree_state ON project_tree(state);
    CREATE INDEX idx_tree_parent ON project_tree(parent_id);
    CREATE INDEX idx_tree_depth ON project_tree(depth);
    CREATE INDEX idx_tree_cycle_type ON project_tree(cycle_type);
    CREATE INDEX idx_tree_atomic ON project_tree(atomic) WHERE atomic = true;
  END IF;
END $$;

-- Fonctions utilitaires

-- Mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DO $$ 
BEGIN
  -- Pour project_tree
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_project_tree_updated_at') THEN
    CREATE TRIGGER update_project_tree_updated_at
      BEFORE UPDATE ON project_tree
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Pour project_budgets
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_project_budgets_updated_at') THEN
    CREATE TRIGGER update_project_budgets_updated_at
      BEFORE UPDATE ON project_budgets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Pour decision_cache
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_decision_cache_updated_at') THEN
    CREATE TRIGGER update_decision_cache_updated_at
      BEFORE UPDATE ON decision_cache
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Fonction pour nettoyer le cache expiré
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM decision_cache WHERE ttl < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le budget restant
CREATE OR REPLACE FUNCTION get_remaining_budget(project_id_param VARCHAR)
RETURNS TABLE (
  allocated_tokens INTEGER,
  spent_tokens INTEGER,
  remaining_tokens INTEGER,
  remaining_percent NUMERIC,
  alert_needed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.allocated_tokens,
    pb.spent_tokens,
    pb.allocated_tokens - pb.spent_tokens AS remaining_tokens,
    (pb.allocated_tokens - pb.spent_tokens)::NUMERIC / pb.allocated_tokens * 100 AS remaining_percent,
    (pb.spent_tokens::NUMERIC / pb.allocated_tokens * 100) >= pb.alert_threshold_percent AS alert_needed
  FROM project_budgets pb
  WHERE pb.project_id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter le budget dépensé
CREATE OR REPLACE FUNCTION increment_spent_budget(
  project_id_param VARCHAR,
  tokens_to_add INTEGER,
  dollars_to_add NUMERIC(10,2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE project_budgets
  SET 
    spent_tokens = spent_tokens + tokens_to_add,
    spent_dollars = spent_dollars + dollars_to_add
  WHERE project_id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Vue pour les métriques de performance
CREATE OR REPLACE VIEW project_performance AS
SELECT 
  pt.project_id,
  COUNT(*) as total_nodes,
  COUNT(*) FILTER (WHERE pt.state = 'DONE') as completed_nodes,
  COUNT(*) FILTER (WHERE pt.state IN ('BUILDING', 'VALIDATING')) as active_nodes,
  COUNT(*) FILTER (WHERE pt.state = 'BLOCKED') as blocked_nodes,
  AVG(pm.value) FILTER (WHERE pm.metric_type = 'build_time') as avg_build_time_seconds,
  SUM(pm.value) FILTER (WHERE pm.metric_type = 'token_usage') as total_tokens_used,
  SUM(pm.value) FILTER (WHERE pm.metric_type = 'cost_usd') as total_cost_usd
FROM project_tree pt
LEFT JOIN project_metrics pm ON pt.id = pm.node_id
GROUP BY pt.project_id;

-- Vue pour les décisions fréquentes
CREATE OR REPLACE VIEW frequent_decisions AS
SELECT 
  LEFT(question, 100) as question_summary,
  hit_count,
  decision->>'answer' as decision_answer,
  decision->>'confidence' as confidence,
  created_at,
  updated_at
FROM decision_cache
WHERE hit_count > 5
ORDER BY hit_count DESC;

-- Insertion des données de configuration par défaut
INSERT INTO project_budgets (project_id, allocated_tokens, allocated_dollars, alert_threshold_percent)
VALUES 
  ('default-template', 100000, 10.00, 80),
  ('mission-control-v2', 150000, 15.00, 80),
  ('nursing-system', 200000, 20.00, 75)
ON CONFLICT (project_id) DO NOTHING;

-- Commentaires
COMMENT ON TABLE project_metrics IS 'Métriques de performance des nœuds pour l''auto-tuning';
COMMENT ON TABLE decision_cache IS 'Cache des décisions pour éviter les recherches répétitives';
COMMENT ON TABLE project_budgets IS 'Budget et suivi des coûts par projet';
COMMENT ON TABLE orchestration_metrics IS 'Métriques d''orchestration pour le monitoring';
COMMENT ON TABLE project_tree IS 'Arbre des projets avec décomposition récursive (v3.1)';

COMMENT ON COLUMN project_metrics.context IS 'Contexte de la métrique: modèle utilisé, lignes de code, score de complexité';
COMMENT ON COLUMN decision_cache.decision_hash IS 'SHA256 de la question + contexte pour l''unicité';
COMMENT ON COLUMN decision_cache.ttl IS 'Time To Live - expiration automatique';
COMMENT ON COLUMN project_budgets.alert_threshold_percent IS 'Pourcentage du budget à partir duquel une alerte est envoyée';

-- Grants (à adapter selon votre configuration sécurité)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;