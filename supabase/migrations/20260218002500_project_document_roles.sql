-- Fase 19: Document rollen — project_document_roles tabel
-- Rollen voor template placeholders (contactpersoon, inkoper, etc.)

CREATE TABLE project_document_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_key TEXT NOT NULL,
  role_label TEXT NOT NULL,
  person_name TEXT,
  person_email TEXT,
  person_phone TEXT,
  person_function TEXT,
  -- Governance
  data_classification data_classification DEFAULT 'personal',
  retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  archive_status archive_status DEFAULT 'active',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, role_key)
);

-- Indexes
CREATE INDEX idx_project_document_roles_project
  ON project_document_roles(project_id);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_project_document_roles
  BEFORE UPDATE ON project_document_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE project_document_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_document_roles_select"
  ON project_document_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = project_document_roles.project_id
        AND om.profile_id = auth.uid()
    )
  );

CREATE POLICY "project_document_roles_insert"
  ON project_document_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = project_document_roles.project_id
        AND om.profile_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "project_document_roles_update"
  ON project_document_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = project_document_roles.project_id
        AND om.profile_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "project_document_roles_delete"
  ON project_document_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      WHERE p.id = project_document_roles.project_id
        AND om.profile_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );
