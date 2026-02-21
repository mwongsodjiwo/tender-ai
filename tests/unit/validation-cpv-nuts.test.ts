// Fase 54 — Zod validation tests: CPV & NUTS search schemas

import { describe, it, expect } from 'vitest';
import {
	cpvSearchSchema
} from '../../src/lib/server/api/validation/cpv';
import {
	nutsSearchSchema
} from '../../src/lib/server/api/validation/nuts';

describe('cpvSearchSchema', () => {
	it('accepts valid CPV search', () => {
		const result = cpvSearchSchema.safeParse({
			search: 'bouw',
			category_type: 'werken',
			limit: 20
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (all optional with defaults)', () => {
		const result = cpvSearchSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(50);
			expect(result.data.offset).toBe(0);
		}
	});

	it('rejects invalid category_type', () => {
		const result = cpvSearchSchema.safeParse({
			category_type: 'onbekend'
		});
		expect(result.success).toBe(false);
	});

	it('rejects division not matching 2-digit pattern', () => {
		const result = cpvSearchSchema.safeParse({
			division: '123'
		});
		expect(result.success).toBe(false);
	});

	it('accepts valid 2-digit division', () => {
		const result = cpvSearchSchema.safeParse({
			division: '45'
		});
		expect(result.success).toBe(true);
	});

	it('rejects search exceeding max length', () => {
		const result = cpvSearchSchema.safeParse({
			search: 'x'.repeat(201)
		});
		expect(result.success).toBe(false);
	});

	it('rejects limit above 100', () => {
		const result = cpvSearchSchema.safeParse({
			limit: 200
		});
		expect(result.success).toBe(false);
	});
});

describe('nutsSearchSchema', () => {
	it('accepts valid NUTS search', () => {
		const result = nutsSearchSchema.safeParse({
			search: 'Amsterdam',
			level: 2,
			limit: 10
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object with defaults', () => {
		const result = nutsSearchSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(50);
			expect(result.data.offset).toBe(0);
		}
	});

	it('rejects invalid parent_code pattern', () => {
		const result = nutsSearchSchema.safeParse({
			parent_code: 'DE123'
		});
		expect(result.success).toBe(false);
	});

	it('accepts valid Dutch NUTS parent code', () => {
		const result = nutsSearchSchema.safeParse({
			parent_code: 'NL3'
		});
		expect(result.success).toBe(true);
	});

	it('rejects level above 3', () => {
		const result = nutsSearchSchema.safeParse({
			level: 4
		});
		expect(result.success).toBe(false);
	});

	it('rejects search exceeding max length', () => {
		const result = nutsSearchSchema.safeParse({
			search: 'x'.repeat(201)
		});
		expect(result.success).toBe(false);
	});
});
