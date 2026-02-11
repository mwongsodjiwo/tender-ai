-- Planning Sprint 1: Stored procedure for upcoming deadlines across organization
-- Used by the dashboard deadline widget

CREATE OR REPLACE FUNCTION get_upcoming_deadlines(
    org_id UUID,
    days_ahead INT DEFAULT 30
) RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    date DATE,
    project_id UUID,
    project_name TEXT,
    phase project_phase,
    status activity_status,
    is_critical BOOLEAN,
    days_remaining INT
) AS $$
BEGIN
    RETURN QUERY
    -- Milestones
    SELECT m.id, 'milestone'::TEXT, m.title, m.target_date,
           p.id, p.name, m.phase, m.status, m.is_critical,
           (m.target_date - CURRENT_DATE)::INT
    FROM milestones m
    JOIN projects p ON p.id = m.project_id
    WHERE p.organization_id = org_id
      AND m.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND m.target_date <= CURRENT_DATE + days_ahead
      AND m.status != 'completed'

    UNION ALL

    -- Activities with due_date
    SELECT a.id, 'activity'::TEXT, a.title, a.due_date,
           p.id, p.name, a.phase, a.status, false,
           (a.due_date - CURRENT_DATE)::INT
    FROM phase_activities a
    JOIN projects p ON p.id = a.project_id
    WHERE p.organization_id = org_id
      AND a.deleted_at IS NULL
      AND p.deleted_at IS NULL
      AND a.due_date IS NOT NULL
      AND a.due_date <= CURRENT_DATE + days_ahead
      AND a.status NOT IN ('completed', 'skipped')

    ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
