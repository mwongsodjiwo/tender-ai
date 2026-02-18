// Unit tests for Fase 4 — CPV types, validation schema, and API endpoint

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { cpvSearchSchema } from '../../src/lib/server/api/validation/cpv';
import { CPV_CATEGORY_TYPES, CPV_CATEGORY_TYPE_LABELS } from '../../src/lib/types/enums';
import type { CpvCode } from '../../src/lib/types/database';

// =============================================================================
// CPV ENUM TYPES
// =============================================================================

describe('CPV category type enum', () => {
	it('has exactly 3 category types', () => {
		expect(CPV_CATEGORY_TYPES).toHaveLength(3);
	});

	it('contains werken, leveringen, diensten', () => {
		expect(CPV_CATEGORY_TYPES).toEqual(['werken', 'leveringen', 'diensten']);
	});

	it('has Dutch labels for all types', () => {
		expect(CPV_CATEGORY_TYPE_LABELS.werken).toBe('Werken');
		expect(CPV_CATEGORY_TYPE_LABELS.leveringen).toBe('Leveringen');
		expect(CPV_CATEGORY_TYPE_LABELS.diensten).toBe('Diensten');
	});
});

// =============================================================================
// CPV CODE TYPE SHAPE
// =============================================================================

describe('CpvCode type', () => {
	it('accepts valid CpvCode object', () => {
		const code: CpvCode = {
			code: '45000000-7',
			description_nl: 'Bouwwerkzaamheden',
			division: '45',
			group_code: null,
			class_code: null,
			category_type: 'werken',
			parent_code: null,
			created_at: '2026-01-01T00:00:00Z'
		};
		expect(code.code).toBe('45000000-7');
		expect(code.category_type).toBe('werken');
	});

	it('allows nullable fields', () => {
		const code: CpvCode = {
			code: '45210000-2',
			description_nl: 'Bouwen van gebouwen',
			division: '45',
			group_code: '452',
			class_code: '4521',
			category_type: 'werken',
			parent_code: '45200000-9',
			created_at: '2026-01-01T00:00:00Z'
		};
		expect(code.group_code).toBe('452');
		expect(code.parent_code).toBe('45200000-9');
	});
});

// =============================================================================
// CPV SEARCH VALIDATION SCHEMA
// =============================================================================

describe('cpvSearchSchema', () => {
	it('accepts empty params with defaults', () => {
		const result = cpvSearchSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(50);
			expect(result.data.offset).toBe(0);
		}
	});

	it('accepts category_type filter', () => {
		const result = cpvSearchSchema.safeParse({ category_type: 'werken' });
		expect(result.success).toBe(true);
	});

	it('rejects invalid category_type', () => {
		const result = cpvSearchSchema.safeParse({ category_type: 'invalid' });
		expect(result.success).toBe(false);
	});

	it('accepts valid division filter', () => {
		const result = cpvSearchSchema.safeParse({ division: '45' });
		expect(result.success).toBe(true);
	});

	it('rejects invalid division format', () => {
		expect(cpvSearchSchema.safeParse({ division: 'abc' }).success).toBe(false);
		expect(cpvSearchSchema.safeParse({ division: '4' }).success).toBe(false);
	});

	it('accepts search parameter', () => {
		const result = cpvSearchSchema.safeParse({ search: 'bouw' });
		expect(result.success).toBe(true);
	});

	it('rejects overly long search', () => {
		const result = cpvSearchSchema.safeParse({ search: 'a'.repeat(201) });
		expect(result.success).toBe(false);
	});

	it('accepts custom limit and offset', () => {
		const result = cpvSearchSchema.safeParse({ limit: 25, offset: 50 });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(25);
			expect(result.data.offset).toBe(50);
		}
	});

	it('rejects limit above 100', () => {
		expect(cpvSearchSchema.safeParse({ limit: 101 }).success).toBe(false);
	});

	it('rejects negative offset', () => {
		expect(cpvSearchSchema.safeParse({ offset: -1 }).success).toBe(false);
	});

	it('coerces string limit/offset to numbers', () => {
		const result = cpvSearchSchema.safeParse({ limit: '10', offset: '5' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(10);
			expect(result.data.offset).toBe(5);
		}
	});

	it('accepts combined filters', () => {
		const result = cpvSearchSchema.safeParse({
			category_type: 'diensten',
			division: '72',
			search: 'IT',
			limit: 20,
			offset: 0
		});
		expect(result.success).toBe(true);
	});
});

// =============================================================================
// API ENDPOINT FILE VERIFICATION
// =============================================================================

describe('CPV API endpoint file', () => {
	const source = readFileSync(
		path.resolve('src/routes/api/cpv/+server.ts'), 'utf-8'
	);

	it('exports GET handler', () => {
		expect(source).toContain('export const GET');
	});

	it('uses cpvSearchSchema for validation', () => {
		expect(source).toContain('cpvSearchSchema');
	});

	it('checks authentication', () => {
		expect(source).toContain('UNAUTHORIZED');
	});

	it('filters by category_type and division', () => {
		expect(source).toContain("'category_type'");
		expect(source).toContain("'division'");
	});

	it('supports text search and pagination', () => {
		expect(source).toContain('description_nl');
		expect(source).toContain('.range(');
	});

	it('returns items and total from cpv_codes', () => {
		expect(source).toContain("'cpv_codes'");
		expect(source).toContain("count: 'exact'");
	});
});
