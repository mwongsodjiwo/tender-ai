-- Tendermanager Initial Schema
-- All tables for Sprint 0

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector";

-- Make extension functions accessible without schema prefix
CREATE OR REPLACE FUNCTION gen_random_bytes(int) RETURNS bytea
LANGUAGE sql AS $$ SELECT extensions.gen_random_bytes($1) $$;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE project_status AS ENUM ('draft', 'briefing', 'generating', 'review', 'approved', 'published', 'archived');
CREATE TYPE project_role AS ENUM ('project_leader', 'procurement_advisor', 'legal_advisor', 'budget_holder', 'subject_expert', 'viewer');
CREATE TYPE artifact_status AS ENUM ('draft', 'generated', 'review', 'approved', 'rejected');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE document_category AS ENUM ('policy', 'specification', 'template', 'reference', 'tenderned');
CREATE TYPE procedure_type AS ENUM ('open', 'restricted', 'negotiated_with_publication', 'negotiated_without_publication', 'competitive_dialogue', 'innovation_partnership', 'national_open', 'national_restricted', 'single_source');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'invite', 'approve', 'reject', 'generate', 'export');

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;

-- =============================================================================
-- PROFILES (extends Supabase auth.users)
-- =============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    job_title TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ORGANIZATION MEMBERS
-- =============================================================================

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role organization_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, profile_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_profile ON organization_members(profile_id);

-- =============================================================================
-- PROJECTS
-- =============================================================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'draft',
    procedure_type procedure_type,
    estimated_value NUMERIC,
    currency TEXT NOT NULL DEFAULT 'EUR',
    publication_date DATE,
    deadline_date DATE,
    briefing_data JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_org ON projects(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;

-- =============================================================================
-- PROJECT MEMBERS
-- =============================================================================

CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, profile_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);

-- =============================================================================
-- PROJECT MEMBER ROLES (one member can have multiple roles)
-- =============================================================================

CREATE TABLE project_member_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_member_id UUID NOT NULL REFERENCES project_members(id) ON DELETE CASCADE,
    role project_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_member_id, role)
);

CREATE INDEX idx_pm_roles_member ON project_member_roles(project_member_id);

-- =============================================================================
-- DOCUMENT TYPES (templates for document sections)
-- =============================================================================

CREATE TABLE document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    template_structure JSONB NOT NULL DEFAULT '[]',
    applicable_procedures procedure_type[] NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ARTIFACTS (generated document sections)
-- =============================================================================

CREATE TABLE artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    section_key TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    status artifact_status NOT NULL DEFAULT 'draft',
    version INTEGER NOT NULL DEFAULT 1,
    parent_artifact_id UUID REFERENCES artifacts(id),
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_artifacts_project ON artifacts(project_id);
CREATE INDEX idx_artifacts_doc_type ON artifacts(document_type_id);
CREATE INDEX idx_artifacts_parent ON artifacts(parent_artifact_id);

-- =============================================================================
-- CONVERSATIONS
-- =============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
    title TEXT,
    context_type TEXT NOT NULL DEFAULT 'general',
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_project ON conversations(project_id);
CREATE INDEX idx_conversations_artifact ON conversations(artifact_id);

-- =============================================================================
-- MESSAGES
-- =============================================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    token_count INTEGER,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- =============================================================================
-- DOCUMENTS (uploaded files)
-- =============================================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    category document_category NOT NULL DEFAULT 'reference',
    embedding vector(1536),
    content_text TEXT,
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_org ON documents(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_project ON documents(project_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- TENDERNED ITEMS (harvested tender data)
-- =============================================================================

CREATE TABLE tenderned_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    contracting_authority TEXT,
    procedure_type procedure_type,
    estimated_value NUMERIC,
    currency TEXT DEFAULT 'EUR',
    publication_date DATE,
    deadline_date DATE,
    cpv_codes TEXT[] DEFAULT '{}',
    status TEXT,
    source_url TEXT,
    raw_data JSONB DEFAULT '{}',
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenderned_external ON tenderned_items(external_id);
CREATE INDEX idx_tenderned_publication ON tenderned_items(publication_date);

-- =============================================================================
-- SECTION REVIEWERS (knowledge holders)
-- =============================================================================

CREATE TABLE section_reviewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    review_status review_status NOT NULL DEFAULT 'pending',
    feedback TEXT,
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_section_reviewers_artifact ON section_reviewers(artifact_id);
CREATE INDEX idx_section_reviewers_token ON section_reviewers(token);

-- =============================================================================
-- AUDIT LOG
-- =============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    project_id UUID REFERENCES projects(id),
    actor_id UUID REFERENCES profiles(id),
    actor_email TEXT,
    action audit_action NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    changes JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON audit_log(organization_id);
CREATE INDEX idx_audit_project ON audit_log(project_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_organization_members BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_project_members BEFORE UPDATE ON project_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_document_types BEFORE UPDATE ON document_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_artifacts BEFORE UPDATE ON artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_conversations BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_documents BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_tenderned_items BEFORE UPDATE ON tenderned_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_section_reviewers BEFORE UPDATE ON section_reviewers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenderned_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Helper function: check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id AND profile_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: check if user is admin/owner of organization
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
        AND profile_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: check if user is project member
CREATE OR REPLACE FUNCTION is_project_member(proj_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = proj_id AND profile_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY profiles_select ON profiles FOR SELECT USING (TRUE);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());

-- ORGANIZATIONS policies
CREATE POLICY organizations_select ON organizations FOR SELECT USING (
    deleted_at IS NULL AND is_org_member(id)
);
CREATE POLICY organizations_insert ON organizations FOR INSERT WITH CHECK (TRUE);
CREATE POLICY organizations_update ON organizations FOR UPDATE USING (is_org_admin(id));

-- ORGANIZATION MEMBERS policies
CREATE POLICY org_members_select ON organization_members FOR SELECT USING (
    is_org_member(organization_id)
);
CREATE POLICY org_members_insert ON organization_members FOR INSERT WITH CHECK (
    is_org_admin(organization_id) OR NOT EXISTS (
        SELECT 1 FROM organization_members WHERE organization_id = organization_members.organization_id
    )
);
CREATE POLICY org_members_update ON organization_members FOR UPDATE USING (
    is_org_admin(organization_id)
);
CREATE POLICY org_members_delete ON organization_members FOR DELETE USING (
    is_org_admin(organization_id) OR profile_id = auth.uid()
);

-- PROJECTS policies
CREATE POLICY projects_select ON projects FOR SELECT USING (
    deleted_at IS NULL AND is_org_member(organization_id)
);
CREATE POLICY projects_insert ON projects FOR INSERT WITH CHECK (
    is_org_member(organization_id)
);
CREATE POLICY projects_update ON projects FOR UPDATE USING (
    is_project_member(id)
);

-- PROJECT MEMBERS policies
CREATE POLICY project_members_select ON project_members FOR SELECT USING (
    is_project_member(project_id) OR is_org_admin(
        (SELECT organization_id FROM projects WHERE id = project_id)
    )
);
CREATE POLICY project_members_insert ON project_members FOR INSERT WITH CHECK (
    is_org_admin((SELECT organization_id FROM projects WHERE id = project_id))
    OR (SELECT created_by FROM projects WHERE id = project_id) = auth.uid()
);
CREATE POLICY project_members_delete ON project_members FOR DELETE USING (
    is_org_admin((SELECT organization_id FROM projects WHERE id = project_id))
);

-- PROJECT MEMBER ROLES policies
CREATE POLICY pm_roles_select ON project_member_roles FOR SELECT USING (
    is_project_member(
        (SELECT project_id FROM project_members WHERE id = project_member_id)
    )
);
CREATE POLICY pm_roles_insert ON project_member_roles FOR INSERT WITH CHECK (
    is_org_admin(
        (SELECT p.organization_id FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.id = project_member_id)
    )
);

-- DOCUMENT TYPES policies (readable by all authenticated users)
CREATE POLICY doc_types_select ON document_types FOR SELECT USING (is_active = TRUE);

-- ARTIFACTS policies
CREATE POLICY artifacts_select ON artifacts FOR SELECT USING (
    is_project_member(project_id)
);
CREATE POLICY artifacts_insert ON artifacts FOR INSERT WITH CHECK (
    is_project_member(project_id)
);
CREATE POLICY artifacts_update ON artifacts FOR UPDATE USING (
    is_project_member(project_id)
);

-- CONVERSATIONS policies
CREATE POLICY conversations_select ON conversations FOR SELECT USING (
    is_project_member(project_id)
);
CREATE POLICY conversations_insert ON conversations FOR INSERT WITH CHECK (
    is_project_member(project_id)
);

-- MESSAGES policies
CREATE POLICY messages_select ON messages FOR SELECT USING (
    is_project_member(
        (SELECT project_id FROM conversations WHERE id = conversation_id)
    )
);
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (
    is_project_member(
        (SELECT project_id FROM conversations WHERE id = conversation_id)
    )
);

-- DOCUMENTS policies
CREATE POLICY documents_select ON documents FOR SELECT USING (
    deleted_at IS NULL AND is_org_member(organization_id)
);
CREATE POLICY documents_insert ON documents FOR INSERT WITH CHECK (
    is_org_member(organization_id)
);
CREATE POLICY documents_update ON documents FOR UPDATE USING (
    is_org_member(organization_id)
);

-- TENDERNED ITEMS policies (readable by all authenticated)
CREATE POLICY tenderned_select ON tenderned_items FOR SELECT USING (TRUE);

-- SECTION REVIEWERS policies
CREATE POLICY reviewers_select ON section_reviewers FOR SELECT USING (
    is_project_member(
        (SELECT project_id FROM artifacts WHERE id = artifact_id)
    )
);
CREATE POLICY reviewers_insert ON section_reviewers FOR INSERT WITH CHECK (
    is_project_member(
        (SELECT project_id FROM artifacts WHERE id = artifact_id)
    )
);
CREATE POLICY reviewers_update ON section_reviewers FOR UPDATE USING (
    is_project_member(
        (SELECT project_id FROM artifacts WHERE id = artifact_id)
    )
);

-- AUDIT LOG policies (only org admins can read)
CREATE POLICY audit_select ON audit_log FOR SELECT USING (
    is_org_admin(organization_id)
);
CREATE POLICY audit_insert ON audit_log FOR INSERT WITH CHECK (TRUE);

-- =============================================================================
-- PROFILE AUTO-CREATION TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
