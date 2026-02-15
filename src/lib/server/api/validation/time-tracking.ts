import { z } from 'zod';
import { TIME_ENTRY_ACTIVITY_TYPES } from '$types';

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
