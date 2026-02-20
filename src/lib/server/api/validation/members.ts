import { z } from 'zod';
import { MEMBER_STATUSES } from '$types';

// =============================================================================
// MEMBER SEARCH & FILTER (GET query params)
// =============================================================================

export const memberSearchSchema = z.object({
	search: z.string().max(200).optional(),
	status: z.enum([...MEMBER_STATUSES, 'all'] as const).default('all'),
	limit: z.coerce.number().int().min(1).max(100).default(25),
	offset: z.coerce.number().int().min(0).default(0)
});

export type MemberSearchParams = z.infer<typeof memberSearchSchema>;

// =============================================================================
// MEMBER UPDATE (PATCH body)
// =============================================================================

export const updateMemberSchema = z.object({
	status: z.enum(MEMBER_STATUSES).optional(),
	manager_id: z.string().uuid('Ongeldige manager-ID').nullable().optional()
});

export type UpdateMemberBody = z.infer<typeof updateMemberSchema>;
