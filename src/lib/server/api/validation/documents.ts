import { z } from 'zod';
import { DOCUMENT_CATEGORIES, PROCEDURE_TYPES } from '$types';

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
