-- Sprint 2: Artifact versioning table

CREATE TABLE artifact_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(artifact_id, version)
);

CREATE INDEX idx_artifact_versions_artifact ON artifact_versions(artifact_id);
CREATE INDEX idx_artifact_versions_version ON artifact_versions(artifact_id, version DESC);

-- RLS
ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY artifact_versions_select ON artifact_versions FOR SELECT USING (
    is_project_member(
        (SELECT project_id FROM artifacts WHERE id = artifact_id)
    )
);

CREATE POLICY artifact_versions_insert ON artifact_versions FOR INSERT WITH CHECK (
    is_project_member(
        (SELECT project_id FROM artifacts WHERE id = artifact_id)
    )
);
