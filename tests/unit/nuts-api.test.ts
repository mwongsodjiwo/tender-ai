// Unit tests for Fase 5 — NUTS types, validation schema, and API endpoint

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { nutsSearchSchema } from '../../src/lib/server/api/validation/nuts';
import { NUTS_LEVELS, NUTS_LEVEL_LABELS } from '../../src/lib/types/enums';
import type { NutsCode, PostcodeNutsMapping, NutsHierarchy } from '../../src/lib/types/database';

// =============================================================================
// NUTS TYPE SHAPE
// =============================================================================

describe('NutsCode type', () => {
	it('accepts valid NutsCode object', () => {
		const code: NutsCode = {
			code: 'NL',
			label_nl: 'Nederland',
			level: 0,
			parent_code: null,
			created_at: '2026-01-01T00:00:00Z'
		};
		expect(code.code).toBe('NL');
		expect(code.level).toBe(0);
	});

	it('accepts child NutsCode with parent', () => {
		const code: NutsCode = {
			code: 'NL32',
			label_nl: 'Noord-Holland',
			level: 2,
			parent_code: 'NL3',
			created_at: '2026-01-01T00:00:00Z'
		};
		expect(code.parent_code).toBe('NL3');
	});
});

describe('PostcodeNutsMapping type', () => {
	it('accepts valid mapping', () => {
		const mapping: PostcodeNutsMapping = {
			postcode_prefix: '1000',
			nuts3_code: 'NL326',
			created_at: '2026-01-01T00:00:00Z'
		};
		expect(mapping.postcode_prefix).toBe('1000');
	});
});

describe('NutsHierarchy type', () => {
	it('accepts full hierarchy', () => {
		const h: NutsHierarchy = {
			nuts0: { code: 'NL', label_nl: 'Nederland', level: 0, parent_code: null, created_at: '' },
			nuts1: { code: 'NL3', label_nl: 'West-Nederland', level: 1, parent_code: 'NL', created_at: '' },
			nuts2: { code: 'NL32', label_nl: 'Noord-Holland', level: 2, parent_code: 'NL3', created_at: '' },
			nuts3: { code: 'NL326', label_nl: 'Groot-Amsterdam', level: 3, parent_code: 'NL32', created_at: '' }
		};
		expect(h.nuts0?.code).toBe('NL');
		expect(h.nuts3?.code).toBe('NL326');
	});

	it('allows null levels', () => {
		const h: NutsHierarchy = {
			nuts0: null,
			nuts1: null,
			nuts2: null,
			nuts3: null
		};
		expect(h.nuts0).toBeNull();
	});
});

// =============================================================================
// NUTS SEARCH VALIDATION SCHEMA
// =============================================================================

describe('nutsSearchSchema', () => {
	it('accepts empty params with defaults', () => {
		const result = nutsSearchSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(50);
			expect(result.data.offset).toBe(0);
		}
	});

	it('accepts level filter', () => {
		const result = nutsSearchSchema.safeParse({ level: 2 });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.level).toBe(2);
		}
	});

	it('rejects invalid level', () => {
		expect(nutsSearchSchema.safeParse({ level: 4 }).success).toBe(false);
		expect(nutsSearchSchema.safeParse({ level: -1 }).success).toBe(false);
	});

	it('accepts valid parent_code', () => {
		const result = nutsSearchSchema.safeParse({ parent_code: 'NL3' });
		expect(result.success).toBe(true);
	});

	it('rejects invalid parent_code', () => {
		expect(nutsSearchSchema.safeParse({ parent_code: 'XX' }).success).toBe(false);
		expect(nutsSearchSchema.safeParse({ parent_code: 'nl3' }).success).toBe(false);
	});

	it('accepts search parameter', () => {
		const result = nutsSearchSchema.safeParse({ search: 'Amsterdam' });
		expect(result.success).toBe(true);
	});

	it('rejects overly long search', () => {
		const result = nutsSearchSchema.safeParse({ search: 'a'.repeat(201) });
		expect(result.success).toBe(false);
	});

	it('accepts custom limit and offset', () => {
		const result = nutsSearchSchema.safeParse({ limit: 25, offset: 10 });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(25);
			expect(result.data.offset).toBe(10);
		}
	});

	it('rejects limit above 100', () => {
		expect(nutsSearchSchema.safeParse({ limit: 101 }).success).toBe(false);
	});

	it('rejects negative offset', () => {
		expect(nutsSearchSchema.safeParse({ offset: -1 }).success).toBe(false);
	});

	it('coerces string limit/offset to numbers', () => {
		const result = nutsSearchSchema.safeParse({ limit: '10', offset: '5' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(10);
			expect(result.data.offset).toBe(5);
		}
	});

	it('coerces string level to number', () => {
		const result = nutsSearchSchema.safeParse({ level: '2' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.level).toBe(2);
		}
	});

	it('accepts combined filters', () => {
		const result = nutsSearchSchema.safeParse({
			level: 3,
			parent_code: 'NL32',
			search: 'Amsterdam',
			limit: 20,
			offset: 0
		});
		expect(result.success).toBe(true);
	});
});

// =============================================================================
// API ENDPOINT FILE VERIFICATION
// =============================================================================

describe('NUTS API endpoint file', () => {
	const source = readFileSync(
		path.resolve('src/routes/api/nuts/+server.ts'), 'utf-8'
	);

	it('exports GET handler', () => {
		expect(source).toContain('export const GET');
	});

	it('uses nutsSearchSchema for validation', () => {
		expect(source).toContain('nutsSearchSchema');
	});

	it('checks authentication', () => {
		expect(source).toContain('UNAUTHORIZED');
	});

	it('filters by level and parent_code', () => {
		expect(source).toContain("'level'");
		expect(source).toContain("'parent_code'");
	});

	it('supports text search and pagination', () => {
		expect(source).toContain('label_nl');
		expect(source).toContain('.range(');
	});

	it('returns items and total from nuts_codes', () => {
		expect(source).toContain("'nuts_codes'");
		expect(source).toContain("count: 'exact'");
	});
});

// =============================================================================
// MIGRATION FILE VERIFICATION
// =============================================================================

describe('NUTS migration file', () => {
	const sql = readFileSync(
		path.resolve('supabase/migrations/20260218000900_nuts_codes.sql'),
		'utf-8'
	);

	it('creates nuts_codes table', () => {
		expect(sql).toContain('CREATE TABLE nuts_codes');
	});

	it('has code as primary key', () => {
		expect(sql).toContain('code VARCHAR(5) PRIMARY KEY');
	});

	it('has required columns', () => {
		expect(sql).toContain('label_nl TEXT NOT NULL');
		expect(sql).toContain('level SMALLINT NOT NULL');
		expect(sql).toContain('parent_code');
	});

	it('has level check constraint', () => {
		expect(sql).toContain('CHECK (level BETWEEN 0 AND 3)');
	});

	it('has self-referencing FK', () => {
		expect(sql).toContain('REFERENCES nuts_codes(code)');
	});

	it('has indexes on level and parent', () => {
		expect(sql).toContain('idx_nuts_codes_level');
		expect(sql).toContain('idx_nuts_codes_parent');
	});

	it('has full-text search index', () => {
		expect(sql).toContain('gin(to_tsvector');
	});

	it('enables RLS with public read policy', () => {
		expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
		expect(sql).toContain('FOR SELECT');
		expect(sql).toContain('USING (true)');
	});

	it('creates postcode_nuts_mapping table', () => {
		expect(sql).toContain('CREATE TABLE postcode_nuts_mapping');
		expect(sql).toContain('postcode_prefix VARCHAR(4) PRIMARY KEY');
		expect(sql).toContain('nuts3_code VARCHAR(5) NOT NULL');
	});
});

// =============================================================================
// VALIDATION FILE STRUCTURE
// =============================================================================

describe('NUTS validation file', () => {
	const source = readFileSync(
		path.resolve('src/lib/server/api/validation/nuts.ts'),
		'utf-8'
	);

	it('uses zod for validation', () => {
		expect(source).toContain("from 'zod'");
	});

	it('exports nutsSearchSchema', () => {
		expect(source).toContain('export const nutsSearchSchema');
	});

	it('exports NutsSearchParams type', () => {
		expect(source).toContain('export type NutsSearchParams');
	});
});

// =============================================================================
// TYPE FILE STRUCTURE
// =============================================================================

describe('NUTS type file', () => {
	const source = readFileSync(
		path.resolve('src/lib/types/db/nuts.ts'), 'utf-8'
	);

	it('exports NutsCode interface', () => {
		expect(source).toContain('export interface NutsCode');
	});

	it('exports PostcodeNutsMapping interface', () => {
		expect(source).toContain('export interface PostcodeNutsMapping');
	});

	it('exports NutsHierarchy interface', () => {
		expect(source).toContain('export interface NutsHierarchy');
	});

	it('has all required fields', () => {
		expect(source).toContain('code: string');
		expect(source).toContain('label_nl: string');
		expect(source).toContain('level: number');
		expect(source).toContain('parent_code: string | null');
	});
});

// =============================================================================
// POSTCODE-TO-NUTS UTIL FILE STRUCTURE
// =============================================================================

describe('Postcode-to-NUTS utility file', () => {
	const source = readFileSync(
		path.resolve('src/lib/utils/postcode-to-nuts.ts'), 'utf-8'
	);

	it('exports getNutsFromPostcode', () => {
		expect(source).toContain('export async function getNutsFromPostcode');
	});

	it('exports extractPostcodePrefix', () => {
		expect(source).toContain('export function extractPostcodePrefix');
	});

	it('uses SupabaseClient type', () => {
		expect(source).toContain('SupabaseClient');
	});

	it('queries postcode_nuts_mapping table', () => {
		expect(source).toContain('postcode_nuts_mapping');
	});
});
