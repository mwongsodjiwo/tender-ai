import { z } from 'zod';

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
