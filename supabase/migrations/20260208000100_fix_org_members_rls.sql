-- Fix self-referencing RLS policy on organization_members
-- The previous policy used a subquery on organization_members itself,
-- which causes infinite recursion in PostgreSQL RLS evaluation.

DROP POLICY IF EXISTS org_members_select ON organization_members;

CREATE POLICY org_members_select ON organization_members
  FOR SELECT
  USING (
    profile_id = auth.uid()
    OR is_superadmin()
  );
