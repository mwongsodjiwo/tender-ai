-- Migration 037: Extend organization_members with source_organization_id and new roles

-- Source organization for external members (via organization relationship)
ALTER TABLE organization_members
  ADD COLUMN source_organization_id UUID REFERENCES organizations(id);

-- Index for external member lookups
CREATE INDEX idx_org_members_source_org
  ON organization_members(source_organization_id)
  WHERE source_organization_id IS NOT NULL;

-- Add new roles to existing enum
ALTER TYPE organization_role ADD VALUE 'external_advisor';
ALTER TYPE organization_role ADD VALUE 'auditor';
