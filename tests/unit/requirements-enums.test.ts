// Unit tests for Sprint R5 — Requirements enums and type labels

import { describe, it, expect } from 'vitest';
import {
	REQUIREMENT_TYPES,
	REQUIREMENT_TYPE_LABELS,
	REQUIREMENT_TYPE_PREFIXES,
	REQUIREMENT_CATEGORIES,
	REQUIREMENT_CATEGORY_LABELS
} from '../../src/lib/types/enums';

describe('Requirement types', () => {
	it('has exactly 2 types', () => {
		expect(REQUIREMENT_TYPES).toHaveLength(2);
	});

	it('contains eis and wens', () => {
		expect(REQUIREMENT_TYPES).toContain('eis');
		expect(REQUIREMENT_TYPES).toContain('wens');
	});

	it('does NOT contain knockout or award_criterion (moved to EMVI)', () => {
		expect(REQUIREMENT_TYPES).not.toContain('knockout');
		expect(REQUIREMENT_TYPES).not.toContain('award_criterion');
	});

	it('has Dutch labels for all types', () => {
		for (const type of REQUIREMENT_TYPES) {
			expect(REQUIREMENT_TYPE_LABELS[type]).toBeDefined();
			expect(typeof REQUIREMENT_TYPE_LABELS[type]).toBe('string');
			expect(REQUIREMENT_TYPE_LABELS[type].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(REQUIREMENT_TYPE_LABELS.eis).toBe('Eis (Knock-out)');
		expect(REQUIREMENT_TYPE_LABELS.wens).toBe('Wens');
	});

	it('has prefixes for numbering for all types', () => {
		for (const type of REQUIREMENT_TYPES) {
			expect(REQUIREMENT_TYPE_PREFIXES[type]).toBeDefined();
			expect(typeof REQUIREMENT_TYPE_PREFIXES[type]).toBe('string');
		}
	});

	it('has correct prefixes', () => {
		expect(REQUIREMENT_TYPE_PREFIXES.eis).toBe('E');
		expect(REQUIREMENT_TYPE_PREFIXES.wens).toBe('W');
	});
});

describe('Requirement categories', () => {
	it('has exactly 5 categories', () => {
		expect(REQUIREMENT_CATEGORIES).toHaveLength(5);
	});

	it('contains all expected categories', () => {
		expect(REQUIREMENT_CATEGORIES).toContain('functional');
		expect(REQUIREMENT_CATEGORIES).toContain('technical');
		expect(REQUIREMENT_CATEGORIES).toContain('process');
		expect(REQUIREMENT_CATEGORIES).toContain('quality');
		expect(REQUIREMENT_CATEGORIES).toContain('sustainability');
	});

	it('has Dutch labels for all categories', () => {
		for (const cat of REQUIREMENT_CATEGORIES) {
			expect(REQUIREMENT_CATEGORY_LABELS[cat]).toBeDefined();
			expect(typeof REQUIREMENT_CATEGORY_LABELS[cat]).toBe('string');
			expect(REQUIREMENT_CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(REQUIREMENT_CATEGORY_LABELS.functional).toBe('Functioneel');
		expect(REQUIREMENT_CATEGORY_LABELS.technical).toBe('Technisch');
		expect(REQUIREMENT_CATEGORY_LABELS.process).toBe('Proces');
		expect(REQUIREMENT_CATEGORY_LABELS.quality).toBe('Kwaliteit');
		expect(REQUIREMENT_CATEGORY_LABELS.sustainability).toBe('Duurzaamheid');
	});
});
