-- Sprint 4: Uploads, document chunks, and embedding support
-- Adds document_chunks table for RAG pipeline and indexes for vector search

-- =============================================================================
-- DOCUMENT CHUNKS (for RAG — chunked text with embeddings)
-- =============================================================================

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doc_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_doc_chunks_order ON document_chunks(document_id, chunk_index);

-- =============================================================================
-- TENDERNED CHUNKS (for RAG — chunked TenderNed descriptions)
-- =============================================================================

CREATE TABLE tenderned_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenderned_item_id UUID NOT NULL REFERENCES tenderned_items(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenderned_chunks_item ON tenderned_chunks(tenderned_item_id);
CREATE INDEX idx_tenderned_chunks_order ON tenderned_chunks(tenderned_item_id, chunk_index);

-- =============================================================================
-- VECTOR SIMILARITY SEARCH FUNCTIONS
-- =============================================================================

-- Search document chunks by embedding similarity
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 5,
    filter_project_id UUID DEFAULT NULL,
    filter_organization_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    chunk_index INTEGER,
    content TEXT,
    similarity FLOAT,
    document_name TEXT,
    document_category document_category
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.chunk_index,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity,
        d.name AS document_name,
        d.category AS document_category
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE dc.embedding IS NOT NULL
        AND d.deleted_at IS NULL
        AND 1 - (dc.embedding <=> query_embedding) > match_threshold
        AND (filter_project_id IS NULL OR d.project_id = filter_project_id OR d.project_id IS NULL)
        AND (filter_organization_id IS NULL OR d.organization_id = filter_organization_id)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Search TenderNed chunks by embedding similarity
CREATE OR REPLACE FUNCTION match_tenderned_chunks(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    tenderned_item_id UUID,
    chunk_index INTEGER,
    content TEXT,
    similarity FLOAT,
    item_title TEXT,
    item_procedure_type procedure_type
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.id,
        tc.tenderned_item_id,
        tc.chunk_index,
        tc.content,
        1 - (tc.embedding <=> query_embedding) AS similarity,
        ti.title AS item_title,
        ti.procedure_type AS item_procedure_type
    FROM tenderned_chunks tc
    JOIN tenderned_items ti ON ti.id = tc.tenderned_item_id
    WHERE tc.embedding IS NOT NULL
        AND 1 - (tc.embedding <=> query_embedding) > match_threshold
    ORDER BY tc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- =============================================================================
-- RLS POLICIES FOR NEW TABLES
-- =============================================================================

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenderned_chunks ENABLE ROW LEVEL SECURITY;

-- Document chunks: same access as parent document
CREATE POLICY doc_chunks_select ON document_chunks FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = document_chunks.document_id
        AND d.deleted_at IS NULL
        AND is_org_member(d.organization_id)
    )
);

CREATE POLICY doc_chunks_insert ON document_chunks FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = document_chunks.document_id
        AND is_org_member(d.organization_id)
    )
);

CREATE POLICY doc_chunks_delete ON document_chunks FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.id = document_chunks.document_id
        AND is_org_member(d.organization_id)
    )
);

-- TenderNed chunks: readable by all authenticated users
CREATE POLICY tenderned_chunks_select ON tenderned_chunks FOR SELECT USING (TRUE);

-- =============================================================================
-- SUPABASE STORAGE BUCKET
-- =============================================================================

-- Note: Storage bucket 'documents' must be created via Supabase dashboard or API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- Storage policies are configured via Supabase dashboard.

-- =============================================================================
-- ADD upload audit action
-- =============================================================================

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'upload';
