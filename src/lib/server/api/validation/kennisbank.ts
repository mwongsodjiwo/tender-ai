import { z } from 'zod';
import { MARKET_RESEARCH_ACTIVITY_TYPES } from '$types';

// =============================================================================
// KNOWLEDGE BASE SEARCH — Sprint R2 (Kennisbank zoeken)
// =============================================================================

export const knowledgeBaseSearchSchema = z.object({
	query: z.string().min(2, 'Zoekterm moet minimaal 2 tekens bevatten').max(500),
	cpv_codes: z.array(z.string().max(20)).optional().default([]),
	limit: z.number().int().min(1).max(50).optional().default(10)
});

// =============================================================================
// MARKET RESEARCH — Sprint R5 (Marktverkenning)
// =============================================================================

export const deskresearchSchema = z.object({
	query: z.string().max(500).optional(),
	cpv_codes: z.array(z.string().max(20)).optional(),
	limit: z.number().int().min(1).max(50).optional().default(10)
});

export const generateRfiSchema = z.object({
	additional_context: z.string().max(5000).optional()
});

export const generateMarketReportSchema = z.object({
	additional_context: z.string().max(5000).optional()
});

export const saveMarketResearchSchema = z.object({
	activity_type: z.enum(MARKET_RESEARCH_ACTIVITY_TYPES, {
		errorMap: () => ({ message: 'Ongeldig activiteittype voor marktverkenning' })
	}),
	content: z.string().min(1, 'Inhoud mag niet leeg zijn').max(100000),
	metadata: z.record(z.unknown()).optional().default({})
});

// =============================================================================
// LEIDRAAD SECTION GENERATION — Sprint R6 (Aanbestedingsleidraad wizard)
// =============================================================================

export const generateLeidraadSectionSchema = z.object({
	section_key: z.string().max(100).optional(),
	instructions: z.string().max(5000).optional()
});

// =============================================================================
// CORRESPONDENCE GENERATION — Sprint R11 (Brief-generatie)
// =============================================================================

export const generateLetterSchema = z.object({
	letter_type: z.string().min(1, 'Brieftype is verplicht').max(100),
	recipient: z.string().max(500).optional(),
	instructions: z.string().max(5000).optional(),
	evaluation_id: z.string().uuid('Ongeldig evaluatie-ID').optional()
});
