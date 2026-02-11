// Zod validation schemas for API endpoints

import { z } from 'zod';
import { ORGANIZATION_ROLES, PROCEDURE_TYPES, PROJECT_ROLES, PROJECT_STATUSES, ARTIFACT_STATUSES, REVIEW_STATUSES, AUDIT_ACTIONS, DOCUMENT_CATEGORIES, REQUIREMENT_TYPES, REQUIREMENT_CATEGORIES, SCORING_METHODOLOGIES, CRITERION_TYPES, CONTRACT_TYPES, GENERAL_CONDITIONS_TYPES, UEA_PARTS, PROJECT_PHASES, ACTIVITY_STATUSES, CORRESPONDENCE_STATUSES, EVALUATION_STATUSES, MARKET_RESEARCH_ACTIVITY_TYPES, TIME_ENTRY_ACTIVITY_TYPES, MILESTONE_TYPES, DEPENDENCY_TYPES } from '$types';

// =============================================================================
// AUTH
// =============================================================================

export const loginSchema = z.object({
	email: z.string().email('Ongeldig e-mailadres'),
	password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens bevatten')
});

export const registerSchema = z.object({
	email: z.string().email('Ongeldig e-mailadres'),
	password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens bevatten'),
	first_name: z.string().min(1, 'Voornaam is verplicht').max(50),
	last_name: z.string().min(1, 'Achternaam is verplicht').max(50)
});

// =============================================================================
// ORGANIZATIONS
// =============================================================================

export const createOrganizationSchema = z.object({
	name: z.string().min(2, 'Naam moet minimaal 2 tekens bevatten').max(200),
	slug: z
		.string()
		.min(2)
		.max(100)
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			'Slug mag alleen kleine letters, cijfers en koppeltekens bevatten'
		),
	description: z.string().max(1000).optional()
});

export const updateOrganizationSchema = z.object({
	name: z.string().min(2).max(200).optional(),
	description: z.string().max(1000).optional(),
	logo_url: z.string().url().optional()
});

export const inviteMemberSchema = z.object({
	email: z.string().email('Ongeldig e-mailadres'),
	role: z.enum(ORGANIZATION_ROLES)
});

// =============================================================================
// ADMIN — member management (superadmin only)
// =============================================================================

export const adminAddMemberSchema = z.object({
	email: z.string().email('Ongeldig e-mailadres'),
	role: z.enum(ORGANIZATION_ROLES)
});

export const adminUpdateMemberRoleSchema = z.object({
	role: z.enum(ORGANIZATION_ROLES)
});

// =============================================================================
// PROFILES
// =============================================================================

export const updateProfileSchema = z.object({
	first_name: z.string().min(1).max(50).optional(),
	last_name: z.string().min(1).max(50).optional(),
	job_title: z.string().max(100).optional(),
	phone: z.string().max(20).optional(),
	avatar_url: z.string().url().optional()
});

// =============================================================================
// CHAT
// =============================================================================

export const chatMessageSchema = z.object({
	conversation_id: z.string().uuid('Ongeldig gesprek-ID'),
	message: z.string().min(1, 'Bericht mag niet leeg zijn').max(10000)
});

// =============================================================================
// PROJECTS
// =============================================================================

export const createProjectSchema = z.object({
	organization_id: z.string().uuid('Ongeldig organisatie-ID'),
	name: z.string().min(2, 'Naam moet minimaal 2 tekens bevatten').max(200),
	description: z.string().max(2000).optional(),
	procedure_type: z.enum(PROCEDURE_TYPES).optional(),
	estimated_value: z.number().positive('Waarde moet positief zijn').optional(),
	publication_date: z.string().optional(),
	deadline_date: z.string().optional()
});

export const updateProjectSchema = z.object({
	name: z.string().min(2).max(200).optional(),
	description: z.string().max(2000).optional(),
	status: z.enum(PROJECT_STATUSES).optional(),
	procedure_type: z.enum(PROCEDURE_TYPES).optional(),
	estimated_value: z.number().positive().optional(),
	publication_date: z.string().optional(),
	deadline_date: z.string().optional(),
	briefing_data: z.record(z.unknown()).optional()
});

// =============================================================================
// PROJECT MEMBERS
// =============================================================================

export const addProjectMemberSchema = z.object({
	profile_id: z.string().uuid('Ongeldig profiel-ID'),
	roles: z.array(z.enum(PROJECT_ROLES)).min(1, 'Minimaal één rol vereist')
});

// =============================================================================
// ARTIFACTS
// =============================================================================

export const createArtifactSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID'),
	section_key: z.string().min(1).max(100),
	title: z.string().min(1, 'Titel is verplicht').max(300),
	content: z.string().optional().default(''),
	sort_order: z.number().int().min(0).optional().default(0),
	metadata: z.record(z.unknown()).optional().default({})
});

export const updateArtifactSchema = z.object({
	title: z.string().min(1).max(300).optional(),
	content: z.string().optional(),
	status: z.enum(ARTIFACT_STATUSES).optional(),
	sort_order: z.number().int().min(0).optional(),
	metadata: z.record(z.unknown()).optional()
});

// =============================================================================
// CONVERSATIONS
// =============================================================================

export const createConversationSchema = z.object({
	project_id: z.string().uuid('Ongeldig project-ID'),
	artifact_id: z.string().uuid('Ongeldig artifact-ID').optional(),
	title: z.string().max(200).optional(),
	context_type: z.string().max(50).optional().default('general')
});

// =============================================================================
// BRIEFING
// =============================================================================

export const briefingStartSchema = z.object({
	project_id: z.string().uuid('Ongeldig project-ID')
});

export const briefingMessageSchema = z.object({
	project_id: z.string().uuid('Ongeldig project-ID'),
	conversation_id: z.string().uuid('Ongeldig gesprek-ID'),
	message: z.string().min(1, 'Bericht mag niet leeg zijn').max(10000)
});

// =============================================================================
// DOCUMENT ASSEMBLY — Sprint 2
// =============================================================================

export const assembleDocumentSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID')
});

// =============================================================================
// EXPORT — Sprint 2
// =============================================================================

export const exportDocumentSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID'),
	format: z.enum(['docx', 'pdf'], { errorMap: () => ({ message: 'Formaat moet docx of pdf zijn' }) })
});

// =============================================================================
// REGENERATE — Sprint 2
// =============================================================================

export const regenerateSectionSchema = z.object({
	artifact_id: z.string().uuid('Ongeldig artifact-ID'),
	instructions: z.string().max(2000).optional()
});

// =============================================================================
// CONTEXT SEARCH — Sprint 2
// =============================================================================

export const contextSearchSchema = z.object({
	query: z.string().min(2, 'Zoekterm moet minimaal 2 tekens bevatten').max(500),
	project_id: z.string().uuid().optional(),
	organization_id: z.string().uuid().optional(),
	limit: z.number().int().min(1).max(20).optional().default(5)
});

// =============================================================================
// SECTION CHAT — Sprint 2
// =============================================================================

export const sectionChatSchema = z.object({
	artifact_id: z.string().uuid('Ongeldig artifact-ID'),
	conversation_id: z.string().uuid('Ongeldig gesprek-ID').optional(),
	message: z.string().min(1, 'Bericht mag niet leeg zijn').max(10000)
});

// =============================================================================
// PROJECT MEMBER ROLES — Sprint 3
// =============================================================================

export const updateProjectMemberRolesSchema = z.object({
	roles: z.array(z.enum(PROJECT_ROLES)).min(1, 'Minimaal één rol vereist')
});

// =============================================================================
// SECTION REVIEWERS — Sprint 3
// =============================================================================

export const inviteReviewerSchema = z.object({
	artifact_id: z.string().uuid('Ongeldig artifact-ID'),
	email: z.string().email('Ongeldig e-mailadres'),
	name: z.string().min(2, 'Naam moet minimaal 2 tekens bevatten').max(100)
});

export const updateReviewSchema = z.object({
	review_status: z.enum(['approved', 'rejected'] as const, {
		errorMap: () => ({ message: 'Status moet goedgekeurd of afgewezen zijn' })
	}),
	feedback: z.string().max(5000).optional()
});

// =============================================================================
// REVIEW CHAT — Sprint 3
// =============================================================================

export const reviewChatSchema = z.object({
	token: z.string().min(1, 'Token is verplicht'),
	conversation_id: z.string().uuid('Ongeldig gesprek-ID').optional(),
	message: z.string().min(1, 'Bericht mag niet leeg zijn').max(10000)
});

// =============================================================================
// AUDIT LOG QUERY — Sprint 3
// =============================================================================

export const auditLogQuerySchema = z.object({
	page: z.coerce.number().int().min(1).optional().default(1),
	per_page: z.coerce.number().int().min(1).max(100).optional().default(25),
	action: z.enum(AUDIT_ACTIONS).optional(),
	entity_type: z.string().max(50).optional(),
	actor_id: z.string().uuid().optional()
});

// =============================================================================
// DOCUMENT UPLOAD — Sprint 4
// =============================================================================

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'text/plain',
	'text/csv'
] as const;

export const uploadDocumentSchema = z.object({
	organization_id: z.string().uuid('Ongeldig organisatie-ID'),
	project_id: z.string().uuid('Ongeldig project-ID').optional(),
	category: z.enum(DOCUMENT_CATEGORIES, {
		errorMap: () => ({ message: 'Ongeldige documentcategorie' })
	}),
	name: z.string().min(1).max(300).optional()
});

export const uploadFileValidation = z.object({
	size: z.number().max(MAX_FILE_SIZE, 'Bestand mag maximaal 50 MB zijn'),
	type: z.enum(ALLOWED_MIME_TYPES, {
		errorMap: () => ({ message: 'Bestandstype niet toegestaan. Toegestaan: PDF, Word, Excel, tekst, CSV' })
	})
});

// =============================================================================
// TENDERNED SEARCH — Sprint 4
// =============================================================================

export const tenderNedSearchSchema = z.object({
	query: z.string().min(2, 'Zoekterm moet minimaal 2 tekens bevatten').max(500),
	procedure_type: z.enum(PROCEDURE_TYPES).optional(),
	cpv_code: z.string().max(20).optional(),
	limit: z.coerce.number().int().min(1).max(50).optional().default(10),
	offset: z.coerce.number().int().min(0).optional().default(0)
});

// =============================================================================
// REQUIREMENTS — Sprint R5 (PvE eisenmanager)
// =============================================================================

export const createRequirementSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID'),
	title: z.string().min(1, 'Titel is verplicht').max(500),
	description: z.string().max(5000).optional().default(''),
	requirement_type: z.enum(REQUIREMENT_TYPES, {
		errorMap: () => ({ message: 'Type moet eis of wens zijn' })
	}),
	category: z.enum(REQUIREMENT_CATEGORIES, {
		errorMap: () => ({ message: 'Ongeldige categorie' })
	}),
	priority: z.number().int().min(1).max(5).optional().default(3),
	sort_order: z.number().int().min(0).optional()
});

export const updateRequirementSchema = z.object({
	title: z.string().min(1).max(500).optional(),
	description: z.string().max(5000).optional(),
	requirement_type: z.enum(REQUIREMENT_TYPES).optional(),
	category: z.enum(REQUIREMENT_CATEGORIES).optional(),
	priority: z.number().int().min(1).max(5).optional(),
	sort_order: z.number().int().min(0).optional()
});

export const reorderRequirementsSchema = z.object({
	ordered_ids: z.array(z.string().uuid('Ongeldig eis-ID')).min(1, 'Minimaal één eis vereist')
});

export const generateRequirementsSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID')
});

// =============================================================================
// EMVI CRITERIA — Sprint R6 (wegingstool)
// =============================================================================

export const updateScoringMethodologySchema = z.object({
	scoring_methodology: z.enum(SCORING_METHODOLOGIES, {
		errorMap: () => ({ message: 'Gunningssystematiek moet laagste prijs, EMVI of beste PKV zijn' })
	})
});

export const createEmviCriterionSchema = z.object({
	name: z.string().min(1, 'Naam is verplicht').max(300),
	description: z.string().max(5000).optional().default(''),
	criterion_type: z.enum(CRITERION_TYPES, {
		errorMap: () => ({ message: 'Type moet prijs of kwaliteit zijn' })
	}),
	weight_percentage: z.number().min(0, 'Weging mag niet negatief zijn').max(100, 'Weging mag niet hoger dan 100% zijn'),
	sort_order: z.number().int().min(0).optional()
});

export const updateEmviCriterionSchema = z.object({
	name: z.string().min(1).max(300).optional(),
	description: z.string().max(5000).optional(),
	criterion_type: z.enum(CRITERION_TYPES).optional(),
	weight_percentage: z.number().min(0).max(100).optional(),
	sort_order: z.number().int().min(0).optional()
});

// =============================================================================
// CONTRACT SETTINGS — Sprint R7 (Conceptovereenkomst wizard)
// =============================================================================

export const updateContractSettingsSchema = z.object({
	contract_type: z.enum(CONTRACT_TYPES, {
		errorMap: () => ({ message: 'Type opdracht moet diensten, leveringen of werken zijn' })
	}).nullable().optional(),
	general_conditions: z.enum(GENERAL_CONDITIONS_TYPES, {
		errorMap: () => ({ message: 'Ongeldige algemene voorwaarden' })
	}).nullable().optional()
});

export const generateContractArticleSchema = z.object({
	instructions: z.string().max(2000).optional()
});

// =============================================================================
// UEA — Sprint R8 (Uniform Europees Aanbestedingsdocument)
// =============================================================================

export const toggleUeaQuestionSchema = z.object({
	question_id: z.string().uuid('Ongeldig vraag-ID'),
	is_selected: z.boolean()
});

export const initializeUeaSelectionsSchema = z.object({
	select_all_optional: z.boolean().optional().default(false)
});

// =============================================================================
// PROJECT PROFILE — Sprint R2 (Projectprofiel)
// =============================================================================

export const createProjectProfileSchema = z.object({
	contracting_authority: z.string().max(500).optional().default(''),
	department: z.string().max(300).optional().default(''),
	contact_name: z.string().max(200).optional().default(''),
	contact_email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')).default(''),
	contact_phone: z.string().max(20).optional().default(''),
	project_goal: z.string().max(5000).optional().default(''),
	scope_description: z.string().max(10000).optional().default(''),
	estimated_value: z.number().positive('Waarde moet positief zijn').optional(),
	currency: z.string().max(3).optional().default('EUR'),
	cpv_codes: z.array(z.string().max(20)).optional().default([]),
	nuts_codes: z.array(z.string().max(20)).optional().default([]),
	timeline_start: z.string().optional(),
	timeline_end: z.string().optional()
});

export const updateProjectProfileSchema = z.object({
	contracting_authority: z.string().max(500).optional(),
	department: z.string().max(300).optional(),
	contact_name: z.string().max(200).optional(),
	contact_email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
	contact_phone: z.string().max(20).optional(),
	project_goal: z.string().max(5000).optional(),
	scope_description: z.string().max(10000).optional(),
	estimated_value: z.number().positive('Waarde moet positief zijn').optional(),
	currency: z.string().max(3).optional(),
	cpv_codes: z.array(z.string().max(20)).optional(),
	nuts_codes: z.array(z.string().max(20)).optional(),
	timeline_start: z.string().optional(),
	timeline_end: z.string().optional()
});

// =============================================================================
// CONFIRM PROJECT PROFILE — Sprint R4 (Projectprofiel bevestigen)
// =============================================================================

export const confirmProjectProfileSchema = z.object({
	confirmed: z.literal(true, {
		errorMap: () => ({ message: 'Bevestiging moet true zijn' })
	})
});

// =============================================================================
// PHASE ACTIVITIES — Sprint R2 (Fase-activiteiten)
// =============================================================================

export const createPhaseActivitySchema = z.object({
	phase: z.enum(PROJECT_PHASES, {
		errorMap: () => ({ message: 'Ongeldige projectfase' })
	}),
	activity_type: z.string().min(1, 'Activiteittype is verplicht').max(100),
	title: z.string().min(1, 'Titel is verplicht').max(300),
	description: z.string().max(5000).optional().default(''),
	status: z.enum(ACTIVITY_STATUSES, {
		errorMap: () => ({ message: 'Ongeldige status' })
	}).optional().default('not_started'),
	sort_order: z.number().int().min(0).optional().default(0),
	assigned_to: z.string().uuid('Ongeldig profiel-ID').optional(),
	due_date: z.string().optional()
});

export const updatePhaseActivitySchema = z.object({
	title: z.string().min(1).max(300).optional(),
	description: z.string().max(5000).optional(),
	status: z.enum(ACTIVITY_STATUSES, {
		errorMap: () => ({ message: 'Ongeldige status' })
	}).optional(),
	sort_order: z.number().int().min(0).optional(),
	assigned_to: z.string().uuid('Ongeldig profiel-ID').nullable().optional(),
	due_date: z.string().nullable().optional(),
	// Planning fields (Sprint 3 — Gantt chart drag-and-drop)
	planned_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet YYYY-MM-DD zijn').nullable().optional(),
	planned_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet YYYY-MM-DD zijn').nullable().optional(),
	actual_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet YYYY-MM-DD zijn').nullable().optional(),
	actual_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet YYYY-MM-DD zijn').nullable().optional(),
	estimated_hours: z.number().min(0).max(10000).nullable().optional(),
	progress_percentage: z.number().int().min(0).max(100).optional()
});

// =============================================================================
// CORRESPONDENCE — Sprint R2 (Brieven)
// =============================================================================

export const createCorrespondenceSchema = z.object({
	phase: z.enum(PROJECT_PHASES, {
		errorMap: () => ({ message: 'Ongeldige projectfase' })
	}),
	letter_type: z.string().min(1, 'Brieftype is verplicht').max(100),
	recipient: z.string().max(500).optional().default(''),
	subject: z.string().max(500).optional().default(''),
	body: z.string().max(50000).optional().default(''),
	status: z.enum(CORRESPONDENCE_STATUSES, {
		errorMap: () => ({ message: 'Ongeldige status' })
	}).optional().default('draft')
});

export const updateCorrespondenceSchema = z.object({
	letter_type: z.string().min(1).max(100).optional(),
	recipient: z.string().max(500).optional(),
	subject: z.string().max(500).optional(),
	body: z.string().max(50000).optional(),
	status: z.enum(CORRESPONDENCE_STATUSES, {
		errorMap: () => ({ message: 'Ongeldige status' })
	}).optional(),
	sent_at: z.string().optional()
});

// =============================================================================
// EVALUATIONS — Sprint R2 (Beoordelingen)
// =============================================================================

export const createEvaluationSchema = z.object({
	tenderer_name: z.string().min(1, 'Naam inschrijver is verplicht').max(300),
	scores: z.record(z.unknown()).optional().default({}),
	total_score: z.number().min(0).optional().default(0),
	ranking: z.number().int().min(1).optional(),
	status: z.enum(EVALUATION_STATUSES, {
		errorMap: () => ({ message: 'Ongeldige status' })
	}).optional().default('draft'),
	notes: z.string().max(10000).optional().default('')
});

export const updateEvaluationSchema = z.object({
	tenderer_name: z.string().min(1).max(300).optional(),
	scores: z.record(z.unknown()).optional(),
	total_score: z.number().min(0).optional(),
	ranking: z.number().int().min(1).nullable().optional(),
	status: z.enum(EVALUATION_STATUSES, {
		errorMap: () => ({ message: 'Ongeldige status' })
	}).optional(),
	notes: z.string().max(10000).optional()
});

export const batchScoreSchema = z.object({
	scores: z.array(z.object({
		evaluation_id: z.string().uuid('Ongeldig evaluation ID'),
		criterion_id: z.string().uuid('Ongeldig criterium ID'),
		score: z.number().min(0, 'Score moet minimaal 0 zijn').max(10, 'Score mag maximaal 10 zijn')
	})).min(1, 'Minimaal één score is verplicht').max(500, 'Maximaal 500 scores per batch')
});

export const calculateRankingSchema = z.object({
	evaluation_ids: z.array(z.string().uuid()).min(1).max(100).optional()
});

// =============================================================================
// KNOWLEDGE BASE SEARCH — Sprint R2 (Kennisbank zoeken)
// =============================================================================

export const knowledgeBaseSearchSchema = z.object({
	query: z.string().min(2, 'Zoekterm moet minimaal 2 tekens bevatten').max(500),
	cpv_codes: z.array(z.string().max(20)).optional().default([]),
	limit: z.number().int().min(1).max(50).optional().default(10)
});

// =============================================================================
// MARKET RESEARCH — Sprint R5 (Marktverkenning)
// =============================================================================

export const deskresearchSchema = z.object({
	query: z.string().max(500).optional(),
	cpv_codes: z.array(z.string().max(20)).optional(),
	limit: z.number().int().min(1).max(50).optional().default(10)
});

export const generateRfiSchema = z.object({
	additional_context: z.string().max(5000).optional()
});

export const generateMarketReportSchema = z.object({
	additional_context: z.string().max(5000).optional()
});

export const saveMarketResearchSchema = z.object({
	activity_type: z.enum(MARKET_RESEARCH_ACTIVITY_TYPES, {
		errorMap: () => ({ message: 'Ongeldig activiteittype voor marktverkenning' })
	}),
	content: z.string().min(1, 'Inhoud mag niet leeg zijn').max(100000),
	metadata: z.record(z.unknown()).optional().default({})
});

// =============================================================================
// LEIDRAAD SECTION GENERATION — Sprint R6 (Aanbestedingsleidraad wizard)
// =============================================================================

export const generateLeidraadSectionSchema = z.object({
	section_key: z.string().max(100).optional(),
	instructions: z.string().max(5000).optional()
});

// =============================================================================
// CORRESPONDENCE GENERATION — Sprint R11 (Brief-generatie)
// =============================================================================

export const generateLetterSchema = z.object({
	letter_type: z.string().min(1, 'Brieftype is verplicht').max(100),
	recipient: z.string().max(500).optional(),
	instructions: z.string().max(5000).optional(),
	evaluation_id: z.string().uuid('Ongeldig evaluatie-ID').optional()
});

// =============================================================================
// DOCUMENT COMMENTS — Sprint R6 (Document-editor opmerkingen)
// =============================================================================

export const createDocumentCommentSchema = z.object({
	artifact_id: z.string().uuid('Ongeldig artifact-ID'),
	selected_text: z.string().min(1, 'Geselecteerde tekst is verplicht').max(5000),
	comment_text: z.string().min(1, 'Opmerking is verplicht').max(5000)
});

export const updateDocumentCommentSchema = z.object({
	comment_text: z.string().min(1).max(5000).optional(),
	resolved: z.boolean().optional()
});

// =============================================================================
// TIME ENTRIES — Urenregistratie module
// =============================================================================

export const createTimeEntrySchema = z.object({
	project_id: z.string().uuid('Ongeldig project-ID'),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn'),
	hours: z.number()
		.positive('Uren moeten positief zijn')
		.max(24, 'Uren mogen niet meer dan 24 per dag zijn'),
	activity_type: z.enum(TIME_ENTRY_ACTIVITY_TYPES, {
		errorMap: () => ({ message: 'Ongeldig activiteittype' })
	}),
	notes: z.string().max(1000).optional().default('')
});

export const updateTimeEntrySchema = z.object({
	project_id: z.string().uuid('Ongeldig project-ID').optional(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn').optional(),
	hours: z.number()
		.positive('Uren moeten positief zijn')
		.max(24, 'Uren mogen niet meer dan 24 per dag zijn')
		.optional(),
	activity_type: z.enum(TIME_ENTRY_ACTIVITY_TYPES, {
		errorMap: () => ({ message: 'Ongeldig activiteittype' })
	}).optional(),
	notes: z.string().max(1000).optional()
});

export const timeEntryQuerySchema = z.object({
	week: z.string().regex(/^\d{4}-W\d{2}$/, 'Week moet in formaat YYYY-Wnn zijn').optional(),
	from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn').optional(),
	to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn').optional(),
	project_id: z.string().uuid('Ongeldig project-ID').optional()
});

// =============================================================================
// MILESTONES — Planning Sprint 1
// =============================================================================

export const createMilestoneSchema = z.object({
	milestone_type: z.enum(MILESTONE_TYPES, {
		errorMap: () => ({ message: 'Ongeldig milestonetype' })
	}),
	title: z.string().min(1, 'Titel is verplicht').max(300),
	description: z.string().max(2000).optional().default(''),
	target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn'),
	actual_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn').nullable().optional(),
	phase: z.enum(PROJECT_PHASES, {
		errorMap: () => ({ message: 'Ongeldige projectfase' })
	}).nullable().optional(),
	is_critical: z.boolean().optional().default(false),
	status: z.enum(ACTIVITY_STATUSES, {
		errorMap: () => ({ message: 'Ongeldige status' })
	}).optional().default('not_started'),
	sort_order: z.number().int().min(0).optional().default(0),
	metadata: z.record(z.unknown()).optional().default({})
});

export const updateMilestoneSchema = z.object({
	milestone_type: z.enum(MILESTONE_TYPES, {
		errorMap: () => ({ message: 'Ongeldig milestonetype' })
	}).optional(),
	title: z.string().min(1).max(300).optional(),
	description: z.string().max(2000).optional(),
	target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn').optional(),
	actual_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn').nullable().optional(),
	phase: z.enum(PROJECT_PHASES, {
		errorMap: () => ({ message: 'Ongeldige projectfase' })
	}).nullable().optional(),
	is_critical: z.boolean().optional(),
	status: z.enum(ACTIVITY_STATUSES, {
		errorMap: () => ({ message: 'Ongeldige status' })
	}).optional(),
	sort_order: z.number().int().min(0).optional(),
	metadata: z.record(z.unknown()).optional()
});

// =============================================================================
// ACTIVITY DEPENDENCIES — Planning Sprint 1
// =============================================================================

// =============================================================================
// AI PLANNING — Planning Sprint 4
// =============================================================================

export const generatePlanningSchema = z.object({
	target_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn').nullable().optional(),
	target_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn').nullable().optional(),
	preferences: z.object({
		buffer_days: z.number().int().min(0).max(30).optional().default(5),
		parallel_activities: z.boolean().optional().default(true),
		include_reviews: z.boolean().optional().default(true)
	}).optional().default({})
});

export const applyPlanningSchema = z.object({
	planning: z.object({
		phases: z.array(z.object({
			phase: z.string(),
			start_date: z.string(),
			end_date: z.string(),
			activities: z.array(z.object({
				title: z.string(),
				description: z.string(),
				activity_type: z.string(),
				planned_start: z.string(),
				planned_end: z.string(),
				estimated_hours: z.number(),
				assigned_role: z.string()
			})),
			milestones: z.array(z.object({
				milestone_type: z.string(),
				title: z.string(),
				target_date: z.string(),
				is_critical: z.boolean()
			}))
		})),
		dependencies: z.array(z.object({
			from_title: z.string(),
			to_title: z.string(),
			type: z.string(),
			lag_days: z.number()
		})),
		total_duration_days: z.number(),
		total_estimated_hours: z.number()
	}),
	clear_existing: z.boolean().optional().default(false)
});

export const createDependencySchema = z.object({
	source_type: z.enum(['activity', 'milestone'] as const, {
		errorMap: () => ({ message: 'Brontype moet activity of milestone zijn' })
	}),
	source_id: z.string().uuid('Ongeldig bron-ID'),
	target_type: z.enum(['activity', 'milestone'] as const, {
		errorMap: () => ({ message: 'Doeltype moet activity of milestone zijn' })
	}),
	target_id: z.string().uuid('Ongeldig doel-ID'),
	dependency_type: z.enum(DEPENDENCY_TYPES, {
		errorMap: () => ({ message: 'Ongeldig afhankelijkheidstype' })
	}).optional().default('finish_to_start'),
	lag_days: z.number().int().min(-365).max(365).optional().default(0)
});
