-- Sprint 3: Collaboration & Review enhancements
-- Adds magic link access policies for section_reviewers and audit log improvements

-- =============================================================================
-- HELPER FUNCTION: Validate magic link token (for unauthenticated access)
-- =============================================================================

CREATE OR REPLACE FUNCTION is_valid_reviewer_token(review_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM section_reviewers
        WHERE token = review_token
        AND review_status = 'pending'
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Check if user has a specific project role
-- =============================================================================

CREATE OR REPLACE FUNCTION has_project_role(proj_id UUID, required_role project_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_member_roles pmr
        JOIN project_members pm ON pm.id = pmr.project_member_id
        WHERE pm.project_id = proj_id
        AND pm.profile_id = auth.uid()
        AND pmr.role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ADDITIONAL RLS POLICY: Allow project_member_roles deletion by org admins
-- =============================================================================

CREATE POLICY pm_roles_delete ON project_member_roles FOR DELETE USING (
    is_org_admin(
        (SELECT p.organization_id FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.id = project_member_id)
    )
    OR (SELECT pm.profile_id FROM project_members pm WHERE pm.id = project_member_id) = auth.uid()
);

-- =============================================================================
-- ADDITIONAL RLS POLICY: Allow pm_roles insert by project leaders
-- =============================================================================

CREATE POLICY pm_roles_insert_leader ON project_member_roles FOR INSERT WITH CHECK (
    has_project_role(
        (SELECT pm.project_id FROM project_members pm WHERE pm.id = project_member_id),
        'project_leader'
    )
);

-- =============================================================================
-- ADDITIONAL RLS POLICY: Allow project_members insert by project leaders
-- =============================================================================

CREATE POLICY project_members_insert_leader ON project_members FOR INSERT WITH CHECK (
    has_project_role(project_id, 'project_leader')
);

-- =============================================================================
-- AUDIT LOG: Allow org members (not just admins) to read audit log
-- =============================================================================

DROP POLICY IF EXISTS audit_select ON audit_log;
CREATE POLICY audit_select ON audit_log FOR SELECT USING (
    is_org_member(organization_id)
    OR (project_id IS NOT NULL AND is_project_member(project_id))
);

-- =============================================================================
-- INDEX: Improve audit log query performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
