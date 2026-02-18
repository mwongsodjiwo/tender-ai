// Unit tests for KVK validation schemas — search query and KVK nummer param

import { describe, it, expect } from 'vitest';
import {
	kvkSearchQuerySchema,
	kvkNummerParamSchema
} from '../../src/lib/server/api/validation/kvk';

// =============================================================================
// KVK SEARCH QUERY SCHEMA
// =============================================================================

describe('kvkSearchQuerySchema', () => {
	it('accepts valid naam search', () => {
		const result = kvkSearchQuerySchema.safeParse({ naam: 'Test BV' });
		expect(result.success).toBe(true);
	});

	it('accepts valid kvkNummer search', () => {
		const result = kvkSearchQuerySchema.safeParse({ kvkNummer: '12345678' });
		expect(result.success).toBe(true);
	});

	it('accepts combined params', () => {
		const result = kvkSearchQuerySchema.safeParse({
			naam: 'Test',
			plaats: 'Amsterdam',
			type: 'hoofdvestiging',
			resultatenPerPagina: '20',
			pagina: '2'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.resultatenPerPagina).toBe(20);
			expect(result.data.pagina).toBe(2);
		}
	});

	it('rejects naam shorter than 2 chars', () => {
		const result = kvkSearchQuerySchema.safeParse({ naam: 'A' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid kvkNummer format', () => {
		expect(kvkSearchQuerySchema.safeParse({ kvkNummer: '1234567' }).success).toBe(false);
		expect(kvkSearchQuerySchema.safeParse({ kvkNummer: '123456789' }).success).toBe(false);
		expect(kvkSearchQuerySchema.safeParse({ kvkNummer: 'ABCDEFGH' }).success).toBe(false);
	});

	it('rejects invalid type value', () => {
		const result = kvkSearchQuerySchema.safeParse({ type: 'ongeldig' });
		expect(result.success).toBe(false);
	});

	it('coerces resultatenPerPagina to number', () => {
		const result = kvkSearchQuerySchema.safeParse({ resultatenPerPagina: '50' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.resultatenPerPagina).toBe(50);
		}
	});

	it('rejects resultatenPerPagina over 100', () => {
		const result = kvkSearchQuerySchema.safeParse({ resultatenPerPagina: '101' });
		expect(result.success).toBe(false);
	});

	it('defaults resultatenPerPagina to 10', () => {
		const result = kvkSearchQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.resultatenPerPagina).toBe(10);
		}
	});

	it('defaults pagina to 1', () => {
		const result = kvkSearchQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.pagina).toBe(1);
		}
	});

	it('accepts empty object (all optional)', () => {
		const result = kvkSearchQuerySchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts nevenvestiging type', () => {
		const result = kvkSearchQuerySchema.safeParse({ type: 'nevenvestiging' });
		expect(result.success).toBe(true);
	});
});

// =============================================================================
// KVK NUMMER PARAM SCHEMA
// =============================================================================

describe('kvkNummerParamSchema', () => {
	it('accepts valid 8-digit kvkNummer', () => {
		const result = kvkNummerParamSchema.safeParse({ kvkNummer: '12345678' });
		expect(result.success).toBe(true);
	});

	it('rejects 7-digit kvkNummer', () => {
		const result = kvkNummerParamSchema.safeParse({ kvkNummer: '1234567' });
		expect(result.success).toBe(false);
	});

	it('rejects 9-digit kvkNummer', () => {
		const result = kvkNummerParamSchema.safeParse({ kvkNummer: '123456789' });
		expect(result.success).toBe(false);
	});

	it('rejects letters in kvkNummer', () => {
		const result = kvkNummerParamSchema.safeParse({ kvkNummer: '1234ABCD' });
		expect(result.success).toBe(false);
	});

	it('rejects missing kvkNummer', () => {
		const result = kvkNummerParamSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects empty string', () => {
		const result = kvkNummerParamSchema.safeParse({ kvkNummer: '' });
		expect(result.success).toBe(false);
	});
});
