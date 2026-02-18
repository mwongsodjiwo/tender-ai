// Zod validation schemas for incoming questions (v2 Fase 10)

import { z } from 'zod';
import { QUESTION_STATUSES } from '$types';

export const createQuestionSchema = z.object({
	question_text: z.string().min(1, 'Vraagtekst is verplicht').max(5000),
	supplier_id: z.string().uuid('Ongeldige leverancier-ID').optional(),
	reference_document: z.string().max(500).optional(),
	reference_artifact_id: z.string().uuid('Ongeldig artifact-ID').optional(),
	is_rectification: z.boolean().optional(),
	rectification_text: z.string().max(5000).optional()
});

export const updateQuestionSchema = z.object({
	question_text: z.string().min(1, 'Vraagtekst is verplicht').max(5000).optional(),
	answer_text: z.string().min(1, 'Antwoord is verplicht').max(10000).optional(),
	status: z.enum(QUESTION_STATUSES).optional(),
	reference_document: z.string().max(500).optional(),
	reference_artifact_id: z.string().uuid('Ongeldig artifact-ID').optional(),
	is_rectification: z.boolean().optional(),
	rectification_text: z.string().max(5000).optional()
});

export const questionListQuerySchema = z.object({
	status: z.enum(QUESTION_STATUSES).optional(),
	supplier_id: z.string().uuid().optional(),
	limit: z.coerce.number().int().min(1).max(200).default(100),
	offset: z.coerce.number().int().min(0).default(0)
});
