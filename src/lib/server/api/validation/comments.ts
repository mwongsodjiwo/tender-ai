import { z } from 'zod';

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
