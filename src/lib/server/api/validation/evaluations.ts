import { z } from 'zod';
import { EVALUATION_STATUSES } from '$types';

// =============================================================================
// EVALUATIONS — Sprint R2 (Beoordelingen)
// =============================================================================

export const createEvaluationSchema = z.object({
	tenderer_name: z.string().min(1, 'Naam inschrijver is verplicht').max(300),
	scores: z.record(z.unknown()).optional().default({}),
	total_score: z.number().min(0).optional().default(0),
	ranking: z.number().int().min(1).optional(),
	status: z.enum(EVALUATION_STATUSES, {
		errorMap: () => ({ message: 'Ongeldige status' })
	}).optional().default('draft'),
	notes: z.string().max(10000).optional().default('')
});

export const updateEvaluationSchema = z.object({
	tenderer_name: z.string().min(1).max(300).optional(),
	scores: z.record(z.unknown()).optional(),
	total_score: z.number().min(0).optional(),
	ranking: z.number().int().min(1).nullable().optional(),
	status: z.enum(EVALUATION_STATUSES, {
		errorMap: () => ({ message: 'Ongeldige status' })
	}).optional(),
	notes: z.string().max(10000).optional()
});

export const batchScoreSchema = z.object({
	scores: z.array(z.object({
		evaluation_id: z.string().uuid('Ongeldig evaluation ID'),
		criterion_id: z.string().uuid('Ongeldig criterium ID'),
		score: z.number().min(0, 'Score moet minimaal 0 zijn').max(10, 'Score mag maximaal 10 zijn')
	})).min(1, 'Minimaal één score is verplicht').max(500, 'Maximaal 500 scores per batch')
});

export const calculateRankingSchema = z.object({
	evaluation_ids: z.array(z.string().uuid()).min(1).max(100).optional()
});
