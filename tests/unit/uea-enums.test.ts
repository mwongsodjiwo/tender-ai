// Unit tests for Sprint R8 — UEA enums and type labels

import { describe, it, expect } from 'vitest';
import {
	UEA_PARTS,
	UEA_PART_TITLES,
	UEA_PART_ROMAN
} from '../../src/lib/types/enums';

describe('UEA parts', () => {
	it('has exactly 3 parts', () => {
		expect(UEA_PARTS).toHaveLength(3);
	});

	it('contains parts 2, 3, and 4', () => {
		expect(UEA_PARTS).toContain(2);
		expect(UEA_PARTS).toContain(3);
		expect(UEA_PARTS).toContain(4);
	});

	it('has Dutch titles for all parts', () => {
		for (const part of UEA_PARTS) {
			expect(UEA_PART_TITLES[part]).toBeDefined();
			expect(typeof UEA_PART_TITLES[part]).toBe('string');
			expect(UEA_PART_TITLES[part].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch titles', () => {
		expect(UEA_PART_TITLES[2]).toBe('Informatie over de ondernemer');
		expect(UEA_PART_TITLES[3]).toBe('Uitsluitingsgronden');
		expect(UEA_PART_TITLES[4]).toBe('Selectiecriteria');
	});

	it('has Roman numerals for all parts', () => {
		for (const part of UEA_PARTS) {
			expect(UEA_PART_ROMAN[part]).toBeDefined();
			expect(typeof UEA_PART_ROMAN[part]).toBe('string');
		}
	});

	it('has correct Roman numerals', () => {
		expect(UEA_PART_ROMAN[2]).toBe('II');
		expect(UEA_PART_ROMAN[3]).toBe('III');
		expect(UEA_PART_ROMAN[4]).toBe('IV');
	});
});
