-- Migration: Supplier contacts — contactpersonen per leverancier (v2 Fase 8)

CREATE TABLE supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  function_title TEXT,
  is_primary BOOLEAN DEFAULT false,
  -- Governance
  data_classification data_classification DEFAULT 'personal',
  retention_until TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supplier_contacts_supplier ON supplier_contacts(supplier_id);

-- RLS: contacts inherit supplier org-scoping
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_contacts_select"
  ON supplier_contacts FOR SELECT
  USING (
    supplier_id IN (
      SELECT id FROM suppliers
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = auth.uid()
      )
      AND deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );

CREATE POLICY "supplier_contacts_insert"
  ON supplier_contacts FOR INSERT
  WITH CHECK (
    supplier_id IN (
      SELECT id FROM suppliers
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = auth.uid()
        AND role IN ('owner', 'admin', 'member')
      )
      AND deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );

CREATE POLICY "supplier_contacts_update"
  ON supplier_contacts FOR UPDATE
  USING (
    supplier_id IN (
      SELECT id FROM suppliers
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = auth.uid()
        AND role IN ('owner', 'admin', 'member')
      )
      AND deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );

CREATE POLICY "supplier_contacts_delete"
  ON supplier_contacts FOR DELETE
  USING (
    supplier_id IN (
      SELECT id FROM suppliers
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE profile_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
      AND deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true
    )
  );
