// Unit tests for Sprint R7 — Contract enums and type labels

import { describe, it, expect } from 'vitest';
import {
	CONTRACT_TYPES,
	CONTRACT_TYPE_LABELS,
	GENERAL_CONDITIONS_TYPES,
	GENERAL_CONDITIONS_LABELS,
	GENERAL_CONDITIONS_DESCRIPTIONS
} from '../../src/lib/types/enums';

describe('Contract types', () => {
	it('has exactly 3 types', () => {
		expect(CONTRACT_TYPES).toHaveLength(3);
	});

	it('contains diensten, leveringen, werken', () => {
		expect(CONTRACT_TYPES).toContain('diensten');
		expect(CONTRACT_TYPES).toContain('leveringen');
		expect(CONTRACT_TYPES).toContain('werken');
	});

	it('has Dutch labels for all types', () => {
		for (const t of CONTRACT_TYPES) {
			expect(CONTRACT_TYPE_LABELS[t]).toBeDefined();
			expect(typeof CONTRACT_TYPE_LABELS[t]).toBe('string');
			expect(CONTRACT_TYPE_LABELS[t].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(CONTRACT_TYPE_LABELS.diensten).toBe('Diensten');
		expect(CONTRACT_TYPE_LABELS.leveringen).toBe('Leveringen');
		expect(CONTRACT_TYPE_LABELS.werken).toBe('Werken');
	});
});

describe('General conditions types', () => {
	it('has exactly 6 types', () => {
		expect(GENERAL_CONDITIONS_TYPES).toHaveLength(6);
	});

	it('contains all expected conditions', () => {
		expect(GENERAL_CONDITIONS_TYPES).toContain('arvodi_2018');
		expect(GENERAL_CONDITIONS_TYPES).toContain('ariv_2018');
		expect(GENERAL_CONDITIONS_TYPES).toContain('uav_gc_2005');
		expect(GENERAL_CONDITIONS_TYPES).toContain('uav_2012');
		expect(GENERAL_CONDITIONS_TYPES).toContain('dnr_2011');
		expect(GENERAL_CONDITIONS_TYPES).toContain('custom');
	});

	it('has Dutch labels for all conditions', () => {
		for (const c of GENERAL_CONDITIONS_TYPES) {
			expect(GENERAL_CONDITIONS_LABELS[c]).toBeDefined();
			expect(typeof GENERAL_CONDITIONS_LABELS[c]).toBe('string');
			expect(GENERAL_CONDITIONS_LABELS[c].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(GENERAL_CONDITIONS_LABELS.arvodi_2018).toBe('ARVODI-2018');
		expect(GENERAL_CONDITIONS_LABELS.ariv_2018).toBe('ARIV-2018');
		expect(GENERAL_CONDITIONS_LABELS.uav_gc_2005).toBe('UAV-GC 2005');
		expect(GENERAL_CONDITIONS_LABELS.uav_2012).toBe('UAV 2012');
		expect(GENERAL_CONDITIONS_LABELS.dnr_2011).toBe('DNR 2011');
		expect(GENERAL_CONDITIONS_LABELS.custom).toBe('Eigen voorwaarden');
	});

	it('has Dutch descriptions for all conditions', () => {
		for (const c of GENERAL_CONDITIONS_TYPES) {
			expect(GENERAL_CONDITIONS_DESCRIPTIONS[c]).toBeDefined();
			expect(typeof GENERAL_CONDITIONS_DESCRIPTIONS[c]).toBe('string');
			expect(GENERAL_CONDITIONS_DESCRIPTIONS[c].length).toBeGreaterThan(0);
		}
	});

	it('descriptions mention the full name or context', () => {
		expect(GENERAL_CONDITIONS_DESCRIPTIONS.arvodi_2018).toContain('IT');
		expect(GENERAL_CONDITIONS_DESCRIPTIONS.ariv_2018).toContain('inkoop');
		expect(GENERAL_CONDITIONS_DESCRIPTIONS.uav_gc_2005).toContain('Geïntegreerde');
		expect(GENERAL_CONDITIONS_DESCRIPTIONS.uav_2012).toContain('werken');
		expect(GENERAL_CONDITIONS_DESCRIPTIONS.dnr_2011).toContain('architect');
		expect(GENERAL_CONDITIONS_DESCRIPTIONS.custom).toContain('Eigen');
	});
});
