-- Migration 048: Retention signaling database functions
-- Fase 22: archive_project() and anonymize_records() for data governance
-- Supports Archiefwet 2015, AVG, VNG Selectielijst 2020

-- =============================================================================
-- FUNCTION: archive_project
-- Archives all records related to a project and sets retention_until dates.
-- Triggered when project status → 'archived' or contract ends.
-- =============================================================================

CREATE OR REPLACE FUNCTION archive_project(p_project_id UUID)
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

  -- Get retention settings (fall back to defaults)
  SELECT
    COALESCE(os.retention_archive_years_granted, 7),
    COALESCE(os.retention_personal_data_years, 1),
    COALESCE(os.retention_operational_years, 1)
  INTO v_archive_years, v_personal_years, v_operational_years
  FROM organization_settings os
  WHERE os.organization_id = v_org_id;

  IF NOT FOUND THEN
    v_archive_years := 7;
    v_personal_years := 1;
    v_operational_years := 1;
  END IF;

  -- Use project deadline_date as contract end, or now()
  SELECT COALESCE(deadline_date, now()) INTO v_contract_end
  FROM projects WHERE id = p_project_id;

  -- Archive tables: set status and retention_until
  UPDATE correspondence
  SET archive_status = 'archived',
      retention_until = v_contract_end + (v_archive_years || ' years')::INTERVAL,
      updated_at = now()
  WHERE project_id = p_project_id AND archive_status = 'active';

  UPDATE artifacts
  SET archive_status = 'archived',
      retention_until = v_contract_end + (v_archive_years || ' years')::INTERVAL,
      updated_at = now()
  WHERE project_id = p_project_id AND archive_status = 'active';

  UPDATE evaluations
  SET archive_status = 'archived',
      retention_until = v_contract_end + (v_archive_years || ' years')::INTERVAL,
      updated_at = now()
  WHERE project_id = p_project_id AND archive_status = 'active';

  UPDATE documents
  SET archive_status = 'archived',
      retention_until = v_contract_end + (v_archive_years || ' years')::INTERVAL,
      updated_at = now()
  WHERE project_id = p_project_id AND archive_status = 'active';

  -- Operational tables
  UPDATE conversations
  SET archive_status = 'archived',
      retention_until = v_contract_end + (v_operational_years || ' years')::INTERVAL,
      updated_at = now()
  WHERE project_id = p_project_id AND archive_status = 'active';

  UPDATE messages
  SET archive_status = 'archived',
      retention_until = v_contract_end + (v_operational_years || ' years')::INTERVAL,
      updated_at = now()
  WHERE conversation_id IN (
    SELECT id FROM conversations WHERE project_id = p_project_id
  ) AND archive_status = 'active';

  UPDATE time_entries
  SET archive_status = 'archived',
      retention_until = v_contract_end + (v_operational_years || ' years')::INTERVAL,
      updated_at = now()
  WHERE project_id = p_project_id AND archive_status = 'active';

  UPDATE document_comments
  SET archive_status = 'archived',
      retention_until = v_contract_end + (v_operational_years || ' years')::INTERVAL,
      updated_at = now()
  WHERE project_id = p_project_id AND archive_status = 'active';

  UPDATE section_reviewers
  SET archive_status = 'archived',
      retention_until = v_contract_end + (v_operational_years || ' years')::INTERVAL,
      updated_at = now()
  WHERE artifact_id IN (
    SELECT id FROM artifacts WHERE project_id = p_project_id
  ) AND archive_status = 'active';

  -- Update project status
  UPDATE projects
  SET status = 'archived', updated_at = now()
  WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION: anonymize_records
-- Anonymizes PII in records using 'replace' or 'remove' strategy.
-- 'replace': PII → pseudonyms (Persoon A, Bedrijf B)
-- 'remove': PII → '[verwijderd]'
-- =============================================================================

CREATE OR REPLACE FUNCTION anonymize_records(
  p_table_name TEXT,
  p_record_ids UUID[],
  p_strategy TEXT DEFAULT 'replace'
)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_replace_person TEXT;
  v_replace_company TEXT;
  v_replace_text TEXT;
BEGIN
  -- Validate strategy
  IF p_strategy NOT IN ('replace', 'remove') THEN
    RAISE EXCEPTION 'Invalid strategy: %. Use replace or remove.', p_strategy;
  END IF;

  -- Set replacement values based on strategy
  IF p_strategy = 'replace' THEN
    v_replace_person := 'Persoon A';
    v_replace_company := 'Bedrijf A';
    v_replace_text := '[geanonimiseerd]';
  ELSE
    v_replace_person := '[verwijderd]';
    v_replace_company := '[verwijderd]';
    v_replace_text := '[verwijderd]';
  END IF;

  -- Anonymize based on table type
  CASE p_table_name
    WHEN 'correspondence' THEN
      UPDATE correspondence
      SET sender_name = v_replace_person,
          recipient_name = v_replace_person,
          archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    WHEN 'evaluations' THEN
      UPDATE evaluations
      SET evaluator_name = v_replace_person,
          archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    WHEN 'documents' THEN
      UPDATE documents
      SET archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    WHEN 'artifacts' THEN
      UPDATE artifacts
      SET archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    WHEN 'suppliers' THEN
      UPDATE suppliers
      SET name = v_replace_company,
          contact_email = v_replace_text,
          contact_phone = v_replace_text,
          website = v_replace_text,
          archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    WHEN 'supplier_contacts' THEN
      UPDATE supplier_contacts
      SET first_name = v_replace_person,
          last_name = '',
          email = v_replace_text,
          phone = v_replace_text,
          archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    WHEN 'conversations' THEN
      UPDATE conversations
      SET archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    WHEN 'messages' THEN
      UPDATE messages
      SET content = v_replace_text,
          archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    WHEN 'document_comments' THEN
      UPDATE document_comments
      SET content = v_replace_text,
          archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    WHEN 'time_entries' THEN
      UPDATE time_entries
      SET description = v_replace_text,
          archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    WHEN 'incoming_questions' THEN
      UPDATE incoming_questions
      SET question_text = v_replace_text,
          submitter_name = v_replace_person,
          submitter_email = v_replace_text,
          archive_status = 'anonymized',
          anonymized_at = now(),
          updated_at = now()
      WHERE id = ANY(p_record_ids) AND anonymized_at IS NULL;
      GET DIAGNOSTICS v_count = ROW_COUNT;

    ELSE
      RAISE EXCEPTION 'Unsupported table: %', p_table_name;
  END CASE;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
