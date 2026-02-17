-- Migration 035: Organization settings table (1-to-1 with organizations)

CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  -- Retention policy
  retention_profile TEXT DEFAULT 'vng_2020',
  retention_archive_years_granted SMALLINT DEFAULT 7,
  retention_archive_years_not_granted SMALLINT DEFAULT 5,
  retention_personal_data_years SMALLINT DEFAULT 1,
  retention_operational_years SMALLINT DEFAULT 1,
  -- Anonymization
  anonymization_strategy anonymization_strategy DEFAULT 'replace',
  auto_archive_on_contract_end BOOLEAN DEFAULT true,
  notify_retention_expired BOOLEAN DEFAULT true,
  -- Threshold values (EUR) for procedure advice
  threshold_works DECIMAL(15,2) DEFAULT 5538000,
  threshold_services_central DECIMAL(15,2) DEFAULT 143000,
  threshold_services_decentral DECIMAL(15,2) DEFAULT 221000,
  threshold_social_services DECIMAL(15,2) DEFAULT 750000,
  -- Defaults
  default_currency VARCHAR(3) DEFAULT 'EUR',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Readable by all org members
CREATE POLICY "Settings leesbaar voor org leden"
  ON organization_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

-- Writable only by owner/admin
CREATE POLICY "Settings schrijfbaar door owner/admin"
  ON organization_settings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_updated_at_organization_settings
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
