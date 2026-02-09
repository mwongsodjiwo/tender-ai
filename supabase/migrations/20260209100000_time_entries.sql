-- Migration: Urenregistratie module
-- Nieuwe tabel time_entries met activity_type enum voor het registreren van uren per project.

-- =============================================================================
-- STAP 1: activity_type enum
-- =============================================================================

CREATE TYPE time_entry_activity_type AS ENUM (
    'specifying',
    'evaluation',
    'nvi',
    'correspondence',
    'market_research',
    'meeting',
    'other'
);

-- =============================================================================
-- STAP 2: time_entries tabel
-- =============================================================================

CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC(4,2) NOT NULL,
    activity_type time_entry_activity_type NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_hours_positive CHECK (hours > 0),
    CONSTRAINT chk_hours_max CHECK (hours <= 24)
);

-- =============================================================================
-- STAP 3: Indexen
-- =============================================================================

CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_organization ON time_entries(organization_id);

-- =============================================================================
-- STAP 4: Updated at trigger
-- =============================================================================

CREATE TRIGGER trg_time_entries_updated_at
    BEFORE UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STAP 5: RLS policies — gebruiker ziet alleen eigen uren
-- =============================================================================

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries"
    ON time_entries FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own time entries"
    ON time_entries FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time entries"
    ON time_entries FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own time entries"
    ON time_entries FOR DELETE
    USING (user_id = auth.uid());
