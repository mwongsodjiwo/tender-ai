// Zod validation schemas for API endpoints

import { z } from 'zod';
import { ORGANIZATION_ROLES, PROCEDURE_TYPES, PROJECT_ROLES, PROJECT_STATUSES, ARTIFACT_STATUSES, REVIEW_STATUSES, AUDIT_ACTIONS, DOCUMENT_CATEGORIES, REQUIREMENT_TYPES, REQUIREMENT_CATEGORIES, SCORING_METHODOLOGIES, CRITERION_TYPES, CONTRACT_TYPES, GENERAL_CONDITIONS_TYPES, UEA_PARTS } from '$types';

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
		errorMap: () => ({ message: 'Type moet knock-out, gunningscriterium of wens zijn' })
	}),
	category: z.enum(REQUIREMENT_CATEGORIES, {
		errorMap: () => ({ message: 'Ongeldige categorie' })
	}),
	weight_percentage: z.number().min(0).max(100).optional().default(0),
	priority: z.number().int().min(1).max(5).optional().default(3),
	sort_order: z.number().int().min(0).optional()
});

export const updateRequirementSchema = z.object({
	title: z.string().min(1).max(500).optional(),
	description: z.string().max(5000).optional(),
	requirement_type: z.enum(REQUIREMENT_TYPES).optional(),
	category: z.enum(REQUIREMENT_CATEGORIES).optional(),
	weight_percentage: z.number().min(0).max(100).optional(),
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
