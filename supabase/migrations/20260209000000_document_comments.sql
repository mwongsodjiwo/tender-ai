-- Document comments: annotations on selected text within artifact sections
-- Used by the document-editor opmerkingen-systeem

CREATE TABLE document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    selected_text TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_document_comments_project ON document_comments(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_document_comments_artifact ON document_comments(artifact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_document_comments_created_by ON document_comments(created_by);
CREATE INDEX idx_document_comments_resolved ON document_comments(resolved) WHERE deleted_at IS NULL;

-- Auto-update trigger
CREATE TRIGGER update_document_comments_updated_at
    BEFORE UPDATE ON document_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view comments"
    ON document_comments FOR SELECT
    USING (is_project_member(project_id));

CREATE POLICY "Project members can create comments"
    ON document_comments FOR INSERT
    WITH CHECK (is_project_member(project_id));

CREATE POLICY "Comment author or project leader can update"
    ON document_comments FOR UPDATE
    USING (
        created_by = auth.uid()
        OR has_project_role(project_id, 'project_leader')
    );

CREATE POLICY "Comment author or project leader can delete"
    ON document_comments FOR DELETE
    USING (
        created_by = auth.uid()
        OR has_project_role(project_id, 'project_leader')
    );
