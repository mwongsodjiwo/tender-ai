-- Migration 034: Organization relationships table

CREATE TABLE organization_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  relationship_type organization_relationship_type NOT NULL,
  status relationship_status DEFAULT 'pending',
  contract_reference TEXT,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_organization_id, target_organization_id, relationship_type),
  CHECK (source_organization_id != target_organization_id)
);

-- Indexes for lookups from both sides
CREATE INDEX idx_org_rel_source
  ON organization_relationships(source_organization_id);

CREATE INDEX idx_org_rel_target
  ON organization_relationships(target_organization_id);

CREATE INDEX idx_org_rel_status
  ON organization_relationships(status);

-- Enable RLS
ALTER TABLE organization_relationships ENABLE ROW LEVEL SECURITY;

-- Members of source or target org can view relationships
CREATE POLICY "Relaties zichtbaar voor betrokken org leden"
  ON organization_relationships FOR SELECT
  USING (
    source_organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
    OR target_organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- Only owner/admin of source or target can manage relationships
CREATE POLICY "Relaties beheerbaar door owner/admin"
  ON organization_relationships FOR ALL
  USING (
    source_organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR target_organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_updated_at_organization_relationships
  BEFORE UPDATE ON organization_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
