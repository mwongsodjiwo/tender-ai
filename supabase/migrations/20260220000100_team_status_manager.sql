-- Fase 27: Team database uitbreiding — status en manager_id op organization_members

-- 1. member_status enum
CREATE TYPE member_status AS ENUM ('active', 'inactive');

-- 2. Kolom status met default 'active'
ALTER TABLE organization_members
  ADD COLUMN status member_status NOT NULL DEFAULT 'active';

-- 3. Kolom manager_id (self-reference)
ALTER TABLE organization_members
  ADD COLUMN manager_id UUID REFERENCES organization_members(id) ON DELETE SET NULL;

-- 4. Indexes
CREATE INDEX idx_organization_members_status
  ON organization_members(organization_id, status);

CREATE INDEX idx_organization_members_manager
  ON organization_members(manager_id);
