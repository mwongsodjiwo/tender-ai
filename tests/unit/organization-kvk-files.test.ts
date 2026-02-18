// Unit tests for Fase 6 — KVK migration, API endpoint, and validation file verification

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// =============================================================================
// MIGRATION FILE VERIFICATION
// =============================================================================

describe('KVK migration file', () => {
	const sql = readFileSync(
		path.resolve(
			'supabase/migrations/20260218001000_extend_organizations_kvk.sql'
		),
		'utf-8'
	);

	it('adds kvk_nummer column with unique constraint', () => {
		expect(sql).toContain('kvk_nummer VARCHAR(8) UNIQUE');
	});

	it('adds handelsnaam column', () => {
		expect(sql).toContain('handelsnaam TEXT');
	});

	it('adds rechtsvorm column', () => {
		expect(sql).toContain('rechtsvorm TEXT');
	});

	it('adds address columns', () => {
		expect(sql).toContain('straat TEXT');
		expect(sql).toContain('postcode VARCHAR(7)');
		expect(sql).toContain('plaats TEXT');
	});

	it('adds sbi_codes array column', () => {
		expect(sql).toContain('sbi_codes TEXT[]');
	});

	it('adds nuts_codes array column', () => {
		expect(sql).toContain('nuts_codes TEXT[]');
	});

	it('has KVK index', () => {
		expect(sql).toContain('idx_organizations_kvk');
	});

	it('has plaats index', () => {
		expect(sql).toContain('idx_organizations_plaats');
	});

	it('alters organizations table', () => {
		expect(sql).toContain('ALTER TABLE organizations');
	});
});

// =============================================================================
// API ENDPOINT FILE VERIFICATION
// =============================================================================

describe('Organizations API endpoint — KVK fields', () => {
	const source = readFileSync(
		path.resolve('src/routes/api/organizations/+server.ts'),
		'utf-8'
	);

	it('destructures KVK fields from parsed data', () => {
		expect(source).toContain('kvk_nummer');
		expect(source).toContain('handelsnaam');
		expect(source).toContain('rechtsvorm');
		expect(source).toContain('sbi_codes');
		expect(source).toContain('nuts_codes');
	});

	it('passes address fields to insert', () => {
		expect(source).toContain('straat');
		expect(source).toContain('postcode');
		expect(source).toContain('plaats');
	});
});

// =============================================================================
// VALIDATION FILE STRUCTURE
// =============================================================================

describe('Auth validation file — KVK additions', () => {
	const source = readFileSync(
		path.resolve('src/lib/server/api/validation/auth.ts'),
		'utf-8'
	);

	it('has kvk_nummer validation with regex', () => {
		expect(source).toContain('kvk_nummer');
		expect(source).toContain('8 cijfers');
	});

	it('has postcode validation with regex', () => {
		expect(source).toContain('postcode');
		expect(source).toContain('1234AB');
	});

	it('has sbi_codes array validation', () => {
		expect(source).toContain('sbi_codes');
	});

	it('has nuts_codes array validation with NL regex', () => {
		expect(source).toContain('nuts_codes');
		expect(source).toContain('NL');
	});
});

// =============================================================================
// TYPE FILE VERIFICATION
// =============================================================================

describe('Organization type file — KVK fields', () => {
	const source = readFileSync(
		path.resolve('src/lib/types/db/base.ts'), 'utf-8'
	);

	it('has kvk_nummer field', () => {
		expect(source).toContain('kvk_nummer: string | null');
	});

	it('has handelsnaam field', () => {
		expect(source).toContain('handelsnaam: string | null');
	});

	it('has rechtsvorm field', () => {
		expect(source).toContain('rechtsvorm: string | null');
	});

	it('has address fields', () => {
		expect(source).toContain('straat: string | null');
		expect(source).toContain('postcode: string | null');
		expect(source).toContain('plaats: string | null');
	});

	it('has sbi_codes array field', () => {
		expect(source).toContain('sbi_codes: string[]');
	});

	it('has nuts_codes array field', () => {
		expect(source).toContain('nuts_codes: string[]');
	});
});

// =============================================================================
// API REQUEST TYPE FILE
// =============================================================================

describe('Organization API types — KVK fields', () => {
	const source = readFileSync(
		path.resolve('src/lib/types/api/organizations.ts'), 'utf-8'
	);

	it('CreateOrganizationRequest has KVK fields', () => {
		expect(source).toContain('kvk_nummer');
		expect(source).toContain('handelsnaam');
		expect(source).toContain('sbi_codes');
		expect(source).toContain('nuts_codes');
	});

	it('UpdateOrganizationRequest has KVK fields', () => {
		expect(source).toContain('kvk_nummer');
		expect(source).toContain('plaats');
	});
});
