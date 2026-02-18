-- Migration 044: Add data governance fields to all relevant data tables
-- Fase 12: data_classification, retention_until, anonymized_at, archive_status
-- Supports Archiefwet 2015, AVG, and configurable retention per organization

-- =============================================================================
-- CORRESPONDENCE
-- =============================================================================

ALTER TABLE correspondence
  ADD COLUMN data_classification data_classification DEFAULT 'operational',
  ADD COLUMN retention_until TIMESTAMPTZ,
  ADD COLUMN anonymized_at TIMESTAMPTZ,
  ADD COLUMN archive_status archive_status DEFAULT 'active';

-- =============================================================================
-- ARTIFACTS
-- =============================================================================

ALTER TABLE artifacts
  ADD COLUMN data_classification data_classification DEFAULT 'operational',
  ADD COLUMN retention_until TIMESTAMPTZ,
  ADD COLUMN anonymized_at TIMESTAMPTZ,
  ADD COLUMN archive_status archive_status DEFAULT 'active';

-- =============================================================================
-- EVALUATIONS
-- =============================================================================

ALTER TABLE evaluations
  ADD COLUMN data_classification data_classification DEFAULT 'operational',
  ADD COLUMN retention_until TIMESTAMPTZ,
  ADD COLUMN anonymized_at TIMESTAMPTZ,
  ADD COLUMN archive_status archive_status DEFAULT 'active';

-- =============================================================================
-- DOCUMENTS
-- =============================================================================

ALTER TABLE documents
  ADD COLUMN data_classification data_classification DEFAULT 'operational',
  ADD COLUMN retention_until TIMESTAMPTZ,
  ADD COLUMN anonymized_at TIMESTAMPTZ,
  ADD COLUMN archive_status archive_status DEFAULT 'active';

-- =============================================================================
-- TIME_ENTRIES
-- =============================================================================

ALTER TABLE time_entries
  ADD COLUMN data_classification data_classification DEFAULT 'operational',
  ADD COLUMN retention_until TIMESTAMPTZ,
  ADD COLUMN anonymized_at TIMESTAMPTZ,
  ADD COLUMN archive_status archive_status DEFAULT 'active';

-- =============================================================================
-- CONVERSATIONS
-- =============================================================================

ALTER TABLE conversations
  ADD COLUMN data_classification data_classification DEFAULT 'operational',
  ADD COLUMN retention_until TIMESTAMPTZ,
  ADD COLUMN anonymized_at TIMESTAMPTZ,
  ADD COLUMN archive_status archive_status DEFAULT 'active';

-- =============================================================================
-- MESSAGES
-- =============================================================================

ALTER TABLE messages
  ADD COLUMN data_classification data_classification DEFAULT 'operational',
  ADD COLUMN retention_until TIMESTAMPTZ,
  ADD COLUMN anonymized_at TIMESTAMPTZ,
  ADD COLUMN archive_status archive_status DEFAULT 'active';

-- =============================================================================
-- DOCUMENT_COMMENTS
-- =============================================================================

ALTER TABLE document_comments
  ADD COLUMN data_classification data_classification DEFAULT 'operational',
  ADD COLUMN retention_until TIMESTAMPTZ,
  ADD COLUMN anonymized_at TIMESTAMPTZ,
  ADD COLUMN archive_status archive_status DEFAULT 'active';

-- =============================================================================
-- SECTION_REVIEWERS
-- =============================================================================

ALTER TABLE section_reviewers
  ADD COLUMN data_classification data_classification DEFAULT 'operational',
  ADD COLUMN retention_until TIMESTAMPTZ,
  ADD COLUMN anonymized_at TIMESTAMPTZ,
  ADD COLUMN archive_status archive_status DEFAULT 'active';

-- =============================================================================
-- DATABASE FUNCTION: set_retention_dates
-- Calculates and sets retention_until for all records related to a project,
-- based on the organization's retention settings.
-- =============================================================================

CREATE OR REPLACE FUNCTION set_retention_dates(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_org_id UUID;
  v_archive_years INT;
  v_personal_years INT;
  v_operational_years INT;
  v_contract_end TIMESTAMPTZ;
BEGIN
  -- Get the organization for this project
  SELECT organization_id INTO v_org_id
  FROM projects WHERE id = p_project_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Project not found: %', p_project_id;
  END IF;

  -- Get retention settings (fall back to defaults if no settings row)
  SELECT
    COALESCE(os.retention_archive_years_granted, 7),
    COALESCE(os.retention_personal_data_years, 1),
    COALESCE(os.retention_operational_years, 1)
  INTO v_archive_years, v_personal_years, v_operational_years
  FROM organization_settings os
  WHERE os.organization_id = v_org_id;

  -- If no settings row, use defaults
  IF NOT FOUND THEN
    v_archive_years := 7;
    v_personal_years := 1;
    v_operational_years := 1;
  END IF;

  -- Use project deadline_date as proxy for contract end, or now()
  SELECT COALESCE(deadline_date, now()) INTO v_contract_end
  FROM projects WHERE id = p_project_id;

  -- Archive tables: correspondence, artifacts, evaluations, documents
  UPDATE correspondence
  SET retention_until = v_contract_end + (v_archive_years || ' years')::INTERVAL
  WHERE project_id = p_project_id AND retention_until IS NULL;

  UPDATE artifacts
  SET retention_until = v_contract_end + (v_archive_years || ' years')::INTERVAL
  WHERE project_id = p_project_id AND retention_until IS NULL;

  UPDATE evaluations
  SET retention_until = v_contract_end + (v_archive_years || ' years')::INTERVAL
  WHERE project_id = p_project_id AND retention_until IS NULL;

  UPDATE documents
  SET retention_until = v_contract_end + (v_archive_years || ' years')::INTERVAL
  WHERE project_id = p_project_id AND retention_until IS NULL;

  -- Operational tables: conversations, messages, time_entries,
  -- document_comments, section_reviewers
  UPDATE conversations
  SET retention_until = v_contract_end + (v_operational_years || ' years')::INTERVAL
  WHERE project_id = p_project_id AND retention_until IS NULL;

  UPDATE messages
  SET retention_until = v_contract_end + (v_operational_years || ' years')::INTERVAL
  WHERE conversation_id IN (
    SELECT id FROM conversations WHERE project_id = p_project_id
  ) AND retention_until IS NULL;

  UPDATE time_entries
  SET retention_until = v_contract_end + (v_operational_years || ' years')::INTERVAL
  WHERE project_id = p_project_id AND retention_until IS NULL;

  UPDATE document_comments
  SET retention_until = v_contract_end + (v_operational_years || ' years')::INTERVAL
  WHERE project_id = p_project_id AND retention_until IS NULL;

  UPDATE section_reviewers
  SET retention_until = v_contract_end + (v_operational_years || ' years')::INTERVAL
  WHERE artifact_id IN (
    SELECT id FROM artifacts WHERE project_id = p_project_id
  ) AND retention_until IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
