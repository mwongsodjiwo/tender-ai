import { z } from 'zod';
import { REQUIREMENT_TYPES, REQUIREMENT_CATEGORIES, SCORING_METHODOLOGIES, CRITERION_TYPES, CONTRACT_TYPES, GENERAL_CONDITIONS_TYPES } from '$types';

// =============================================================================
// REQUIREMENTS — Sprint R5 (PvE eisenmanager)
// =============================================================================

export const createRequirementSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID'),
	title: z.string().min(1, 'Titel is verplicht').max(500),
	description: z.string().max(5000).optional().default(''),
	requirement_type: z.enum(REQUIREMENT_TYPES, {
		errorMap: () => ({ message: 'Type moet eis of wens zijn' })
	}),
	category: z.enum(REQUIREMENT_CATEGORIES, {
		errorMap: () => ({ message: 'Ongeldige categorie' })
	}),
	priority: z.number().int().min(1).max(5).optional().default(3),
	sort_order: z.number().int().min(0).optional()
});

export const updateRequirementSchema = z.object({
	title: z.string().min(1).max(500).optional(),
	description: z.string().max(5000).optional(),
	requirement_type: z.enum(REQUIREMENT_TYPES).optional(),
	category: z.enum(REQUIREMENT_CATEGORIES).optional(),
	priority: z.number().int().min(1).max(5).optional(),
	sort_order: z.number().int().min(0).optional()
});

export const reorderRequirementsSchema = z.object({
	ordered_ids: z.array(z.string().uuid('Ongeldig eis-ID')).min(1, 'Minimaal één eis vereist')
});

export const generateRequirementsSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID')
});

// =============================================================================
// EMVI CRITERIA — Sprint R6 (wegingstool)
// =============================================================================

export const updateScoringMethodologySchema = z.object({
	scoring_methodology: z.enum(SCORING_METHODOLOGIES, {
		errorMap: () => ({ message: 'Gunningssystematiek moet laagste prijs, EMVI of beste PKV zijn' })
	})
});

export const createEmviCriterionSchema = z.object({
	name: z.string().min(1, 'Naam is verplicht').max(300),
	description: z.string().max(5000).optional().default(''),
	criterion_type: z.enum(CRITERION_TYPES, {
		errorMap: () => ({ message: 'Type moet prijs of kwaliteit zijn' })
	}),
	weight_percentage: z.number().min(0, 'Weging mag niet negatief zijn').max(100, 'Weging mag niet hoger dan 100% zijn'),
	sort_order: z.number().int().min(0).optional()
});

export const updateEmviCriterionSchema = z.object({
	name: z.string().min(1).max(300).optional(),
	description: z.string().max(5000).optional(),
	criterion_type: z.enum(CRITERION_TYPES).optional(),
	weight_percentage: z.number().min(0).max(100).optional(),
	sort_order: z.number().int().min(0).optional()
});

// =============================================================================
// CONTRACT SETTINGS — Sprint R7 (Conceptovereenkomst wizard)
// =============================================================================

export const updateContractSettingsSchema = z.object({
	contract_type: z.enum(CONTRACT_TYPES, {
		errorMap: () => ({ message: 'Type opdracht moet diensten, leveringen of werken zijn' })
	}).nullable().optional(),
	general_conditions: z.enum(GENERAL_CONDITIONS_TYPES, {
		errorMap: () => ({ message: 'Ongeldige algemene voorwaarden' })
	}).nullable().optional()
});

export const generateContractArticleSchema = z.object({
	instructions: z.string().max(2000).optional()
});
