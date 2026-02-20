-- Fix: anonymize_records uses first_name/last_name but supplier_contacts has name
-- Update the WHEN 'supplier_contacts' branch

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
  IF p_strategy NOT IN ('replace', 'remove') THEN
    RAISE EXCEPTION 'Invalid strategy: %. Use replace or remove.', p_strategy;
  END IF;

  IF p_strategy = 'replace' THEN
    v_replace_person := 'Persoon A';
    v_replace_company := 'Bedrijf A';
    v_replace_text := '[geanonimiseerd]';
  ELSE
    v_replace_person := '[verwijderd]';
    v_replace_company := '[verwijderd]';
    v_replace_text := '[verwijderd]';
  END IF;

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
      SET name = v_replace_person,
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
