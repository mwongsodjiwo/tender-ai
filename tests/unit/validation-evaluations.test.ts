// Unit tests for Sprint R2 — Evaluation validation schemas

import { describe, it, expect } from 'vitest';
import {
	createEvaluationSchema,
	updateEvaluationSchema
} from '../../src/lib/server/api/validation';

describe('createEvaluationSchema', () => {
	it('accepts valid evaluation with required fields', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Leverancier B.V.'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.scores).toEqual({});
			expect(result.data.total_score).toBe(0);
			expect(result.data.status).toBe('draft');
			expect(result.data.notes).toBe('');
		}
	});

	it('accepts fully populated evaluation', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Acme Solutions B.V.',
			scores: { price: 80, quality: 90, sustainability: 75 },
			total_score: 85.5,
			ranking: 1,
			status: 'completed',
			notes: 'Beste prijs-kwaliteitverhouding'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing tenderer_name', () => {
		const result = createEvaluationSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects empty tenderer_name', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: ''
		});
		expect(result.success).toBe(false);
	});

	it('rejects tenderer_name exceeding max length', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'A'.repeat(301)
		});
		expect(result.success).toBe(false);
	});

	it('accepts scores as any record', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test',
			scores: { criterion_1: 85, criterion_2: 92 }
		});
		expect(result.success).toBe(true);
	});

	it('rejects negative total_score', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test',
			total_score: -1
		});
		expect(result.success).toBe(false);
	});

	it('accepts zero total_score', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test',
			total_score: 0
		});
		expect(result.success).toBe(true);
	});

	it('rejects ranking less than 1', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test',
			ranking: 0
		});
		expect(result.success).toBe(false);
	});

	it('accepts ranking of 1', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test',
			ranking: 1
		});
		expect(result.success).toBe(true);
	});

	it('rejects non-integer ranking', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test',
			ranking: 1.5
		});
		expect(result.success).toBe(false);
	});

	it('accepts all valid statuses', () => {
		const statuses = ['draft', 'scoring', 'completed', 'published'] as const;
		for (const status of statuses) {
			const result = createEvaluationSchema.safeParse({
				tenderer_name: 'Test',
				status
			});
			expect(result.success).toBe(true);
		}
	});

	it('rejects invalid status', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test',
			status: 'invalid_status'
		});
		expect(result.success).toBe(false);
	});

	it('defaults status to draft', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe('draft');
		}
	});

	it('rejects notes exceeding max length', () => {
		const result = createEvaluationSchema.safeParse({
			tenderer_name: 'Test',
			notes: 'A'.repeat(10001)
		});
		expect(result.success).toBe(false);
	});
});

describe('updateEvaluationSchema', () => {
	it('accepts empty object (all fields optional)', () => {
		const result = updateEvaluationSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts partial update with score', () => {
		const result = updateEvaluationSchema.safeParse({
			total_score: 92.5,
			ranking: 2
		});
		expect(result.success).toBe(true);
	});

	it('accepts status update', () => {
		const result = updateEvaluationSchema.safeParse({
			status: 'published'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid status in update', () => {
		const result = updateEvaluationSchema.safeParse({
			status: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('accepts null ranking (remove ranking)', () => {
		const result = updateEvaluationSchema.safeParse({
			ranking: null
		});
		expect(result.success).toBe(true);
	});

	it('rejects negative total_score in update', () => {
		const result = updateEvaluationSchema.safeParse({
			total_score: -5
		});
		expect(result.success).toBe(false);
	});

	it('accepts tenderer_name update', () => {
		const result = updateEvaluationSchema.safeParse({
			tenderer_name: 'Nieuwe Naam B.V.'
		});
		expect(result.success).toBe(true);
	});

	it('rejects empty tenderer_name in update', () => {
		const result = updateEvaluationSchema.safeParse({
			tenderer_name: ''
		});
		expect(result.success).toBe(false);
	});
});
