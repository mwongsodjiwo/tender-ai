-- Migration 038: Multi-org RLS policies (Fase 2)
-- Updates all RLS policies for the multi-organization rechtenmodel.
-- Key changes:
--   1. Helper functions include superadmin bypass
--   2. External_advisor sees only assigned projects
--   3. Auditor can read organization_settings
--   4. Superadmin bypass on all tables
--   5. Data fully separated between organizations

-- =============================================================================
-- 1. UPDATE HELPER FUNCTIONS WITH SUPERADMIN BYPASS
-- =============================================================================

-- is_org_member: now returns true for superadmins
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_superadmin() OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id AND profile_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- is_org_admin: now returns true for superadmins
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_superadmin() OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND profile_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- is_project_member: now returns true for superadmins
CREATE OR REPLACE FUNCTION is_project_member(proj_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_superadmin() OR EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = proj_id AND profile_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 2. NEW HELPER: get user role within an organization
-- =============================================================================

CREATE OR REPLACE FUNCTION get_org_role(org_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role::TEXT FROM organization_members
        WHERE organization_id = org_id AND profile_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 3. ORGANIZATION RELATIONSHIPS — add superadmin bypass
-- =============================================================================

DROP POLICY IF EXISTS "Relaties zichtbaar voor betrokken org leden"
    ON organization_relationships;
DROP POLICY IF EXISTS "Relaties beheerbaar door owner/admin"
    ON organization_relationships;

-- SELECT: members of source or target org, or superadmin
CREATE POLICY org_rel_select ON organization_relationships
    FOR SELECT
    USING (
        is_superadmin()
        OR source_organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid()
        )
        OR target_organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid()
        )
    );

-- INSERT: owner/admin of source or target org, or superadmin
CREATE POLICY org_rel_insert ON organization_relationships
    FOR INSERT
    WITH CHECK (
        is_superadmin()
        OR source_organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
        )
        OR target_organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- UPDATE: owner/admin of source or target org, or superadmin
CREATE POLICY org_rel_update ON organization_relationships
    FOR UPDATE
    USING (
        is_superadmin()
        OR source_organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
        )
        OR target_organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- DELETE: owner/admin of source or target org, or superadmin
CREATE POLICY org_rel_delete ON organization_relationships
    FOR DELETE
    USING (
        is_superadmin()
        OR source_organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
        )
        OR target_organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- =============================================================================
-- 4. ORGANIZATION SETTINGS — add superadmin bypass + auditor read
-- =============================================================================

DROP POLICY IF EXISTS "Settings leesbaar voor org leden"
    ON organization_settings;
DROP POLICY IF EXISTS "Settings schrijfbaar door owner/admin"
    ON organization_settings;

-- SELECT: org members can read, auditors can read, superadmin can read all
CREATE POLICY org_settings_select ON organization_settings
    FOR SELECT
    USING (
        is_superadmin()
        OR organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid()
        )
    );

-- INSERT: only owner/admin or superadmin
CREATE POLICY org_settings_insert ON organization_settings
    FOR INSERT
    WITH CHECK (
        is_superadmin()
        OR organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- UPDATE: only owner/admin or superadmin
CREATE POLICY org_settings_update ON organization_settings
    FOR UPDATE
    USING (
        is_superadmin()
        OR organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- DELETE: only superadmin (settings should not normally be deleted)
CREATE POLICY org_settings_delete ON organization_settings
    FOR DELETE
    USING (is_superadmin());

-- =============================================================================
-- 5. PROJECTS — external_advisor restriction + superadmin bypass
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS projects_select ON projects;
DROP POLICY IF EXISTS projects_insert ON projects;
DROP POLICY IF EXISTS projects_update ON projects;

-- SELECT: superadmin sees all; owner/admin/member see org projects;
-- external_advisor sees only assigned projects (via project_members)
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
                EXISTS (
                    SELECT 1 FROM project_members
                    WHERE project_id = projects.id
                    AND profile_id = auth.uid()
                )
                AND EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_id = projects.organization_id
                    AND profile_id = auth.uid()
                    AND role IN ('external_advisor', 'auditor')
                )
            )
        )
    );

-- INSERT: owner, admin, member of org can create projects; superadmin too
CREATE POLICY projects_insert ON projects
    FOR INSERT
    WITH CHECK (
        is_superadmin()
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = projects.organization_id
            AND profile_id = auth.uid()
            AND role IN ('owner', 'admin', 'member')
        )
    );

-- UPDATE: project members can update; superadmin too
CREATE POLICY projects_update ON projects
    FOR UPDATE
    USING (
        is_superadmin()
        OR is_project_member(id)
    );

-- =============================================================================
-- 6. ORGANIZATION MEMBERS — update for superadmin and new role visibility
-- =============================================================================

-- org_members_select was already fixed in 20260208000100 to avoid recursion.
-- The current policy: profile_id = auth.uid() OR is_superadmin()
-- This is correct: each user sees their own memberships, superadmin sees all.
-- No change needed.

-- org_members_insert: already superadmin only (from 00005). Good for security.
-- Owner/admin should also be able to add members to their own org.
DROP POLICY IF EXISTS org_members_insert ON organization_members;

CREATE POLICY org_members_insert ON organization_members
    FOR INSERT
    WITH CHECK (
        is_superadmin()
        OR EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.profile_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- org_members_update: superadmin or org admin
DROP POLICY IF EXISTS org_members_update ON organization_members;

CREATE POLICY org_members_update ON organization_members
    FOR UPDATE
    USING (
        is_superadmin()
        OR EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organization_members.organization_id
            AND om.profile_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- org_members_delete: keep current (superadmin or self)
-- Already correct from 00005_superadmin.sql

-- =============================================================================
-- 7. AUDIT LOG — add superadmin bypass (already has org member check)
-- =============================================================================

-- audit_select already has superadmin bypass from 00005. No change needed.
