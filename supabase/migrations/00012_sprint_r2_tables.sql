-- Migration: Sprint R2 — Database & API uitbreiding
-- Nieuwe tabellen voor projectprofiel, fase-activiteiten, correspondentie,
-- beoordelingen en kennisbank.

-- =============================================================================
-- STAP 1: Nieuwe enums
-- =============================================================================

CREATE TYPE activity_status AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
CREATE TYPE correspondence_status AS ENUM ('draft', 'ready', 'sent', 'archived');
CREATE TYPE evaluation_status AS ENUM ('draft', 'scoring', 'completed', 'published');

-- =============================================================================
-- STAP 2: ALTER projects — profiel bevestiging
-- =============================================================================

ALTER TABLE projects ADD COLUMN profile_confirmed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN profile_confirmed_at TIMESTAMPTZ;

-- =============================================================================
-- STAP 3: project_profiles (1-op-1 met project)
-- =============================================================================

CREATE TABLE project_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    contracting_authority TEXT NOT NULL DEFAULT '',
    department TEXT NOT NULL DEFAULT '',
    contact_name TEXT NOT NULL DEFAULT '',
    contact_email TEXT NOT NULL DEFAULT '',
    contact_phone TEXT NOT NULL DEFAULT '',
    project_goal TEXT NOT NULL DEFAULT '',
    scope_description TEXT NOT NULL DEFAULT '',
    estimated_value NUMERIC(15,2),
    currency TEXT NOT NULL DEFAULT 'EUR',
    cpv_codes TEXT[] NOT NULL DEFAULT '{}',
    nuts_codes TEXT[] NOT NULL DEFAULT '{}',
    timeline_start DATE,
    timeline_end DATE,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_project_profiles_project_id UNIQUE (project_id)
);

CREATE INDEX idx_project_profiles_project_id ON project_profiles(project_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_project_profiles_updated_at
    BEFORE UPDATE ON project_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STAP 4: phase_activities (fase-activiteiten per project)
-- =============================================================================

CREATE TABLE phase_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase project_phase NOT NULL,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status activity_status NOT NULL DEFAULT 'not_started',
    sort_order INT NOT NULL DEFAULT 0,
    assigned_to UUID REFERENCES profiles(id),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_phase_activities_project_phase ON phase_activities(project_id, phase) WHERE deleted_at IS NULL;
CREATE INDEX idx_phase_activities_status ON phase_activities(status) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_phase_activities_updated_at
    BEFORE UPDATE ON phase_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STAP 5: correspondence (brieven per project)
-- =============================================================================

CREATE TABLE correspondence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase project_phase NOT NULL,
    letter_type TEXT NOT NULL,
    recipient TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    status correspondence_status NOT NULL DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_correspondence_project_phase ON correspondence(project_id, phase) WHERE deleted_at IS NULL;
CREATE INDEX idx_correspondence_status ON correspondence(status) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_correspondence_updated_at
    BEFORE UPDATE ON correspondence
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STAP 6: evaluations (beoordelingen van inschrijvers)
-- =============================================================================

CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenderer_name TEXT NOT NULL,
    scores JSONB NOT NULL DEFAULT '{}',
    total_score NUMERIC(10,2) NOT NULL DEFAULT 0,
    ranking INT,
    status evaluation_status NOT NULL DEFAULT 'draft',
    notes TEXT NOT NULL DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_evaluations_project ON evaluations(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_evaluations_status ON evaluations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_evaluations_ranking ON evaluations(project_id, ranking) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STAP 7: knowledge_base schema + tabellen
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS knowledge_base;

CREATE TABLE knowledge_base.tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    contracting_authority TEXT,
    procedure_type TEXT,
    estimated_value NUMERIC(15,2),
    currency TEXT DEFAULT 'EUR',
    publication_date DATE,
    deadline_date DATE,
    cpv_codes TEXT[] NOT NULL DEFAULT '{}',
    nuts_codes TEXT[] NOT NULL DEFAULT '{}',
    source_url TEXT,
    raw_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE knowledge_base.requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL REFERENCES knowledge_base.tenders(id) ON DELETE CASCADE,
    requirement_text TEXT NOT NULL,
    category TEXT,
    source_section TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kb_requirements_tender ON knowledge_base.requirements(tender_id);

CREATE TABLE knowledge_base.requirement_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES knowledge_base.requirements(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    embedding vector(1536),
    token_count INT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kb_requirement_chunks_requirement ON knowledge_base.requirement_chunks(requirement_id);
CREATE INDEX idx_kb_requirement_chunks_embedding ON knowledge_base.requirement_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE knowledge_base.harvest_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    records_fetched INT NOT NULL DEFAULT 0,
    records_inserted INT NOT NULL DEFAULT 0,
    records_updated INT NOT NULL DEFAULT 0,
    errors JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge base triggers
CREATE TRIGGER trg_kb_tenders_updated_at
    BEFORE UPDATE ON knowledge_base.tenders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STAP 8: RLS policies
-- =============================================================================

-- project_profiles: project members can read/write
ALTER TABLE project_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view profiles"
    ON project_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_profiles.project_id
              AND pm.profile_id = auth.uid()
        )
    );

CREATE POLICY "Project members can insert profiles"
    ON project_profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_profiles.project_id
              AND pm.profile_id = auth.uid()
        )
    );

CREATE POLICY "Project members can update profiles"
    ON project_profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_profiles.project_id
              AND pm.profile_id = auth.uid()
        )
    );

-- phase_activities: project members can read/write
ALTER TABLE phase_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view activities"
    ON phase_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = phase_activities.project_id
              AND pm.profile_id = auth.uid()
        )
    );

CREATE POLICY "Project members can insert activities"
    ON phase_activities FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = phase_activities.project_id
              AND pm.profile_id = auth.uid()
        )
    );

CREATE POLICY "Project members can update activities"
    ON phase_activities FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = phase_activities.project_id
              AND pm.profile_id = auth.uid()
        )
    );

-- correspondence: project members can read/write
ALTER TABLE correspondence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view correspondence"
    ON correspondence FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = correspondence.project_id
              AND pm.profile_id = auth.uid()
        )
    );

CREATE POLICY "Project members can insert correspondence"
    ON correspondence FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = correspondence.project_id
              AND pm.profile_id = auth.uid()
        )
    );

CREATE POLICY "Project members can update correspondence"
    ON correspondence FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = correspondence.project_id
              AND pm.profile_id = auth.uid()
        )
    );

CREATE POLICY "Project members can delete correspondence"
    ON correspondence FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = correspondence.project_id
              AND pm.profile_id = auth.uid()
        )
    );

-- evaluations: project members can read/write
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view evaluations"
    ON evaluations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = evaluations.project_id
              AND pm.profile_id = auth.uid()
        )
    );

CREATE POLICY "Project members can insert evaluations"
    ON evaluations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = evaluations.project_id
              AND pm.profile_id = auth.uid()
        )
    );

CREATE POLICY "Project members can update evaluations"
    ON evaluations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = evaluations.project_id
              AND pm.profile_id = auth.uid()
        )
    );

CREATE POLICY "Project members can delete evaluations"
    ON evaluations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = evaluations.project_id
              AND pm.profile_id = auth.uid()
        )
    );

-- knowledge_base: authenticated users can read
ALTER TABLE knowledge_base.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base.requirement_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base.harvest_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read KB tenders"
    ON knowledge_base.tenders FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read KB requirements"
    ON knowledge_base.requirements FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read KB chunks"
    ON knowledge_base.requirement_chunks FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read harvest log"
    ON knowledge_base.harvest_log FOR SELECT
    USING (auth.role() = 'authenticated');
