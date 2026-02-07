// API request/response types

import type {
	Organization,
	Profile,
	OrganizationMember,
	Project,
	ProjectMember,
	ProjectMemberRole,
	Artifact,
	Conversation,
	DocumentType,
	AuditLogEntry
} from './database.js';
import type { OrganizationRole, ProcedureType, ProjectRole, ArtifactStatus } from './enums.js';

// =============================================================================
// COMMON
// =============================================================================

export interface ApiError {
	message: string;
	code: string;
	status: number;
}

export interface ApiResponse<T> {
	data: T;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	per_page: number;
}

// =============================================================================
// AUTH
// =============================================================================

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
	full_name: string;
}

export interface AuthResponse {
	user: Profile;
	session: {
		access_token: string;
		refresh_token: string;
		expires_at: number;
	};
}

// =============================================================================
// ORGANIZATIONS
// =============================================================================

export interface CreateOrganizationRequest {
	name: string;
	slug: string;
	description?: string;
}

export interface UpdateOrganizationRequest {
	name?: string;
	description?: string;
	logo_url?: string;
}

export interface InviteMemberRequest {
	email: string;
	role: OrganizationRole;
}

export type OrganizationResponse = Organization;
export type OrganizationListResponse = Organization[];
export type OrganizationMemberResponse = OrganizationMember;

// =============================================================================
// PROFILES
// =============================================================================

export interface UpdateProfileRequest {
	full_name?: string;
	job_title?: string;
	phone?: string;
	avatar_url?: string;
}

export type ProfileResponse = Profile;

// =============================================================================
// CHAT
// =============================================================================

export interface ChatRequest {
	conversation_id: string;
	message: string;
}

export interface ChatResponse {
	message_id: string;
	content: string;
	conversation_id: string;
}

// =============================================================================
// PROJECTS
// =============================================================================

export interface CreateProjectRequest {
	organization_id: string;
	name: string;
	description?: string;
	procedure_type?: ProcedureType;
	estimated_value?: number;
	publication_date?: string;
	deadline_date?: string;
}

export interface UpdateProjectRequest {
	name?: string;
	description?: string;
	status?: 'draft' | 'briefing' | 'generating' | 'review' | 'approved' | 'published' | 'archived';
	procedure_type?: ProcedureType;
	estimated_value?: number;
	publication_date?: string;
	deadline_date?: string;
	briefing_data?: Record<string, unknown>;
}

export type ProjectResponse = Project;
export type ProjectListResponse = Project[];

// =============================================================================
// PROJECT MEMBERS
// =============================================================================

export interface AddProjectMemberRequest {
	profile_id: string;
	roles: ProjectRole[];
}

export interface ProjectMemberWithRoles extends ProjectMember {
	profile: Profile;
	roles: ProjectMemberRole[];
}

// =============================================================================
// ARTIFACTS
// =============================================================================

export interface CreateArtifactRequest {
	document_type_id: string;
	section_key: string;
	title: string;
	content?: string;
	sort_order?: number;
	metadata?: Record<string, unknown>;
}

export interface UpdateArtifactRequest {
	title?: string;
	content?: string;
	status?: ArtifactStatus;
	sort_order?: number;
	metadata?: Record<string, unknown>;
}

export type ArtifactResponse = Artifact;
export type ArtifactListResponse = Artifact[];

// =============================================================================
// CONVERSATIONS (extended for briefing)
// =============================================================================

export interface CreateConversationRequest {
	project_id: string;
	artifact_id?: string;
	title?: string;
	context_type?: string;
}

// =============================================================================
// BRIEFING
// =============================================================================

export interface BriefingStartRequest {
	project_id: string;
}

export interface BriefingMessageRequest {
	project_id: string;
	conversation_id: string;
	message: string;
}

export interface BriefingResponse {
	message_id: string;
	content: string;
	conversation_id: string;
	briefing_complete: boolean;
	artifacts_generated: number;
}

// =============================================================================
// DOCUMENTS (assembled from artifacts) — Sprint 2
// =============================================================================

export interface AssembleDocumentRequest {
	document_type_id: string;
}

export interface AssembledDocument {
	document_type: DocumentType;
	artifacts: Artifact[];
	assembled_content: string;
}

// =============================================================================
// EXPORT — Sprint 2
// =============================================================================

export type ExportFormat = 'docx' | 'pdf';

export interface ExportRequest {
	document_type_id: string;
	format: ExportFormat;
}

// =============================================================================
// REGENERATE SECTION — Sprint 2
// =============================================================================

export interface RegenerateSectionRequest {
	artifact_id: string;
	instructions?: string;
}

export interface RegenerateSectionResponse {
	artifact: Artifact;
	previous_version: number;
}

// =============================================================================
// PROJECT MEMBER ROLES — Sprint 3
// =============================================================================

export interface UpdateProjectMemberRolesRequest {
	roles: ProjectRole[];
}

export interface RemoveProjectMemberRequest {
	project_member_id: string;
}

// =============================================================================
// SECTION REVIEWERS — Sprint 3
// =============================================================================

export interface InviteReviewerRequest {
	artifact_id: string;
	email: string;
	name: string;
}

export interface UpdateReviewRequest {
	review_status: 'approved' | 'rejected';
	feedback?: string;
}

export interface ReviewerResponse {
	id: string;
	artifact_id: string;
	email: string;
	name: string;
	review_status: string;
	feedback: string | null;
	reviewed_at: string | null;
	expires_at: string;
	created_at: string;
}

export interface MagicLinkReviewData {
	reviewer: ReviewerResponse;
	artifact: Artifact;
	project: { id: string; name: string };
}

// =============================================================================
// AUDIT LOG — Sprint 3
// =============================================================================

export interface AuditLogQuery {
	page?: number;
	per_page?: number;
	action?: string;
	entity_type?: string;
	actor_id?: string;
}

export interface AuditLogResponse {
	entries: AuditLogEntry[];
	total: number;
	page: number;
	per_page: number;
}

// =============================================================================
// CONTEXT SEARCH — Sprint 2
// =============================================================================

export interface ContextSearchRequest {
	query: string;
	project_id?: string;
	limit?: number;
}

export interface ContextSearchResult {
	source: 'document' | 'tenderned';
	id: string;
	title: string;
	snippet: string;
	relevance: number;
}
