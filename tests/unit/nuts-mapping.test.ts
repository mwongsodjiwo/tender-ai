// Unit tests for Fase 5 — NUTS data, seed scripts, and postcode mapping

import { describe, it, expect } from 'vitest';
import { ALL_NUTS_CODES, NUTS_COUNT } from '../../scripts/nuts-data';
import type { NutsRecord } from '../../scripts/nuts-data';
import { ALL_POSTCODE_MAPPINGS } from '../../scripts/postcode-nuts-data';
import { extractPostcodePrefix } from '../../src/lib/utils/postcode-to-nuts';
import { NUTS_LEVELS, NUTS_LEVEL_LABELS } from '../../src/lib/types/enums';

// =============================================================================
// NUTS ENUMS
// =============================================================================

describe('NUTS level enum', () => {
	it('has exactly 4 levels', () => {
		expect(NUTS_LEVELS).toHaveLength(4);
	});

	it('contains levels 0-3', () => {
		expect(NUTS_LEVELS).toEqual([0, 1, 2, 3]);
	});

	it('has Dutch labels for all levels', () => {
		expect(NUTS_LEVEL_LABELS[0]).toBe('Land');
		expect(NUTS_LEVEL_LABELS[1]).toBe('Landsdeel');
		expect(NUTS_LEVEL_LABELS[2]).toBe('Provincie');
		expect(NUTS_LEVEL_LABELS[3]).toBe('COROP-gebied');
	});
});

// =============================================================================
// NUTS DATA INTEGRITY
// =============================================================================

describe('NUTS codes data', () => {
	it('has correct count per level', () => {
		expect(NUTS_COUNT.level0).toBe(1);
		expect(NUTS_COUNT.level1).toBe(4);
		expect(NUTS_COUNT.level2).toBe(12);
		expect(NUTS_COUNT.level3).toBeGreaterThanOrEqual(40);
	});

	it('total matches sum of levels', () => {
		const actual = ALL_NUTS_CODES.length;
		const sum = NUTS_COUNT.level0 + NUTS_COUNT.level1 +
			NUTS_COUNT.level2 + NUTS_COUNT.level3;
		expect(actual).toBe(sum);
		expect(actual).toBe(NUTS_COUNT.total);
	});

	it('all codes start with NL', () => {
		for (const code of ALL_NUTS_CODES) {
			expect(code.code).toMatch(/^NL/);
		}
	});

	it('level 0 has no parent', () => {
		const l0 = ALL_NUTS_CODES.filter((c) => c.level === 0);
		expect(l0).toHaveLength(1);
		expect(l0[0].parent_code).toBeNull();
	});

	it('level 1-3 codes all have a parent', () => {
		const children = ALL_NUTS_CODES.filter(
			(c) => c.level > 0
		);
		for (const child of children) {
			expect(child.parent_code).not.toBeNull();
		}
	});

	it('all parent references exist in the dataset', () => {
		const codeSet = new Set(
			ALL_NUTS_CODES.map((c) => c.code)
		);
		for (const record of ALL_NUTS_CODES) {
			if (record.parent_code) {
				expect(codeSet.has(record.parent_code)).toBe(true);
			}
		}
	});

	it('level 1 codes are NL1-NL4', () => {
		const l1 = ALL_NUTS_CODES
			.filter((c) => c.level === 1)
			.map((c) => c.code)
			.sort();
		expect(l1).toEqual(['NL1', 'NL2', 'NL3', 'NL4']);
	});

	it('level 2 codes are 12 provinces', () => {
		const l2 = ALL_NUTS_CODES.filter(
			(c) => c.level === 2
		);
		expect(l2).toHaveLength(12);
		const labels = l2.map((c) => c.label_nl);
		expect(labels).toContain('Groningen');
		expect(labels).toContain('Utrecht');
		expect(labels).toContain('Limburg');
	});

	it('has no duplicate codes', () => {
		const codes = ALL_NUTS_CODES.map((c) => c.code);
		expect(new Set(codes).size).toBe(codes.length);
	});

	it('all records have non-empty label_nl', () => {
		for (const code of ALL_NUTS_CODES) {
			expect(code.label_nl.length).toBeGreaterThan(0);
		}
	});
});

// =============================================================================
// POSTCODE MAPPING DATA
// =============================================================================

describe('Postcode-NUTS mapping data', () => {
	it('has a reasonable number of mappings', () => {
		expect(ALL_POSTCODE_MAPPINGS.length).toBeGreaterThan(100);
	});

	it('all prefixes are 4 digits', () => {
		for (const m of ALL_POSTCODE_MAPPINGS) {
			expect(m.postcode_prefix).toMatch(/^\d{4}$/);
		}
	});

	it('all nuts3_codes are valid NUTS3 references', () => {
		const nuts3Set = new Set(
			ALL_NUTS_CODES
				.filter((c) => c.level === 3)
				.map((c) => c.code)
		);
		for (const m of ALL_POSTCODE_MAPPINGS) {
			expect(nuts3Set.has(m.nuts3_code)).toBe(true);
		}
	});

	it('has no duplicate postcode prefixes', () => {
		const prefixes = ALL_POSTCODE_MAPPINGS.map(
			(m) => m.postcode_prefix
		);
		expect(new Set(prefixes).size).toBe(prefixes.length);
	});

	it('maps Amsterdam (1000) to Groot-Amsterdam', () => {
		const ams = ALL_POSTCODE_MAPPINGS.find(
			(m) => m.postcode_prefix === '1000'
		);
		expect(ams?.nuts3_code).toBe('NL326');
	});

	it('maps Rotterdam (3000) to Groot-Rijnmond', () => {
		const rtm = ALL_POSTCODE_MAPPINGS.find(
			(m) => m.postcode_prefix === '3000'
		);
		expect(rtm?.nuts3_code).toBe('NL33B');
	});

	it('maps Eindhoven (5600) to Zuidoost-Noord-Brabant', () => {
		const ehv = ALL_POSTCODE_MAPPINGS.find(
			(m) => m.postcode_prefix === '5600'
		);
		expect(ehv?.nuts3_code).toBe('NL414');
	});
});

// =============================================================================
// EXTRACT POSTCODE PREFIX
// =============================================================================

describe('extractPostcodePrefix', () => {
	it('extracts prefix from full postcode', () => {
		expect(extractPostcodePrefix('1234AB')).toBe('1234');
	});

	it('extracts prefix with space', () => {
		expect(extractPostcodePrefix('1234 AB')).toBe('1234');
	});

	it('extracts prefix from digits only', () => {
		expect(extractPostcodePrefix('5600')).toBe('5600');
	});

	it('trims whitespace', () => {
		expect(extractPostcodePrefix('  3500XY  ')).toBe('3500');
	});

	it('returns null for invalid postcode', () => {
		expect(extractPostcodePrefix('ABC')).toBeNull();
		expect(extractPostcodePrefix('')).toBeNull();
		expect(extractPostcodePrefix('12')).toBeNull();
	});
});

// =============================================================================
// SEED SCRIPT FILE STRUCTURE
// =============================================================================

describe('Seed scripts file structure', () => {
	it('seed-nuts-codes.ts imports from nuts-data', () => {
		const fs = require('fs');
		const path = require('path');
		const src = fs.readFileSync(
			path.resolve('scripts/seed-nuts-codes.ts'), 'utf-8'
		);
		expect(src).toContain('nuts-data');
		expect(src).toContain('@supabase/supabase-js');
		expect(src).toContain('SUPABASE_URL');
		expect(src).toContain('BATCH_SIZE');
		expect(src).toContain('parent_code: null');
	});

	it('seed-postcode-nuts.ts imports from postcode-nuts-data', () => {
		const fs = require('fs');
		const path = require('path');
		const src = fs.readFileSync(
			path.resolve('scripts/seed-postcode-nuts.ts'), 'utf-8'
		);
		expect(src).toContain('postcode-nuts-data');
		expect(src).toContain('@supabase/supabase-js');
		expect(src).toContain('BATCH_SIZE');
	});
});
