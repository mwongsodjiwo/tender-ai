-- Migration: document_templates table (Fase 14 — Template storage)
-- Creates table for managing .docx templates per organization and document type.

-- ============================================================================
-- TABLE: document_templates
-- ============================================================================

CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  category_type cpv_category_type,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  placeholders JSONB DEFAULT '[]',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_document_templates_org ON document_templates(organization_id);
CREATE INDEX idx_document_templates_type ON document_templates(document_type_id);
CREATE INDEX idx_document_templates_default ON document_templates(organization_id, document_type_id, is_default)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_templates_select_org_members"
  ON document_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "document_templates_all_admin_owner"
  ON document_templates FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- TRIGGER: updated_at
-- ============================================================================

CREATE TRIGGER set_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE: document-templates bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-templates',
  'document-templates',
  false,
  52428800, -- 50 MB
  ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: org members can read, admin/owner can upload/delete
CREATE POLICY "document_templates_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'document-templates'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM organization_members
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "document_templates_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'document-templates'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "document_templates_storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'document-templates'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM organization_members
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
