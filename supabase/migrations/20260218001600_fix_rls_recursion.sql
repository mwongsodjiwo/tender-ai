-- Migration: Fix infinite recursion in RLS policies
-- Problem: project_members policies have inline SELECT FROM projects,
--          and projects_select policy has inline SELECT FROM project_members.
--          This creates a circular RLS evaluation loop.
-- Fix: Use SECURITY DEFINER functions to bypass RLS for cross-table lookups.

-- =============================================================================
-- 1. NEW HELPER FUNCTIONS (SECURITY DEFINER = bypasses RLS)
-- =============================================================================

-- Get organization_id for a project without triggering projects RLS
CREATE OR REPLACE FUNCTION get_project_org_id(proj_id UUID)
RETURNS UUID AS $$
    SELECT organization_id FROM projects WHERE id = proj_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Check if current user is admin/owner of the project's organization
CREATE OR REPLACE FUNCTION is_project_org_admin(proj_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_superadmin() OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = (SELECT organization_id FROM projects WHERE id = proj_id)
        AND profile_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Check if current user created this project
CREATE OR REPLACE FUNCTION is_project_creator(proj_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM projects WHERE id = proj_id AND created_by = auth.uid()
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 2. FIX projects_select: replace inline project_members query with
--    SECURITY DEFINER function (is_project_member already exists)
-- =============================================================================

DROP POLICY IF EXISTS projects_select ON projects;

CREATE POLICY projects_select ON projects
    FOR SELECT
    USING (
        deleted_at IS NULL
        AND (
            is_superadmin()
            OR (
                -- Owner, admin, member: see all org projects
                EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_id = projects.organization_id
                    AND profile_id = auth.uid()
                    AND role IN ('owner', 'admin', 'member')
                )
            )
            OR (
                -- External_advisor or auditor: only assigned projects
                -- Use is_project_member() (SECURITY DEFINER) instead of
                -- inline SELECT FROM project_members to avoid recursion
                is_project_member(id)
                AND EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_id = projects.organization_id
                    AND profile_id = auth.uid()
                    AND role IN ('external_advisor', 'auditor')
                )
            )
        )
    );

-- =============================================================================
-- 3. FIX project_members policies: replace inline SELECT FROM projects
--    with SECURITY DEFINER helper functions
-- =============================================================================

DROP POLICY IF EXISTS project_members_select ON project_members;
DROP POLICY IF EXISTS project_members_insert ON project_members;
DROP POLICY IF EXISTS project_members_delete ON project_members;

CREATE POLICY project_members_select ON project_members
    FOR SELECT
    USING (
        is_project_member(project_id)
        OR is_project_org_admin(project_id)
    );

CREATE POLICY project_members_insert ON project_members
    FOR INSERT
    WITH CHECK (
        is_project_org_admin(project_id)
        OR is_project_creator(project_id)
    );

CREATE POLICY project_members_delete ON project_members
    FOR DELETE
    USING (
        is_project_org_admin(project_id)
    );

-- =============================================================================
-- 4. FIX project_member_roles policies: replace inline subqueries
-- =============================================================================

DROP POLICY IF EXISTS pm_roles_select ON project_member_roles;
DROP POLICY IF EXISTS pm_roles_insert ON project_member_roles;

CREATE POLICY pm_roles_select ON project_member_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.id = project_member_id
            AND is_project_member(pm.project_id)
        )
    );

CREATE POLICY pm_roles_insert ON project_member_roles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.id = project_member_id
            AND is_project_org_admin(pm.project_id)
        )
    );

-- =============================================================================
-- 5. FIX project_suppliers policies: replace inline SELECT FROM projects
-- =============================================================================

DROP POLICY IF EXISTS project_suppliers_select ON project_suppliers;
DROP POLICY IF EXISTS project_suppliers_insert ON project_suppliers;
DROP POLICY IF EXISTS project_suppliers_update ON project_suppliers;
DROP POLICY IF EXISTS project_suppliers_delete ON project_suppliers;

CREATE POLICY project_suppliers_select ON project_suppliers
    FOR SELECT
    USING (
        is_superadmin()
        OR is_org_member(get_project_org_id(project_id))
    );

CREATE POLICY project_suppliers_insert ON project_suppliers
    FOR INSERT
    WITH CHECK (
        is_superadmin()
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = get_project_org_id(project_id)
            AND profile_id = auth.uid()
            AND role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY project_suppliers_update ON project_suppliers
    FOR UPDATE
    USING (
        is_superadmin()
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = get_project_org_id(project_id)
            AND profile_id = auth.uid()
            AND role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY project_suppliers_delete ON project_suppliers
    FOR DELETE
    USING (
        is_superadmin()
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = get_project_org_id(project_id)
            AND profile_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- 6. FIX incoming_questions policies: replace inline SELECT FROM projects
-- =============================================================================

DROP POLICY IF EXISTS "Vragen zichtbaar voor project org leden" ON incoming_questions;
DROP POLICY IF EXISTS "Vragen bewerkbaar door project org leden" ON incoming_questions;

CREATE POLICY "Vragen zichtbaar voor project org leden"
    ON incoming_questions FOR SELECT
    USING (
        is_superadmin()
        OR is_org_member(get_project_org_id(project_id))
    );

CREATE POLICY "Vragen bewerkbaar door project org leden"
    ON incoming_questions FOR ALL
    USING (
        is_superadmin()
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = get_project_org_id(project_id)
            AND profile_id = auth.uid()
            AND role IN ('owner', 'admin', 'member')
        )
    );
