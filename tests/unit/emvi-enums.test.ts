// Unit tests for Sprint R6 — EMVI enums and type labels

import { describe, it, expect } from 'vitest';
import {
	SCORING_METHODOLOGIES,
	SCORING_METHODOLOGY_LABELS,
	SCORING_METHODOLOGY_DESCRIPTIONS,
	CRITERION_TYPES,
	CRITERION_TYPE_LABELS
} from '../../src/lib/types/enums';

describe('Scoring methodologies', () => {
	it('has exactly 3 methodologies', () => {
		expect(SCORING_METHODOLOGIES).toHaveLength(3);
	});

	it('contains lowest_price, emvi, best_price_quality', () => {
		expect(SCORING_METHODOLOGIES).toContain('lowest_price');
		expect(SCORING_METHODOLOGIES).toContain('emvi');
		expect(SCORING_METHODOLOGIES).toContain('best_price_quality');
	});

	it('has Dutch labels for all methodologies', () => {
		for (const m of SCORING_METHODOLOGIES) {
			expect(SCORING_METHODOLOGY_LABELS[m]).toBeDefined();
			expect(typeof SCORING_METHODOLOGY_LABELS[m]).toBe('string');
			expect(SCORING_METHODOLOGY_LABELS[m].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(SCORING_METHODOLOGY_LABELS.lowest_price).toBe('Laagste prijs');
		expect(SCORING_METHODOLOGY_LABELS.emvi).toBe('EMVI');
		expect(SCORING_METHODOLOGY_LABELS.best_price_quality).toBe('Beste prijs-kwaliteitverhouding');
	});

	it('has Dutch descriptions for all methodologies', () => {
		for (const m of SCORING_METHODOLOGIES) {
			expect(SCORING_METHODOLOGY_DESCRIPTIONS[m]).toBeDefined();
			expect(typeof SCORING_METHODOLOGY_DESCRIPTIONS[m]).toBe('string');
			expect(SCORING_METHODOLOGY_DESCRIPTIONS[m].length).toBeGreaterThan(0);
		}
	});
});

describe('Criterion types', () => {
	it('has exactly 2 types', () => {
		expect(CRITERION_TYPES).toHaveLength(2);
	});

	it('contains price and quality', () => {
		expect(CRITERION_TYPES).toContain('price');
		expect(CRITERION_TYPES).toContain('quality');
	});

	it('has Dutch labels for all types', () => {
		for (const t of CRITERION_TYPES) {
			expect(CRITERION_TYPE_LABELS[t]).toBeDefined();
			expect(typeof CRITERION_TYPE_LABELS[t]).toBe('string');
			expect(CRITERION_TYPE_LABELS[t].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(CRITERION_TYPE_LABELS.price).toBe('Prijs');
		expect(CRITERION_TYPE_LABELS.quality).toBe('Kwaliteit');
	});
});
