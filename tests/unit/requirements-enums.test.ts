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
	it('has exactly 3 types', () => {
		expect(REQUIREMENT_TYPES).toHaveLength(3);
	});

	it('contains knockout, award_criterion, wish', () => {
		expect(REQUIREMENT_TYPES).toContain('knockout');
		expect(REQUIREMENT_TYPES).toContain('award_criterion');
		expect(REQUIREMENT_TYPES).toContain('wish');
	});

	it('has Dutch labels for all types', () => {
		for (const type of REQUIREMENT_TYPES) {
			expect(REQUIREMENT_TYPE_LABELS[type]).toBeDefined();
			expect(typeof REQUIREMENT_TYPE_LABELS[type]).toBe('string');
			expect(REQUIREMENT_TYPE_LABELS[type].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(REQUIREMENT_TYPE_LABELS.knockout).toBe('Knock-out');
		expect(REQUIREMENT_TYPE_LABELS.award_criterion).toBe('Gunningscriterium');
		expect(REQUIREMENT_TYPE_LABELS.wish).toBe('Wens');
	});

	it('has prefixes for numbering for all types', () => {
		for (const type of REQUIREMENT_TYPES) {
			expect(REQUIREMENT_TYPE_PREFIXES[type]).toBeDefined();
			expect(typeof REQUIREMENT_TYPE_PREFIXES[type]).toBe('string');
		}
	});

	it('has correct prefixes', () => {
		expect(REQUIREMENT_TYPE_PREFIXES.knockout).toBe('KO');
		expect(REQUIREMENT_TYPE_PREFIXES.award_criterion).toBe('G');
		expect(REQUIREMENT_TYPE_PREFIXES.wish).toBe('W');
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
