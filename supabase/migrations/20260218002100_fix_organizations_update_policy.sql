-- Migration: Fix organizations UPDATE policy
-- Allow org owners and admins to update their own organization,
-- not just superadmins. This enables editing org details from
-- /settings/organization for users with owner or admin role.

DROP POLICY IF EXISTS organizations_update ON organizations;

CREATE POLICY organizations_update ON organizations
    FOR UPDATE
    USING (
        is_superadmin()
        OR is_org_admin(id)
    );
