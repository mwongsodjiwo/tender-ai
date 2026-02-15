import { z } from 'zod';
import { MILESTONE_TYPES, PROJECT_PHASES, ACTIVITY_STATUSES, DEPENDENCY_TYPES } from '$types';

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

// =============================================================================
// TEAM WORKLOAD — Planning Sprint 7
// =============================================================================

export const workloadQuerySchema = z.object({
	from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn').optional(),
	to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum moet in formaat YYYY-MM-DD zijn').optional()
}).refine(
	(data) => {
		if (data.from && data.to) {
			return new Date(data.from) <= new Date(data.to);
		}
		return true;
	},
	{ message: 'Startdatum moet voor einddatum liggen' }
);

export const planningExportQuerySchema = z.object({
	phase: z.enum(PROJECT_PHASES).optional(),
	include_activities: z.coerce.boolean().optional().default(true),
	include_milestones: z.coerce.boolean().optional().default(true)
});
