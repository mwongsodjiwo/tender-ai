-- Migration 036: Retention profiles table with seed data

CREATE TABLE retention_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT,
  archive_years_granted SMALLINT NOT NULL,
  archive_years_not_granted SMALLINT NOT NULL,
  personal_data_years SMALLINT NOT NULL,
  operational_years SMALLINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (reference data, publicly readable)
ALTER TABLE retention_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Retention profiles publiek leesbaar"
  ON retention_profiles FOR SELECT
  USING (true);

-- Seed data: standard Dutch retention profiles
INSERT INTO retention_profiles
  (id, name, description, source,
   archive_years_granted, archive_years_not_granted,
   personal_data_years, operational_years)
VALUES
  ('vng_2020',
   'VNG Selectielijst 2020',
   'Standaard voor gemeenten',
   'VNG Selectielijst gemeentelijke en intergemeentelijke organen 2020',
   7, 5, 1, 1),
  ('provisa',
   'PROVISA',
   'Provinciale selectielijst',
   'Selectielijst archiefbescheiden provinciale organen',
   7, 5, 1, 1);
