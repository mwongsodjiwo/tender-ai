// Database row types — exactly matching Supabase schema

import type {
	OrganizationRole,
	ProjectStatus,
	ProjectPhase,
	ProjectRole,
	ArtifactStatus,
	MessageRole,
	DocumentCategory,
	ProcedureType,
	ReviewStatus,
	AuditAction,
	RequirementType,
	RequirementCategory,
	ScoringMethodology,
	CriterionType,
	ContractType,
	GeneralConditionsType,
	UeaPart,
	ActivityStatus,
	CorrespondenceStatus,
	EvaluationStatus,
	TimeEntryActivityType,
	MilestoneType,
	DependencyType
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
	first_name: string;
	last_name: string;
	avatar_url: string | null;
	job_title: string | null;
	phone: string | null;
	is_superadmin: boolean;
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
	current_phase: ProjectPhase;
	procedure_type: ProcedureType | null;
	estimated_value: number | null;
	currency: string;
	publication_date: string | null;
	deadline_date: string | null;
	briefing_data: Record<string, unknown>;
	scoring_methodology: ScoringMethodology | null;
	contract_type: ContractType | null;
	general_conditions: GeneralConditionsType | null;
	profile_confirmed: boolean;
	profile_confirmed_at: string | null;
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
// REQUIREMENTS — Sprint R5 (PvE eisenmanager)
// =============================================================================

export interface Requirement {
	id: string;
	project_id: string;
	document_type_id: string;
	requirement_number: string;
	title: string;
	description: string;
	requirement_type: RequirementType;
	category: RequirementCategory;
	weight_percentage: number;
	priority: number;
	sort_order: number;
	metadata: Record<string, unknown>;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// EMVI CRITERIA — Sprint R6 (wegingstool)
// =============================================================================

export interface EmviCriterion {
	id: string;
	project_id: string;
	name: string;
	description: string;
	criterion_type: CriterionType;
	weight_percentage: number;
	sort_order: number;
	metadata: Record<string, unknown>;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// CONTRACT STANDARD TEXTS — Sprint R7 (Conceptovereenkomst wizard)
// =============================================================================

export interface ContractStandardText {
	id: string;
	section_key: string;
	general_conditions: GeneralConditionsType;
	title: string;
	content: string;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// =============================================================================
// UEA — Sprint R8 (Uniform Europees Aanbestedingsdocument)
// =============================================================================

export interface UeaSection {
	id: string;
	part_number: UeaPart;
	part_title: string;
	section_key: string;
	section_title: string;
	description: string;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface UeaQuestion {
	id: string;
	section_id: string;
	question_number: string;
	title: string;
	description: string;
	is_mandatory: boolean;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface UeaProjectSelection {
	id: string;
	project_id: string;
	question_id: string;
	is_selected: boolean;
	created_at: string;
	updated_at: string;
}

export interface UeaQuestionWithSelection extends UeaQuestion {
	is_selected: boolean;
}

export interface UeaSectionWithQuestions extends UeaSection {
	questions: UeaQuestionWithSelection[];
}

// =============================================================================
// DOCUMENT CHUNKS — Sprint 4 (for RAG pipeline)
// =============================================================================

export interface DocumentChunk {
	id: string;
	document_id: string;
	chunk_index: number;
	content: string;
	token_count: number | null;
	metadata: Record<string, unknown>;
	created_at: string;
}

export interface TenderNedChunk {
	id: string;
	tenderned_item_id: string;
	chunk_index: number;
	content: string;
	token_count: number | null;
	metadata: Record<string, unknown>;
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

export interface DocumentWithChunks extends Document {
	chunks: DocumentChunk[];
}

export interface TenderNedItemWithChunks extends TenderNedItem {
	chunks: TenderNedChunk[];
}

// =============================================================================
// PROJECT PROFILES — Sprint R2 (Projectprofiel)
// =============================================================================

export interface ProjectProfile {
	id: string;
	project_id: string;
	contracting_authority: string;
	department: string;
	contact_name: string;
	contact_email: string;
	contact_phone: string;
	project_goal: string;
	scope_description: string;
	estimated_value: number | null;
	currency: string;
	cpv_codes: string[];
	nuts_codes: string[];
	timeline_start: string | null;
	timeline_end: string | null;
	planning_generated_at: string | null;
	planning_approved: boolean;
	planning_approved_at: string | null;
	planning_approved_by: string | null;
	planning_metadata: Record<string, unknown>;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// PHASE ACTIVITIES — Sprint R2 (Fase-activiteiten)
// =============================================================================

export interface PhaseActivity {
	id: string;
	project_id: string;
	phase: ProjectPhase;
	activity_type: string;
	title: string;
	description: string;
	status: ActivityStatus;
	sort_order: number;
	assigned_to: string | null;
	due_date: string | null;
	completed_at: string | null;
	planned_start: string | null;
	planned_end: string | null;
	actual_start: string | null;
	actual_end: string | null;
	estimated_hours: number | null;
	progress_percentage: number;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// CORRESPONDENCE — Sprint R2 (Brieven)
// =============================================================================

export interface Correspondence {
	id: string;
	project_id: string;
	phase: ProjectPhase;
	letter_type: string;
	recipient: string;
	subject: string;
	body: string;
	status: CorrespondenceStatus;
	sent_at: string | null;
	metadata: Record<string, unknown>;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// EVALUATIONS — Sprint R2 (Beoordelingen)
// =============================================================================

export interface Evaluation {
	id: string;
	project_id: string;
	tenderer_name: string;
	scores: Record<string, unknown>;
	total_score: number;
	ranking: number | null;
	status: EvaluationStatus;
	notes: string;
	metadata: Record<string, unknown>;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// KNOWLEDGE BASE — Sprint R2 (Kennisbank)
// =============================================================================

export interface KnowledgeBaseTender {
	id: string;
	external_id: string;
	title: string;
	description: string | null;
	contracting_authority: string | null;
	procedure_type: string | null;
	estimated_value: number | null;
	currency: string | null;
	publication_date: string | null;
	deadline_date: string | null;
	cpv_codes: string[];
	nuts_codes: string[];
	source_url: string | null;
	raw_data: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface KnowledgeBaseRequirement {
	id: string;
	tender_id: string;
	requirement_text: string;
	category: string | null;
	source_section: string | null;
	metadata: Record<string, unknown>;
	created_at: string;
}

// =============================================================================
// DOCUMENT COMMENTS
// =============================================================================

export interface DocumentComment {
	id: string;
	project_id: string;
	artifact_id: string;
	selected_text: string;
	comment_text: string;
	resolved: boolean;
	resolved_at: string | null;
	resolved_by: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface DocumentCommentWithAuthor extends DocumentComment {
	author: {
		first_name: string;
		last_name: string;
		email: string;
	};
}

// =============================================================================
// TIME ENTRIES — Urenregistratie module
// =============================================================================

export interface TimeEntry {
	id: string;
	user_id: string;
	organization_id: string;
	project_id: string;
	date: string;
	hours: number;
	activity_type: TimeEntryActivityType;
	notes: string;
	created_at: string;
	updated_at: string;
}

export interface TimeEntryWithProject extends TimeEntry {
	project: {
		id: string;
		name: string;
	};
}

// =============================================================================
// KNOWLEDGE BASE
// =============================================================================

export interface RequirementChunk {
	id: string;
	requirement_id: string;
	chunk_index: number;
	content: string;
	token_count: number | null;
	metadata: Record<string, unknown>;
	created_at: string;
}

export interface HarvestLog {
	id: string;
	source: string;
	started_at: string;
	finished_at: string | null;
	records_fetched: number;
	records_inserted: number;
	records_updated: number;
	errors: unknown[];
	metadata: Record<string, unknown>;
	created_at: string;
}

// =============================================================================
// MILESTONES — Planning Sprint 1
// =============================================================================

export interface Milestone {
	id: string;
	project_id: string;
	milestone_type: MilestoneType;
	title: string;
	description: string;
	target_date: string;
	actual_date: string | null;
	phase: ProjectPhase | null;
	is_critical: boolean;
	status: ActivityStatus;
	sort_order: number;
	metadata: Record<string, unknown>;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// ACTIVITY DEPENDENCIES — Planning Sprint 1
// =============================================================================

export interface ActivityDependency {
	id: string;
	project_id: string;
	source_type: 'activity' | 'milestone';
	source_id: string;
	target_type: 'activity' | 'milestone';
	target_id: string;
	dependency_type: DependencyType;
	lag_days: number;
	created_at: string;
	updated_at: string;
}
