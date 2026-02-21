// Fase 54 — Zod validation tests: incoming questions schemas

import { describe, it, expect } from 'vitest';
import {
	createQuestionSchema,
	updateQuestionSchema,
	questionListQuerySchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('createQuestionSchema', () => {
	it('accepts valid question', () => {
		const result = createQuestionSchema.safeParse({
			question_text: 'Wat is de scope van dit project?'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing question_text', () => {
		const result = createQuestionSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects empty question_text', () => {
		const result = createQuestionSchema.safeParse({
			question_text: ''
		});
		expect(result.success).toBe(false);
	});

	it('rejects question_text exceeding max', () => {
		const result = createQuestionSchema.safeParse({
			question_text: 'x'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts optional supplier_id UUID', () => {
		const result = createQuestionSchema.safeParse({
			question_text: 'Vraag over de eisen',
			supplier_id: VALID_UUID,
			is_rectification: true,
			rectification_text: 'Rectificatie tekst'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid supplier_id', () => {
		const result = createQuestionSchema.safeParse({
			question_text: 'Vraag',
			supplier_id: 'invalid'
		});
		expect(result.success).toBe(false);
	});
});

describe('updateQuestionSchema', () => {
	it('accepts valid update with answer', () => {
		const result = updateQuestionSchema.safeParse({
			answer_text: 'Het antwoord is als volgt...',
			status: 'answered'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (all optional)', () => {
		const result = updateQuestionSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects invalid status', () => {
		const result = updateQuestionSchema.safeParse({
			status: 'deleted'
		});
		expect(result.success).toBe(false);
	});

	it('rejects wrong type for is_rectification', () => {
		const result = updateQuestionSchema.safeParse({
			is_rectification: 'ja'
		});
		expect(result.success).toBe(false);
	});

	it('accepts all valid statuses', () => {
		for (const status of ['received', 'in_review', 'answered', 'approved', 'published']) {
			const result = updateQuestionSchema.safeParse({ status });
			expect(result.success).toBe(true);
		}
	});
});

describe('questionListQuerySchema', () => {
	it('accepts valid query params', () => {
		const result = questionListQuerySchema.safeParse({
			status: 'received',
			limit: 50
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object with defaults', () => {
		const result = questionListQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(100);
			expect(result.data.offset).toBe(0);
		}
	});

	it('rejects limit above max', () => {
		const result = questionListQuerySchema.safeParse({
			limit: 300
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid supplier_id', () => {
		const result = questionListQuerySchema.safeParse({
			supplier_id: 'not-uuid'
		});
		expect(result.success).toBe(false);
	});
});
