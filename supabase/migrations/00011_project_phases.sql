-- Migration: Add project phases (preparing/exploring/specifying/tendering/contracting)
-- Each project tracks its current phase in the procurement lifecycle.

-- =============================================================================
-- STAP 1: Maak phase enum
-- =============================================================================

CREATE TYPE project_phase AS ENUM (
    'preparing',
    'exploring',
    'specifying',
    'tendering',
    'contracting'
);

-- =============================================================================
-- STAP 2: Voeg current_phase kolom toe aan projects
-- =============================================================================

ALTER TABLE projects ADD COLUMN current_phase project_phase NOT NULL DEFAULT 'preparing';

-- =============================================================================
-- STAP 3: Index op current_phase voor filtering
-- =============================================================================

CREATE INDEX idx_projects_current_phase ON projects(current_phase) WHERE deleted_at IS NULL;
