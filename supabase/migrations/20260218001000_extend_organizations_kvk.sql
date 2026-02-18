-- Migration: Extend organizations with KVK fields (Fase 6)
-- Adds KVK registration data, address, SBI codes, and NUTS codes

-- KVK registration number (8 digits, unique)
ALTER TABLE organizations
  ADD COLUMN kvk_nummer VARCHAR(8) UNIQUE;

-- Trade name from KVK register
ALTER TABLE organizations
  ADD COLUMN handelsnaam TEXT;

-- Legal form (e.g. 'BV', 'NV', 'Stichting')
ALTER TABLE organizations
  ADD COLUMN rechtsvorm TEXT;

-- Address fields
ALTER TABLE organizations
  ADD COLUMN straat TEXT;

ALTER TABLE organizations
  ADD COLUMN postcode VARCHAR(7);

ALTER TABLE organizations
  ADD COLUMN plaats TEXT;

-- SBI activity codes (array of strings, e.g. ['62.01', '62.02'])
ALTER TABLE organizations
  ADD COLUMN sbi_codes TEXT[] DEFAULT '{}';

-- NUTS region codes (array of strings, e.g. ['NL326', 'NL32'])
ALTER TABLE organizations
  ADD COLUMN nuts_codes TEXT[] DEFAULT '{}';

-- Index for KVK lookups
CREATE INDEX idx_organizations_kvk
  ON organizations(kvk_nummer)
  WHERE kvk_nummer IS NOT NULL;

-- Index for location filtering
CREATE INDEX idx_organizations_plaats
  ON organizations(plaats)
  WHERE plaats IS NOT NULL;
