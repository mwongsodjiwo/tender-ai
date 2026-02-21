import { z } from 'zod';

// =============================================================================
// ARCHIVE — Fase 39 (Archive/Unarchive endpoints)
// =============================================================================

export const archiveDocumentParamsSchema = z.object({
	id: z.string().uuid('Ongeldig project-ID'),
	docTypeId: z.string().uuid('Ongeldig document type-ID')
});

export const archiveCorrespondenceParamsSchema = z.object({
	id: z.string().uuid('Ongeldig project-ID'),
	letterId: z.string().uuid('Ongeldig correspondentie-ID')
});
