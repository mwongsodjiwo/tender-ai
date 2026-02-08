-- Sprint R5 — Programma van Eisen: requirements table
-- Dedicated table for managing structured requirements (eisen)

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE requirement_type AS ENUM ('knockout', 'award_criterion', 'wish');
CREATE TYPE requirement_category AS ENUM ('functional', 'technical', 'process', 'quality', 'sustainability');

-- =============================================================================
-- REQUIREMENTS TABLE
-- =============================================================================

CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    requirement_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    requirement_type requirement_type NOT NULL DEFAULT 'knockout',
    category requirement_category NOT NULL DEFAULT 'functional',
    weight_percentage NUMERIC(5,2) DEFAULT 0 CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_requirements_project ON requirements(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_requirements_doc_type ON requirements(document_type_id);
CREATE INDEX idx_requirements_type ON requirements(requirement_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_requirements_category ON requirements(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_requirements_sort ON requirements(project_id, category, sort_order) WHERE deleted_at IS NULL;

-- Unique constraint: no duplicate requirement_number per project
CREATE UNIQUE INDEX idx_requirements_number_unique
    ON requirements(project_id, requirement_number) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER set_updated_at_requirements
    BEFORE UPDATE ON requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

-- Project members can read requirements
CREATE POLICY requirements_select ON requirements FOR SELECT USING (
    deleted_at IS NULL AND is_project_member(project_id)
);

-- Project members can create requirements
CREATE POLICY requirements_insert ON requirements FOR INSERT WITH CHECK (
    is_project_member(project_id)
);

-- Project members can update requirements
CREATE POLICY requirements_update ON requirements FOR UPDATE USING (
    is_project_member(project_id)
);

-- Project members can soft-delete requirements
CREATE POLICY requirements_delete ON requirements FOR DELETE USING (
    is_project_member(project_id)
);

-- =============================================================================
-- HELPER FUNCTION: generate next requirement number
-- =============================================================================

CREATE OR REPLACE FUNCTION next_requirement_number(
    p_project_id UUID,
    p_type requirement_type
)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    max_num INTEGER;
    next_num INTEGER;
BEGIN
    -- Determine prefix based on type
    CASE p_type
        WHEN 'knockout' THEN prefix := 'KO';
        WHEN 'award_criterion' THEN prefix := 'G';
        WHEN 'wish' THEN prefix := 'W';
    END CASE;

    -- Find the highest existing number for this prefix in the project
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(requirement_number FROM LENGTH(prefix) + 2) AS INTEGER)
    ), 0) INTO max_num
    FROM requirements
    WHERE project_id = p_project_id
      AND requirement_number LIKE prefix || '-%'
      AND deleted_at IS NULL;

    next_num := max_num + 1;

    RETURN prefix || '-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
