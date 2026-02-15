-- Drop unused stored procedure: get_upcoming_deadlines
-- This logic is already implemented in TypeScript (api/planning endpoints).
-- Keeping both creates maintenance burden with no benefit.

DROP FUNCTION IF EXISTS get_upcoming_deadlines(UUID, INT);
