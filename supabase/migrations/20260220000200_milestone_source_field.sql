-- Fase 34: Add source field to milestones table
-- Tracks whether a milestone date was calculated or manually set

CREATE TYPE milestone_source AS ENUM ('manual', 'calculated');

ALTER TABLE milestones
    ADD COLUMN source milestone_source NOT NULL DEFAULT 'calculated';

COMMENT ON COLUMN milestones.source IS
    'Whether the milestone date was set by the system (calculated) or by a user (manual)';
