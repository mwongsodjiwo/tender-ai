// Sprint R12 — Evaluation validation schema tests
// Tests batchScoreSchema and calculateRankingSchema Zod validations

import { describe, it, expect } from 'vitest';
import { batchScoreSchema, calculateRankingSchema, createEvaluationSchema, updateEvaluationSchema } from '$server/api/validation';

describe('batchScoreSchema', () => {
	it('should accept valid batch scores', () => {
		const input = {
			scores: [
				{ evaluation_id: '550e8400-e29b-41d4-a716-446655440001', criterion_id: '550e8400-e29b-41d4-a716-446655440010', score: 8 },
				{ evaluation_id: '550e8400-e29b-41d4-a716-446655440002', criterion_id: '550e8400-e29b-41d4-a716-446655440010', score: 6.5 }
			]
		};

		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it('should reject empty scores array', () => {
		const input = { scores: [] };
		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it('should reject scores below 0', () => {
		const input = {
			scores: [
				{ evaluation_id: '550e8400-e29b-41d4-a716-446655440001', criterion_id: '550e8400-e29b-41d4-a716-446655440010', score: -1 }
			]
		};

		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain('minimaal 0');
		}
	});

	it('should reject scores above 10', () => {
		const input = {
			scores: [
				{ evaluation_id: '550e8400-e29b-41d4-a716-446655440001', criterion_id: '550e8400-e29b-41d4-a716-446655440010', score: 11 }
			]
		};

		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain('maximaal 10');
		}
	});

	it('should accept score of 0', () => {
		const input = {
			scores: [
				{ evaluation_id: '550e8400-e29b-41d4-a716-446655440001', criterion_id: '550e8400-e29b-41d4-a716-446655440010', score: 0 }
			]
		};

		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it('should accept score of 10', () => {
		const input = {
			scores: [
				{ evaluation_id: '550e8400-e29b-41d4-a716-446655440001', criterion_id: '550e8400-e29b-41d4-a716-446655440010', score: 10 }
			]
		};

		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it('should accept decimal scores', () => {
		const input = {
			scores: [
				{ evaluation_id: '550e8400-e29b-41d4-a716-446655440001', criterion_id: '550e8400-e29b-41d4-a716-446655440010', score: 7.5 }
			]
		};

		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it('should reject invalid evaluation_id (not UUID)', () => {
		const input = {
			scores: [
				{ evaluation_id: 'not-a-uuid', criterion_id: '550e8400-e29b-41d4-a716-446655440010', score: 5 }
			]
		};

		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it('should reject invalid criterion_id (not UUID)', () => {
		const input = {
			scores: [
				{ evaluation_id: '550e8400-e29b-41d4-a716-446655440001', criterion_id: 'bad-id', score: 5 }
			]
		};

		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it('should reject missing score field', () => {
		const input = {
			scores: [
				{ evaluation_id: '550e8400-e29b-41d4-a716-446655440001', criterion_id: '550e8400-e29b-41d4-a716-446655440010' }
			]
		};

		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it('should reject string score', () => {
		const input = {
			scores: [
				{ evaluation_id: '550e8400-e29b-41d4-a716-446655440001', criterion_id: '550e8400-e29b-41d4-a716-446655440010', score: 'eight' }
			]
		};

		const result = batchScoreSchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});

describe('calculateRankingSchema', () => {
	it('should accept empty object', () => {
		const result = calculateRankingSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('should accept with evaluation_ids', () => {
		const input = {
			evaluation_ids: [
				'550e8400-e29b-41d4-a716-446655440001',
				'550e8400-e29b-41d4-a716-446655440002'
			]
		};

		const result = calculateRankingSchema.safeParse(input);
		expect(result.success).toBe(true);
	});

	it('should accept without evaluation_ids (optional)', () => {
		const result = calculateRankingSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.evaluation_ids).toBeUndefined();
		}
	});

	it('should reject invalid UUIDs in evaluation_ids', () => {
		const input = { evaluation_ids: ['not-a-uuid'] };
		const result = calculateRankingSchema.safeParse(input);
		expect(result.success).toBe(false);
	});

	it('should reject empty evaluation_ids array', () => {
		const input = { evaluation_ids: [] };
		const result = calculateRankingSchema.safeParse(input);
		expect(result.success).toBe(false);
	});
});

describe('createEvaluationSchema', () => {
	it('should accept valid evaluation', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Bouwbedrijf ABC'
		});
		expect(result.success).toBe(true);
	});

	it('should reject empty tenderer_name', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: ''
		});
		expect(result.success).toBe(false);
	});

	it('should accept all optional fields', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test BV',
			scores: { criterion1: { score: 8 } },
			total_score: 7.5,
			ranking: 1,
			status: 'scoring',
			notes: 'Goede inschrijving'
		});
		expect(result.success).toBe(true);
	});

	it('should default status to draft', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test BV'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe('draft');
		}
	});

	it('should reject invalid status', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test',
			status: 'invalid_status'
		});
		expect(result.success).toBe(false);
	});
});

describe('updateEvaluationSchema', () => {
	it('should accept partial update', () => {
		const result = updateEvaluationSchema.safeParse({
			notes: 'Updated notes'
		});
		expect(result.success).toBe(true);
	});

	it('should accept nullable ranking', () => {
		const result = updateEvaluationSchema.safeParse({
			ranking: null
		});
		expect(result.success).toBe(true);
	});

	it('should accept valid status values', () => {
		for (const status of ['draft', 'scoring', 'completed', 'published']) {
			const result = updateEvaluationSchema.safeParse({ status });
			expect(result.success).toBe(true);
		}
	});
});
