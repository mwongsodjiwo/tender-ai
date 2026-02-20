import { z } from 'zod';
import { ARTIFACT_STATUSES } from '$types';

// =============================================================================
// ARTIFACTS
// =============================================================================

export const createArtifactSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID'),
	section_key: z.string().min(1).max(100),
	title: z.string().min(1, 'Titel is verplicht').max(300),
	content: z.string().optional().default(''),
	sort_order: z.number().int().min(0).optional().default(0),
	metadata: z.record(z.unknown()).optional().default({})
});

export const updateArtifactSchema = z.object({
	title: z.string().min(1).max(300).optional(),
	content: z.string().optional(),
	status: z.enum(ARTIFACT_STATUSES).optional(),
	sort_order: z.number().int().min(0).optional(),
	metadata: z.record(z.unknown()).optional()
});

// =============================================================================
// CONVERSATIONS
// =============================================================================

export const createConversationSchema = z.object({
	project_id: z.string().uuid('Ongeldig project-ID'),
	artifact_id: z.string().uuid('Ongeldig artifact-ID').optional(),
	title: z.string().max(200).optional(),
	context_type: z.string().max(50).optional().default('general')
});

// =============================================================================
// BRIEFING
// =============================================================================

export const briefingStartSchema = z.object({
	project_id: z.string().uuid('Ongeldig project-ID')
});

export const briefingMessageSchema = z.object({
	project_id: z.string().uuid('Ongeldig project-ID'),
	conversation_id: z.string().uuid('Ongeldig gesprek-ID'),
	message: z.string().min(1, 'Bericht mag niet leeg zijn').max(10000)
});

// =============================================================================
// DOCUMENT ASSEMBLY — Sprint 2
// =============================================================================

export const assembleDocumentSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID')
});

// =============================================================================
// EXPORT — Sprint 2
// =============================================================================

export const exportDocumentSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID'),
	format: z.enum(['docx', 'pdf'], { errorMap: () => ({ message: 'Formaat moet docx of pdf zijn' }) }),
	template_id: z.string().uuid('Ongeldig template-ID').optional()
});

// =============================================================================
// REGENERATE — Sprint 2
// =============================================================================

export const regenerateSectionSchema = z.object({
	artifact_id: z.string().uuid('Ongeldig artifact-ID'),
	instructions: z.string().max(2000).optional()
});

// =============================================================================
// CONTEXT SEARCH — Sprint 2
// =============================================================================

export const contextSearchSchema = z.object({
	query: z.string().min(2, 'Zoekterm moet minimaal 2 tekens bevatten').max(500),
	project_id: z.string().uuid().optional(),
	organization_id: z.string().uuid().optional(),
	limit: z.number().int().min(1).max(20).optional().default(5)
});

// =============================================================================
// SECTION CHAT — Sprint 2
// =============================================================================

export const sectionChatSchema = z.object({
	artifact_id: z.string().uuid('Ongeldig artifact-ID'),
	conversation_id: z.string().uuid('Ongeldig gesprek-ID').optional(),
	message: z.string().min(1, 'Bericht mag niet leeg zijn').max(10000)
});
