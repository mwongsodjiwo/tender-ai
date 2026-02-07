// Zod validation schemas for API endpoints

import { z } from 'zod';
import { ORGANIZATION_ROLES, PROCEDURE_TYPES, PROJECT_ROLES, PROJECT_STATUSES, ARTIFACT_STATUSES, REVIEW_STATUSES, AUDIT_ACTIONS } from '$types';

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
	full_name: z.string().min(2, 'Naam moet minimaal 2 tekens bevatten').max(100)
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
// PROFILES
// =============================================================================

export const updateProfileSchema = z.object({
	full_name: z.string().min(2).max(100).optional(),
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
