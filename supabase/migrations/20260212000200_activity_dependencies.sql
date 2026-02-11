-- Planning Sprint 1: Activity dependencies table
-- Tracks which activities/milestones depend on each other

CREATE TYPE dependency_type AS ENUM (
    'finish_to_start',
    'start_to_start',
    'finish_to_finish',
    'start_to_finish'
);

CREATE TABLE activity_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('activity', 'milestone')),
    source_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('activity', 'milestone')),
    target_id UUID NOT NULL,
    dependency_type dependency_type NOT NULL DEFAULT 'finish_to_start',
    lag_days INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_type, source_id, target_type, target_id)
);

CREATE INDEX idx_deps_project ON activity_dependencies(project_id);
CREATE INDEX idx_deps_source ON activity_dependencies(source_type, source_id);
CREATE INDEX idx_deps_target ON activity_dependencies(target_type, target_id);

-- Auto-update trigger
CREATE TRIGGER trg_activity_dependencies_updated_at
    BEFORE UPDATE ON activity_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE activity_dependencies ENABLE ROW LEVEL SECURITY;

-- Read: all project members
CREATE POLICY deps_select ON activity_dependencies FOR SELECT
    USING (project_id IN (
        SELECT pm.project_id FROM project_members pm
        WHERE pm.profile_id = auth.uid()
    ));

-- Insert: project_leader and procurement_advisor
CREATE POLICY deps_insert ON activity_dependencies FOR INSERT
    WITH CHECK (project_id IN (
        SELECT pm.project_id FROM project_members pm
        JOIN project_member_roles pmr ON pmr.project_member_id = pm.id
        WHERE pm.profile_id = auth.uid()
        AND pmr.role IN ('project_leader', 'procurement_advisor')
    ));

-- Update: project_leader and procurement_advisor
CREATE POLICY deps_update ON activity_dependencies FOR UPDATE
    USING (project_id IN (
        SELECT pm.project_id FROM project_members pm
        JOIN project_member_roles pmr ON pmr.project_member_id = pm.id
        WHERE pm.profile_id = auth.uid()
        AND pmr.role IN ('project_leader', 'procurement_advisor')
    ));

-- Delete: project_leader and procurement_advisor
CREATE POLICY deps_delete ON activity_dependencies FOR DELETE
    USING (project_id IN (
        SELECT pm.project_id FROM project_members pm
        JOIN project_member_roles pmr ON pmr.project_member_id = pm.id
        WHERE pm.profile_id = auth.uid()
        AND pmr.role IN ('project_leader', 'procurement_advisor')
    ));
