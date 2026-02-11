-- Planning Sprint 1: Milestones table
-- Milestones are anchor points in a procurement timeline

CREATE TYPE milestone_type AS ENUM (
    'phase_start',
    'phase_end',
    'publication',
    'submission_deadline',
    'nota_van_inlichtingen',
    'award_decision',
    'standstill_end',
    'contract_signed',
    'custom'
);

CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_type milestone_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    target_date DATE NOT NULL,
    actual_date DATE,
    phase project_phase,
    is_critical BOOLEAN NOT NULL DEFAULT false,
    status activity_status NOT NULL DEFAULT 'not_started',
    sort_order INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_milestones_project ON milestones(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_milestones_date ON milestones(target_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_milestones_type ON milestones(milestone_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_milestones_project_phase ON milestones(project_id, phase) WHERE deleted_at IS NULL;

-- Auto-update trigger
CREATE TRIGGER trg_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Read: all project members
CREATE POLICY milestones_select ON milestones FOR SELECT
    USING (project_id IN (
        SELECT pm.project_id FROM project_members pm
        WHERE pm.profile_id = auth.uid()
    ));

-- Insert: project_leader and procurement_advisor
CREATE POLICY milestones_insert ON milestones FOR INSERT
    WITH CHECK (project_id IN (
        SELECT pm.project_id FROM project_members pm
        JOIN project_member_roles pmr ON pmr.project_member_id = pm.id
        WHERE pm.profile_id = auth.uid()
        AND pmr.role IN ('project_leader', 'procurement_advisor')
    ));

-- Update: project_leader and procurement_advisor
CREATE POLICY milestones_update ON milestones FOR UPDATE
    USING (project_id IN (
        SELECT pm.project_id FROM project_members pm
        JOIN project_member_roles pmr ON pmr.project_member_id = pm.id
        WHERE pm.profile_id = auth.uid()
        AND pmr.role IN ('project_leader', 'procurement_advisor')
    ));

-- Delete: project_leader and procurement_advisor
CREATE POLICY milestones_delete ON milestones FOR DELETE
    USING (project_id IN (
        SELECT pm.project_id FROM project_members pm
        JOIN project_member_roles pmr ON pmr.project_member_id = pm.id
        WHERE pm.profile_id = auth.uid()
        AND pmr.role IN ('project_leader', 'procurement_advisor')
    ));
