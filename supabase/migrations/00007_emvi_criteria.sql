-- Sprint R6 — EMVI-criteria: scoring methodology and award criteria weighting tool
-- Dedicated table for managing EMVI (Economisch Meest Voordelige Inschrijving) criteria

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE scoring_methodology AS ENUM ('lowest_price', 'emvi', 'best_price_quality');
CREATE TYPE criterion_type AS ENUM ('price', 'quality');

-- =============================================================================
-- ADD SCORING METHODOLOGY TO PROJECTS
-- =============================================================================

ALTER TABLE projects ADD COLUMN scoring_methodology scoring_methodology DEFAULT NULL;

-- =============================================================================
-- EMVI CRITERIA TABLE
-- =============================================================================

CREATE TABLE emvi_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    criterion_type criterion_type NOT NULL DEFAULT 'quality',
    weight_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_emvi_criteria_project ON emvi_criteria(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_emvi_criteria_type ON emvi_criteria(criterion_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_emvi_criteria_sort ON emvi_criteria(project_id, sort_order) WHERE deleted_at IS NULL;

-- Updated_at trigger (reuses existing function from initial schema)
CREATE TRIGGER set_updated_at_emvi_criteria
    BEFORE UPDATE ON emvi_criteria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE emvi_criteria ENABLE ROW LEVEL SECURITY;

-- Project members can read criteria
CREATE POLICY emvi_criteria_select ON emvi_criteria FOR SELECT USING (
    deleted_at IS NULL AND is_project_member(project_id)
);

-- Project members can create criteria
CREATE POLICY emvi_criteria_insert ON emvi_criteria FOR INSERT WITH CHECK (
    is_project_member(project_id)
);

-- Project members can update criteria
CREATE POLICY emvi_criteria_update ON emvi_criteria FOR UPDATE USING (
    is_project_member(project_id)
);

-- Project members can soft-delete criteria
CREATE POLICY emvi_criteria_delete ON emvi_criteria FOR DELETE USING (
    is_project_member(project_id)
);
