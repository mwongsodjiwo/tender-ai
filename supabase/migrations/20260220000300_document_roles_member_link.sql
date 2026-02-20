-- Fase 30: Link document roles to organization members
-- Adds project_member_id FK to project_document_roles
-- Person fields were already nullable in the original migration

ALTER TABLE project_document_roles
    ADD COLUMN project_member_id UUID
        REFERENCES organization_members(id)
        ON DELETE SET NULL;

CREATE INDEX idx_project_document_roles_member
    ON project_document_roles(project_member_id)
    WHERE project_member_id IS NOT NULL;

COMMENT ON COLUMN project_document_roles.project_member_id IS
    'Optional link to an organization member. When set, person_* fields are auto-filled from the member profile.';
