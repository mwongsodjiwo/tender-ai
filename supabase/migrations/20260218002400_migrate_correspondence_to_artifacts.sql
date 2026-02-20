-- Migration: Fase 17 — Migrate existing correspondence data to artifacts
-- Copies correspondence body content into artifacts table, linked to new document_types.

-- =============================================================================
-- STEP 1: Migrate correspondence body to artifacts
-- =============================================================================

INSERT INTO artifacts (
  project_id,
  document_type_id,
  section_key,
  title,
  content,
  status,
  version,
  sort_order,
  metadata
)
SELECT
  c.project_id,
  c.document_type_id,
  'body',
  COALESCE(c.subject, dt.name),
  COALESCE(c.body, ''),
  CASE c.status
    WHEN 'draft' THEN 'draft'
    WHEN 'ready' THEN 'review'
    WHEN 'sent' THEN 'approved'
    WHEN 'archived' THEN 'approved'
    ELSE 'draft'
  END::artifact_status,
  1,
  1,
  jsonb_build_object(
    'migrated_from', 'correspondence',
    'original_correspondence_id', c.id,
    'original_letter_type', c.letter_type,
    'original_recipient', c.recipient,
    'original_status', c.status,
    'original_sent_at', c.sent_at,
    'migrated_at', NOW()
  )
FROM correspondence c
JOIN document_types dt ON dt.id = c.document_type_id
WHERE c.document_type_id IS NOT NULL
  AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM artifacts a
    WHERE a.project_id = c.project_id
      AND a.document_type_id = c.document_type_id
      AND (a.metadata->>'original_correspondence_id')::text = c.id::text
  );

-- =============================================================================
-- STEP 2: Mark migrated correspondence records
-- =============================================================================

UPDATE correspondence c
SET metadata = c.metadata || jsonb_build_object(
  'migrated_to_artifacts', true,
  'migrated_at', NOW()
)
WHERE c.document_type_id IS NOT NULL
  AND c.deleted_at IS NULL
  AND NOT (c.metadata ? 'migrated_to_artifacts');
