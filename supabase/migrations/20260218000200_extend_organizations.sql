-- Migration 033: Extend organizations table with multi-org fields

-- Self-referencing parent for hierarchical organizations
ALTER TABLE organizations
  ADD COLUMN parent_organization_id UUID REFERENCES organizations(id);

-- Organization classification
ALTER TABLE organizations
  ADD COLUMN organization_type organization_type DEFAULT 'client';

-- Contracting authority classification (only for government orgs)
ALTER TABLE organizations
  ADD COLUMN aanbestedende_dienst_type contracting_authority_type;

-- Index for parent lookups
CREATE INDEX idx_organizations_parent
  ON organizations(parent_organization_id)
  WHERE parent_organization_id IS NOT NULL;

-- Index for type filtering
CREATE INDEX idx_organizations_type
  ON organizations(organization_type);
