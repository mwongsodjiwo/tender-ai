// Database row types — exactly matching Supabase schema

import type {
	OrganizationRole,
	ProjectStatus,
	ProjectRole,
	ArtifactStatus,
	MessageRole,
	DocumentCategory,
	ProcedureType,
	ReviewStatus,
	AuditAction
} from './enums.js';

// =============================================================================
// BASE TYPES
// =============================================================================

export interface Organization {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	logo_url: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface Profile {
	id: string;
	email: string;
	full_name: string;
	avatar_url: string | null;
	job_title: string | null;
	phone: string | null;
	created_at: string;
	updated_at: string;
}

export interface OrganizationMember {
	id: string;
	organization_id: string;
	profile_id: string;
	role: OrganizationRole;
	created_at: string;
	updated_at: string;
}

export interface Project {
	id: string;
	organization_id: string;
	name: string;
	description: string | null;
	status: ProjectStatus;
	procedure_type: ProcedureType | null;
	estimated_value: number | null;
	currency: string;
	publication_date: string | null;
	deadline_date: string | null;
	briefing_data: Record<string, unknown>;
	created_by: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface ProjectMember {
	id: string;
	project_id: string;
	profile_id: string;
	created_at: string;
	updated_at: string;
}

export interface ProjectMemberRole {
	id: string;
	project_member_id: string;
	role: ProjectRole;
	created_at: string;
}

export interface DocumentType {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	template_structure: TemplateSection[];
	applicable_procedures: ProcedureType[];
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface TemplateSection {
	key: string;
	title: string;
	description: string;
}

export interface Artifact {
	id: string;
	project_id: string;
	document_type_id: string;
	section_key: string;
	title: string;
	content: string;
	status: ArtifactStatus;
	version: number;
	parent_artifact_id: string | null;
	sort_order: number;
	metadata: Record<string, unknown>;
	created_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface Conversation {
	id: string;
	project_id: string;
	artifact_id: string | null;
	title: string | null;
	context_type: string;
	created_by: string;
	created_at: string;
	updated_at: string;
}

export interface Message {
	id: string;
	conversation_id: string;
	role: MessageRole;
	content: string;
	metadata: Record<string, unknown>;
	token_count: number | null;
	created_by: string | null;
	created_at: string;
}

export interface Document {
	id: string;
	organization_id: string;
	project_id: string | null;
	name: string;
	file_path: string;
	file_size: number;
	mime_type: string;
	category: DocumentCategory;
	content_text: string | null;
	metadata: Record<string, unknown>;
	uploaded_by: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface TenderNedItem {
	id: string;
	external_id: string;
	title: string;
	description: string | null;
	contracting_authority: string | null;
	procedure_type: ProcedureType | null;
	estimated_value: number | null;
	currency: string | null;
	publication_date: string | null;
	deadline_date: string | null;
	cpv_codes: string[];
	status: string | null;
	source_url: string | null;
	raw_data: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface SectionReviewer {
	id: string;
	artifact_id: string;
	email: string;
	name: string;
	token: string;
	review_status: ReviewStatus;
	feedback: string | null;
	reviewed_at: string | null;
	expires_at: string;
	created_at: string;
	updated_at: string;
}

export interface AuditLogEntry {
	id: string;
	organization_id: string | null;
	project_id: string | null;
	actor_id: string | null;
	actor_email: string | null;
	action: AuditAction;
	entity_type: string;
	entity_id: string | null;
	changes: Record<string, unknown>;
	ip_address: string | null;
	user_agent: string | null;
	created_at: string;
}

export interface ArtifactVersion {
	id: string;
	artifact_id: string;
	version: number;
	title: string;
	content: string;
	created_by: string | null;
	created_at: string;
}

// =============================================================================
// JOINED / ENRICHED TYPES
// =============================================================================

export interface OrganizationMemberWithProfile extends OrganizationMember {
	profile: Profile;
}

export interface ProjectMemberWithProfile extends ProjectMember {
	profile: Profile;
	roles: ProjectMemberRole[];
}

export interface ConversationWithMessages extends Conversation {
	messages: Message[];
}

export interface ArtifactWithReviewers extends Artifact {
	reviewers: SectionReviewer[];
}
