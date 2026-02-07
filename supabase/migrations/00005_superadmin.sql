-- Migration: Superadmin authorization model
-- Only superadmins may create organizations and manage org memberships.

-- 1. Add is_superadmin column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. RLS helper function: check if current user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_superadmin FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- 3. Extend audit_action enum
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'admin_action';

-- 4. Drop existing RLS policies that need updating

-- Organizations
DROP POLICY IF EXISTS organizations_insert ON organizations;
DROP POLICY IF EXISTS organizations_update ON organizations;
DROP POLICY IF EXISTS organizations_select ON organizations;

-- Organization members
DROP POLICY IF EXISTS org_members_insert ON organization_members;
DROP POLICY IF EXISTS org_members_update ON organization_members;
DROP POLICY IF EXISTS org_members_delete ON organization_members;
DROP POLICY IF EXISTS org_members_select ON organization_members;

-- Audit log
DROP POLICY IF EXISTS audit_select ON audit_log;

-- 5. Re-create policies with superadmin rules

-- Organizations: only superadmin can insert
CREATE POLICY organizations_insert ON organizations
  FOR INSERT
  WITH CHECK (is_superadmin());

-- Organizations: only superadmin can update
CREATE POLICY organizations_update ON organizations
  FOR UPDATE
  USING (is_superadmin());

-- Organizations: members can see their own orgs, superadmin can see all
CREATE POLICY organizations_select ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = id
        AND organization_members.profile_id = auth.uid()
    )
    OR is_superadmin()
  );

-- Org members: only superadmin can insert
CREATE POLICY org_members_insert ON organization_members
  FOR INSERT
  WITH CHECK (is_superadmin());

-- Org members: only superadmin can update
CREATE POLICY org_members_update ON organization_members
  FOR UPDATE
  USING (is_superadmin());

-- Org members: superadmin or self can delete
CREATE POLICY org_members_delete ON organization_members
  FOR DELETE
  USING (is_superadmin() OR profile_id = auth.uid());

-- Org members: members can see their org's members, superadmin can see all
CREATE POLICY org_members_select ON organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.profile_id = auth.uid()
    )
    OR is_superadmin()
  );

-- Audit log: org members can see their org's logs, superadmin can see all
CREATE POLICY audit_select ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = audit_log.organization_id
        AND organization_members.profile_id = auth.uid()
    )
    OR is_superadmin()
  );
