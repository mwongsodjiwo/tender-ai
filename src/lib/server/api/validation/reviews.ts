import { z } from 'zod';
import { PROJECT_ROLES, AUDIT_ACTIONS } from '$types';

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
