// Unit tests for Sprint R2 — Knowledge base search validation schema

import { describe, it, expect } from 'vitest';
import {
	knowledgeBaseSearchSchema
} from '../../src/lib/server/api/validation';

describe('knowledgeBaseSearchSchema', () => {
	it('accepts valid search with query only', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'ICT-diensten'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.cpv_codes).toEqual([]);
			expect(result.data.limit).toBe(10);
		}
	});

	it('accepts fully populated search', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'aanbesteding kantoorapparatuur',
			cpv_codes: ['72000000', '30200000'],
			limit: 20
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.cpv_codes).toEqual(['72000000', '30200000']);
			expect(result.data.limit).toBe(20);
		}
	});

	it('rejects missing query', () => {
		const result = knowledgeBaseSearchSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects query shorter than 2 characters', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'a'
		});
		expect(result.success).toBe(false);
	});

	it('accepts query of exactly 2 characters', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'IT'
		});
		expect(result.success).toBe(true);
	});

	it('rejects query exceeding max length (500)', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'A'.repeat(501)
		});
		expect(result.success).toBe(false);
	});

	it('accepts query at max length (500)', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'A'.repeat(500)
		});
		expect(result.success).toBe(true);
	});

	it('defaults cpv_codes to empty array', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'test'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.cpv_codes).toEqual([]);
		}
	});

	it('rejects cpv_codes entries exceeding max length', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'test',
			cpv_codes: ['A'.repeat(21)]
		});
		expect(result.success).toBe(false);
	});

	it('defaults limit to 10', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'test'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(10);
		}
	});

	it('rejects limit less than 1', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'test',
			limit: 0
		});
		expect(result.success).toBe(false);
	});

	it('rejects limit greater than 50', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'test',
			limit: 51
		});
		expect(result.success).toBe(false);
	});

	it('accepts limit at boundaries', () => {
		const result1 = knowledgeBaseSearchSchema.safeParse({ query: 'test', limit: 1 });
		expect(result1.success).toBe(true);

		const result50 = knowledgeBaseSearchSchema.safeParse({ query: 'test', limit: 50 });
		expect(result50.success).toBe(true);
	});

	it('rejects non-integer limit', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'test',
			limit: 5.5
		});
		expect(result.success).toBe(false);
	});

	it('accepts empty cpv_codes array', () => {
		const result = knowledgeBaseSearchSchema.safeParse({
			query: 'test',
			cpv_codes: []
		});
		expect(result.success).toBe(true);
	});
});
