-- Migration: Suppliers table — leveranciers register per organisatie (v2 Fase 8)

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kvk_nummer VARCHAR(8),
  company_name TEXT NOT NULL,
  trade_name TEXT,
  legal_form TEXT,
  street TEXT,
  postal_code VARCHAR(7),
  city TEXT,
  sbi_codes TEXT[],
  website TEXT,
  tags TEXT[],
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  -- Governance
  data_classification data_classification DEFAULT 'personal',
  retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  archive_status archive_status DEFAULT 'active',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX idx_suppliers_kvk ON suppliers(kvk_nummer);
CREATE INDEX idx_suppliers_name ON suppliers(company_name);

-- RLS: suppliers visible to organization members only
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select_org_members"
  ON suppliers FOR SELECT
  USING (
    (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
      )
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "suppliers_insert_org_members"
  ON suppliers FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );

CREATE POLICY "suppliers_update_org_members"
  ON suppliers FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );

CREATE POLICY "suppliers_delete_org_admins"
  ON suppliers FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );
