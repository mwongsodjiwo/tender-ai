// Unit tests for Fase 4 — CPV import script (parsing and transformation)

import { describe, it, expect } from 'vitest';
import {
	divisionToCategory,
	parseCpvCode,
	findParentCode,
	transformRows
} from '../../scripts/cpv-parser';
import type { RawRow } from '../../scripts/cpv-parser';

// =============================================================================
// divisionToCategory
// =============================================================================

describe('divisionToCategory', () => {
	it('maps division 45 to werken', () => {
		expect(divisionToCategory('45')).toBe('werken');
	});

	it('maps divisions 03-44 to leveringen', () => {
		expect(divisionToCategory('03')).toBe('leveringen');
		expect(divisionToCategory('15')).toBe('leveringen');
		expect(divisionToCategory('44')).toBe('leveringen');
	});

	it('maps divisions 48-49 to leveringen', () => {
		expect(divisionToCategory('48')).toBe('leveringen');
		expect(divisionToCategory('49')).toBe('leveringen');
	});

	it('maps divisions 50-98 to diensten', () => {
		expect(divisionToCategory('50')).toBe('diensten');
		expect(divisionToCategory('72')).toBe('diensten');
		expect(divisionToCategory('98')).toBe('diensten');
	});
});

// =============================================================================
// parseCpvCode
// =============================================================================

describe('parseCpvCode', () => {
	it('parses a division-level code', () => {
		const result = parseCpvCode('45000000-7');
		expect(result).toEqual({
			code: '45000000-7',
			division: '45',
			group: null,
			classCode: null
		});
	});

	it('parses a group-level code', () => {
		const result = parseCpvCode('45200000-9');
		expect(result?.group).toBe('452');
		expect(result?.classCode).toBeNull();
	});

	it('parses a class-level code', () => {
		const result = parseCpvCode('45210000-2');
		expect(result?.group).toBe('452');
		expect(result?.classCode).toBe('4521');
	});

	it('returns null for invalid code format', () => {
		expect(parseCpvCode('invalid')).toBeNull();
		expect(parseCpvCode('1234')).toBeNull();
		expect(parseCpvCode('')).toBeNull();
	});
});

// =============================================================================
// findParentCode
// =============================================================================

describe('findParentCode', () => {
	it('returns null for division-level code', () => {
		expect(findParentCode('45000000-7')).toBeNull();
	});

	it('finds parent for group-level code', () => {
		expect(findParentCode('45200000-9')).toBe('45000000');
	});

	it('finds parent for class-level code', () => {
		expect(findParentCode('45210000-2')).toBe('45200000');
	});

	it('finds parent for detailed code', () => {
		expect(findParentCode('45213000-3')).toBe('45210000');
	});

	it('finds parent for leaf code', () => {
		expect(findParentCode('45213316-1')).toBe('45213310');
	});
});

// =============================================================================
// transformRows
// =============================================================================

describe('transformRows', () => {
	const ROWS: RawRow[] = [
		{ CODE: '45000000-7', Omschrijving: 'Bouwwerkzaamheden' },
		{ CODE: '45200000-9', Omschrijving: 'Bouwwerkzaamheden voor gebouwen' },
		{ CODE: '45210000-2', Omschrijving: 'Bouwen van gebouwen' },
		{ CODE: '72000000-5', Omschrijving: 'IT-diensten' },
		{ CODE: '03000000-1', Omschrijving: 'Landbouwproducten' }
	];

	it('transforms all valid rows', () => {
		expect(transformRows(ROWS)).toHaveLength(5);
	});

	it('sets correct category_type', () => {
		const result = transformRows(ROWS);
		expect(result.find((r) => r.code === '45000000-7')?.category_type).toBe('werken');
		expect(result.find((r) => r.code === '72000000-5')?.category_type).toBe('diensten');
		expect(result.find((r) => r.code === '03000000-1')?.category_type).toBe('leveringen');
	});

	it('sets parent_code for child codes', () => {
		const result = transformRows(ROWS);
		expect(result.find((r) => r.code === '45200000-9')?.parent_code).toBe('45000000-7');
		expect(result.find((r) => r.code === '45210000-2')?.parent_code).toBe('45200000-9');
	});

	it('sets null parent for division-level codes', () => {
		const result = transformRows(ROWS);
		expect(result.find((r) => r.code === '45000000-7')?.parent_code).toBeNull();
	});

	it('extracts division and group_code correctly', () => {
		const result = transformRows(ROWS);
		expect(result.find((r) => r.code === '72000000-5')?.division).toBe('72');
		expect(result.find((r) => r.code === '45200000-9')?.group_code).toBe('452');
		expect(result.find((r) => r.code === '45000000-7')?.group_code).toBeNull();
	});

	it('skips rows with missing CODE or Omschrijving', () => {
		const rows: RawRow[] = [
			{ CODE: '', Omschrijving: 'Test' },
			{ CODE: '45000000-7', Omschrijving: '' },
			{ CODE: '72000000-5', Omschrijving: 'IT-diensten' }
		];
		expect(transformRows(rows)).toHaveLength(1);
	});

	it('trims whitespace from description', () => {
		const rows: RawRow[] = [
			{ CODE: '45000000-7', Omschrijving: '  Bouwwerkzaamheden  ' }
		];
		expect(transformRows(rows)[0].description_nl).toBe('Bouwwerkzaamheden');
	});
});

// =============================================================================
// EXCEL FILE EXISTS
// =============================================================================

describe('Excel file', () => {
	it('cpv codes Excel file exists in project root', () => {
		const fs = require('fs');
		const path = require('path');
		const filePath = path.resolve('overzicht_cpv_codes_simap (1).xlsx');
		expect(fs.existsSync(filePath)).toBe(true);
	});
});
