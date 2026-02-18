// Unit tests for Fase 4 — CPV migration and file structure verification

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// =============================================================================
// MIGRATION FILE VERIFICATION
// =============================================================================

describe('CPV migration file', () => {
	const sql = readFileSync(
		path.resolve('supabase/migrations/20260218000800_cpv_codes.sql'),
		'utf-8'
	);

	it('creates cpv_category_type enum', () => {
		expect(sql).toContain('cpv_category_type');
		expect(sql).toContain("'werken'");
		expect(sql).toContain("'leveringen'");
		expect(sql).toContain("'diensten'");
	});

	it('creates cpv_codes table', () => {
		expect(sql).toContain('CREATE TABLE cpv_codes');
	});

	it('has code as primary key', () => {
		expect(sql).toContain('code VARCHAR(10) PRIMARY KEY');
	});

	it('has required columns', () => {
		expect(sql).toContain('description_nl TEXT NOT NULL');
		expect(sql).toContain('division VARCHAR(2) NOT NULL');
		expect(sql).toContain('group_code');
		expect(sql).toContain('class_code');
		expect(sql).toContain('category_type cpv_category_type NOT NULL');
		expect(sql).toContain('parent_code');
	});

	it('has self-referencing FK for parent_code', () => {
		expect(sql).toContain('REFERENCES cpv_codes(code)');
	});

	it('has indexes on division, category, and parent', () => {
		expect(sql).toContain('idx_cpv_codes_division');
		expect(sql).toContain('idx_cpv_codes_category');
		expect(sql).toContain('idx_cpv_codes_parent');
	});

	it('has full-text search index', () => {
		expect(sql).toContain('gin(to_tsvector');
	});

	it('enables RLS with public read policy', () => {
		expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
		expect(sql).toContain('FOR SELECT');
		expect(sql).toContain('USING (true)');
	});
});

// =============================================================================
// VALIDATION SCHEMA FILE STRUCTURE
// =============================================================================

describe('CPV validation file', () => {
	const source = readFileSync(
		path.resolve('src/lib/server/api/validation/cpv.ts'),
		'utf-8'
	);

	it('uses zod for validation', () => {
		expect(source).toContain("from 'zod'");
	});

	it('exports cpvSearchSchema', () => {
		expect(source).toContain('export const cpvSearchSchema');
	});

	it('exports CpvSearchParams type', () => {
		expect(source).toContain('export type CpvSearchParams');
	});

	it('validates category_type as enum', () => {
		expect(source).toContain('werken');
		expect(source).toContain('leveringen');
		expect(source).toContain('diensten');
	});
});

// =============================================================================
// TYPE FILE STRUCTURE
// =============================================================================

describe('CPV type file', () => {
	const source = readFileSync(
		path.resolve('src/lib/types/db/cpv.ts'),
		'utf-8'
	);

	it('exports CpvCode interface', () => {
		expect(source).toContain('export interface CpvCode');
	});

	it('imports CpvCategoryType', () => {
		expect(source).toContain('CpvCategoryType');
	});

	it('has all required fields', () => {
		expect(source).toContain('code: string');
		expect(source).toContain('description_nl: string');
		expect(source).toContain('division: string');
		expect(source).toContain('category_type: CpvCategoryType');
		expect(source).toContain('parent_code: string | null');
	});

	it('stays under 200 lines', () => {
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// IMPORT SCRIPT FILE STRUCTURE
// =============================================================================

describe('CPV import script', () => {
	const source = readFileSync(
		path.resolve('scripts/import-cpv-codes.ts'),
		'utf-8'
	);

	it('imports from cpv-parser', () => {
		expect(source).toContain('cpv-parser');
	});

	it('uses supabase client', () => {
		expect(source).toContain('@supabase/supabase-js');
	});

	it('reads environment variables', () => {
		expect(source).toContain('SUPABASE_URL');
		expect(source).toContain('SUPABASE_SERVICE_ROLE_KEY');
	});

	it('uses batch insert', () => {
		expect(source).toContain('BATCH_SIZE');
		expect(source).toContain('upsert');
	});

	it('handles parent references separately', () => {
		expect(source).toContain('parent_code: null');
		expect(source).toContain('withParents');
	});
});

// =============================================================================
// CPV PARSER FILE STRUCTURE
// =============================================================================

describe('CPV parser file', () => {
	const source = readFileSync(
		path.resolve('scripts/cpv-parser.ts'),
		'utf-8'
	);

	it('exports divisionToCategory', () => {
		expect(source).toContain('export function divisionToCategory');
	});

	it('exports parseCpvCode', () => {
		expect(source).toContain('export function parseCpvCode');
	});

	it('exports findParentCode', () => {
		expect(source).toContain('export function findParentCode');
	});

	it('exports transformRows', () => {
		expect(source).toContain('export function transformRows');
	});

	it('exports readExcel', () => {
		expect(source).toContain('export function readExcel');
	});

	it('stays under 200 lines', () => {
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});
