import { z } from 'zod';
import { PROJECT_PHASES, ACTIVITY_STATUSES, CORRESPONDENCE_STATUSES } from '$types';

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
