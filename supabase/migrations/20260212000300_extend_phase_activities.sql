-- Planning Sprint 1: Extend phase_activities with planning columns

ALTER TABLE phase_activities
    ADD COLUMN planned_start DATE,
    ADD COLUMN planned_end DATE,
    ADD COLUMN actual_start DATE,
    ADD COLUMN actual_end DATE,
    ADD COLUMN estimated_hours NUMERIC(6,1),
    ADD COLUMN progress_percentage INT NOT NULL DEFAULT 0
        CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Index for timeline queries
CREATE INDEX idx_phase_activities_dates
    ON phase_activities(project_id, planned_start, planned_end)
    WHERE deleted_at IS NULL;
