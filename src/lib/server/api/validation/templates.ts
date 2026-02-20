import { z } from 'zod';
import { CPV_CATEGORY_TYPES } from '$types';

// =============================================================================
// DOCUMENT TEMPLATES — Fase 14
// =============================================================================

const MAX_TEMPLATE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_TEMPLATE_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const uploadTemplateSchema = z.object({
	organization_id: z.string().uuid('Ongeldig organisatie-ID'),
	document_type_id: z.string().uuid('Ongeldig documenttype-ID'),
	category_type: z.enum(CPV_CATEGORY_TYPES).nullable().optional(),
	name: z.string().min(1, 'Naam is verplicht').max(300),
	description: z.string().max(1000).nullable().optional(),
	is_default: z.boolean().optional().default(false)
});

export const uploadTemplateFileValidation = z.object({
	size: z.number().max(MAX_TEMPLATE_SIZE, 'Bestand mag maximaal 50 MB zijn'),
	type: z.literal(ALLOWED_TEMPLATE_MIME, {
		errorMap: () => ({ message: 'Alleen .docx bestanden zijn toegestaan' })
	})
});

export const updateTemplateSchema = z.object({
	name: z.string().min(1).max(300).optional(),
	description: z.string().max(1000).nullable().optional(),
	is_default: z.boolean().optional(),
	category_type: z.enum(CPV_CATEGORY_TYPES).nullable().optional()
});

export const listTemplatesSchema = z.object({
	organization_id: z.string().uuid('Ongeldig organisatie-ID'),
	document_type_id: z.string().uuid('Ongeldig documenttype-ID').optional()
});
