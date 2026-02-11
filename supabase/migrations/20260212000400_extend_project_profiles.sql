-- Planning Sprint 1: Extend project_profiles with planning metadata

ALTER TABLE project_profiles
    ADD COLUMN planning_generated_at TIMESTAMPTZ,
    ADD COLUMN planning_approved BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN planning_approved_at TIMESTAMPTZ,
    ADD COLUMN planning_approved_by UUID REFERENCES profiles(id),
    ADD COLUMN planning_metadata JSONB NOT NULL DEFAULT '{}';
