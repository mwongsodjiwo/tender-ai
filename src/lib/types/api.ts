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
	Document,
	DocumentType,
	TenderNedItem,
	AuditLogEntry,
	ProjectProfile,
	PhaseActivity,
	Correspondence,
	Evaluation,
	KnowledgeBaseTender,
	KnowledgeBaseRequirement,
	TimeEntry,
	TimeEntryWithProject
} from './database.js';
import type {
	OrganizationRole,
	ProcedureType,
	ProjectRole,
	ArtifactStatus,
	DocumentCategory,
	ProjectPhase,
	ActivityStatus,
	CorrespondenceStatus,
	EvaluationStatus,
	TimeEntryActivityType
} from './enums.js';

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
	first_name: string;
	last_name: string;
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
	first_name?: string;
	last_name?: string;
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
	organization_id?: string;
	limit?: number;
}

export interface ContextSearchResult {
	source: 'document' | 'tenderned';
	id: string;
	title: string;
	snippet: string;
	relevance: number;
}

// =============================================================================
// DOCUMENT UPLOAD — Sprint 4
// =============================================================================

export interface UploadDocumentRequest {
	organization_id: string;
	project_id?: string;
	category: DocumentCategory;
	name?: string;
}

export type DocumentResponse = Document;
export type DocumentListResponse = Document[];

export interface DeleteDocumentRequest {
	document_id: string;
}

// =============================================================================
// TENDERNED SEARCH — Sprint 4
// =============================================================================

export interface TenderNedSearchRequest {
	query: string;
	procedure_type?: ProcedureType;
	cpv_code?: string;
	limit?: number;
	offset?: number;
}

export interface TenderNedSearchResponse {
	items: TenderNedItem[];
	total: number;
}

// =============================================================================
// EMBEDDING STATUS — Sprint 4
// =============================================================================

export interface EmbeddingStatusResponse {
	document_id: string;
	total_chunks: number;
	embedded_chunks: number;
	status: 'pending' | 'processing' | 'complete' | 'error';
}

// =============================================================================
// PROJECT PROFILE — Sprint R2 (Projectprofiel)
// =============================================================================

export interface CreateProjectProfileRequest {
	contracting_authority?: string;
	department?: string;
	contact_name?: string;
	contact_email?: string;
	contact_phone?: string;
	project_goal?: string;
	scope_description?: string;
	estimated_value?: number;
	currency?: string;
	cpv_codes?: string[];
	nuts_codes?: string[];
	timeline_start?: string;
	timeline_end?: string;
}

export interface UpdateProjectProfileRequest {
	contracting_authority?: string;
	department?: string;
	contact_name?: string;
	contact_email?: string;
	contact_phone?: string;
	project_goal?: string;
	scope_description?: string;
	estimated_value?: number;
	currency?: string;
	cpv_codes?: string[];
	nuts_codes?: string[];
	timeline_start?: string;
	timeline_end?: string;
}

export type ProjectProfileResponse = ProjectProfile;

// =============================================================================
// PHASE ACTIVITIES — Sprint R2 (Fase-activiteiten)
// =============================================================================

export interface CreatePhaseActivityRequest {
	phase: ProjectPhase;
	activity_type: string;
	title: string;
	description?: string;
	status?: ActivityStatus;
	sort_order?: number;
	assigned_to?: string;
	due_date?: string;
}

export interface UpdatePhaseActivityRequest {
	title?: string;
	description?: string;
	status?: ActivityStatus;
	sort_order?: number;
	assigned_to?: string;
	due_date?: string;
}

export type PhaseActivityResponse = PhaseActivity;
export type PhaseActivityListResponse = PhaseActivity[];

// =============================================================================
// CORRESPONDENCE — Sprint R2 (Brieven)
// =============================================================================

export interface CreateCorrespondenceRequest {
	phase: ProjectPhase;
	letter_type: string;
	recipient?: string;
	subject?: string;
	body?: string;
	status?: CorrespondenceStatus;
}

export interface UpdateCorrespondenceRequest {
	letter_type?: string;
	recipient?: string;
	subject?: string;
	body?: string;
	status?: CorrespondenceStatus;
	sent_at?: string;
}

export type CorrespondenceResponse = Correspondence;
export type CorrespondenceListResponse = Correspondence[];

// =============================================================================
// EVALUATIONS — Sprint R2 (Beoordelingen)
// =============================================================================

export interface CreateEvaluationRequest {
	tenderer_name: string;
	scores?: Record<string, unknown>;
	total_score?: number;
	ranking?: number;
	status?: EvaluationStatus;
	notes?: string;
}

export interface UpdateEvaluationRequest {
	tenderer_name?: string;
	scores?: Record<string, unknown>;
	total_score?: number;
	ranking?: number;
	status?: EvaluationStatus;
	notes?: string;
}

export type EvaluationResponse = Evaluation;
export type EvaluationListResponse = Evaluation[];

// =============================================================================
// KNOWLEDGE BASE SEARCH — Sprint R2 (Kennisbank zoeken)
// =============================================================================

export interface KnowledgeBaseSearchRequest {
	query: string;
	cpv_codes?: string[];
	limit?: number;
}

export interface KnowledgeBaseSearchResult {
	tender: KnowledgeBaseTender;
	requirement: KnowledgeBaseRequirement;
	snippet: string;
	relevance: number;
}

export interface KnowledgeBaseSearchResponse {
	results: KnowledgeBaseSearchResult[];
	total: number;
}

// =============================================================================
// MARKET RESEARCH — Sprint R5 (Marktverkenning)
// =============================================================================

export interface DeskresearchRequest {
	project_id: string;
	query?: string;
	cpv_codes?: string[];
	limit?: number;
}

export interface DeskresearchResult {
	id: string;
	title: string;
	contracting_authority: string | null;
	cpv_codes: string[];
	estimated_value: number | null;
	currency: string | null;
	publication_date: string | null;
	snippet: string;
	relevance: number;
}

export interface DeskresearchResponse {
	results: DeskresearchResult[];
	total: number;
	ai_summary?: string;
}

export interface GenerateRfiRequest {
	project_id: string;
	additional_context?: string;
}

export interface GenerateRfiResponse {
	content: string;
	questions: string[];
}

export interface GenerateMarketReportRequest {
	project_id: string;
	additional_context?: string;
}

export interface GenerateMarketReportResponse {
	content: string;
}

export interface SaveMarketResearchRequest {
	activity_type: string;
	content: string;
	metadata?: Record<string, unknown>;
}

// =============================================================================
// PROJECT OVERVIEW — Sprint R4 (Project-overzicht & projectprofiel)
// =============================================================================

export interface ProjectOverviewMetrics {
	total_sections: number;
	approved_sections: number;
	progress_percentage: number;
}

export interface ProjectOverviewDocumentBlock {
	doc_type_id: string;
	doc_type_name: string;
	doc_type_slug: string;
	total: number;
	approved: number;
	progress: number;
}

export interface ProjectOverviewActivity {
	id: string;
	phase: ProjectPhase;
	title: string;
	status: ActivityStatus;
	href: string | null;
}

export interface ConfirmProjectProfileResponse {
	profile_confirmed: boolean;
	profile_confirmed_at: string;
}

// =============================================================================
// DASHBOARD — Sprint R3 (Organisatie-dashboard)
// =============================================================================

export interface MonthlyProjectData {
	month: string;
	label: string;
	started: number;
	completed: number;
}

// =============================================================================
// DOCUMENT COMMENTS
// =============================================================================

export interface CreateDocumentCommentRequest {
	artifact_id: string;
	selected_text: string;
	comment_text: string;
}

export interface UpdateDocumentCommentRequest {
	comment_text?: string;
	resolved?: boolean;
}

// =============================================================================
// DASHBOARD
// =============================================================================

export interface DashboardRecentProject {
	id: string;
	name: string;
	current_phase: ProjectPhase;
	deadline_date: string | null;
	progress: number;
	updated_at: string;
}

export interface DashboardMetrics {
	total_projects: number;
	active_projects: number;
	completed_projects: number;
	in_review_count: number;
	in_review_trend: number;
	average_progress: number;
	sections_by_status: Record<string, number>;
	total_sections: number;
}

export interface DashboardResponse {
	metrics: DashboardMetrics;
	recent_projects: DashboardRecentProject[];
	upcoming_deadlines: DashboardRecentProject[];
	monthly_data: MonthlyProjectData[];
}

// =============================================================================
// TIME ENTRIES — Urenregistratie module
// =============================================================================

export interface CreateTimeEntryRequest {
	project_id: string;
	date: string;
	hours: number;
	activity_type: TimeEntryActivityType;
	notes?: string;
}

export interface UpdateTimeEntryRequest {
	project_id?: string;
	date?: string;
	hours?: number;
	activity_type?: TimeEntryActivityType;
	notes?: string;
}

export interface TimeEntryQuery {
	week?: string;
	from?: string;
	to?: string;
	project_id?: string;
}

export type TimeEntryResponse = TimeEntry;
export type TimeEntryListResponse = TimeEntryWithProject[];

export interface TimeEntryWeekSummary {
	entries: TimeEntryWithProject[];
	week_total: number;
	day_totals: Record<string, number>;
}

export interface TimeEntryReportData {
	entries: TimeEntryWithProject[];
	total_hours: number;
	by_project: { project_id: string; project_name: string; hours: number; percentage: number }[];
	by_activity: { activity_type: TimeEntryActivityType; label: string; hours: number; percentage: number }[];
	by_week: { week: string; label: string; hours: number }[];
}

// =============================================================================
// DEADLINE TRACKER — Planning Sprint 2
// =============================================================================

export interface DeadlineItem {
	id: string;
	type: 'milestone' | 'activity';
	title: string;
	date: string;
	project_id: string;
	project_name: string;
	phase: ProjectPhase;
	status: ActivityStatus;
	is_critical: boolean;
	assigned_to: string | null;
	assigned_to_name: string | null;
	days_remaining: number;
	is_overdue: boolean;
}

export interface DeadlineSummary {
	total: number;
	overdue: number;
	this_week: number;
	critical: number;
}

export interface DeadlineResponse {
	items: DeadlineItem[];
	summary: DeadlineSummary;
}
