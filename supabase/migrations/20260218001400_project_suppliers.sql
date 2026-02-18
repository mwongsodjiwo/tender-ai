-- Migration: Project suppliers — leverancier-project koppeling (v2 Fase 8)

CREATE TABLE project_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status supplier_project_status DEFAULT 'prospect',
  role supplier_project_role DEFAULT 'genodigde',
  invitation_sent_at TIMESTAMPTZ,
  submission_received_at TIMESTAMPTZ,
  submission_complete BOOLEAN,
  offer_amount DECIMAL(15,2),
  signer_name TEXT,
  signer_title TEXT,
  metadata JSONB DEFAULT '{}',
  -- Governance
  data_classification data_classification DEFAULT 'archive',
  retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  archive_status archive_status DEFAULT 'active',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, supplier_id)
);

CREATE INDEX idx_project_suppliers_project ON project_suppliers(project_id);
CREATE INDEX idx_project_suppliers_supplier ON project_suppliers(supplier_id);
CREATE INDEX idx_project_suppliers_status ON project_suppliers(status);

-- RLS: project suppliers visible to project org members
ALTER TABLE project_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_suppliers_select"
  ON project_suppliers FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );

CREATE POLICY "project_suppliers_insert"
  ON project_suppliers FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = auth.uid()
        AND role IN ('owner', 'admin', 'member')
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );

CREATE POLICY "project_suppliers_update"
  ON project_suppliers FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = auth.uid()
        AND role IN ('owner', 'admin', 'member')
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );

CREATE POLICY "project_suppliers_delete"
  ON project_suppliers FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );
