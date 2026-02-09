// Sprint R12 — Evaluation type and enum tests
// Tests evaluation status flow, EMVI criterion types, scoring methodology types

import { describe, it, expect } from 'vitest';
import {
	EVALUATION_STATUSES,
	EVALUATION_STATUS_LABELS,
	SCORING_METHODOLOGIES,
	SCORING_METHODOLOGY_LABELS,
	SCORING_METHODOLOGY_DESCRIPTIONS,
	CRITERION_TYPES,
	CRITERION_TYPE_LABELS
} from '$types';
import type {
	EvaluationStatus,
	ScoringMethodology,
	CriterionType
} from '$types';

describe('Evaluation Status', () => {
	it('should have all expected statuses', () => {
		expect(EVALUATION_STATUSES).toContain('draft');
		expect(EVALUATION_STATUSES).toContain('scoring');
		expect(EVALUATION_STATUSES).toContain('completed');
		expect(EVALUATION_STATUSES).toContain('published');
		expect(EVALUATION_STATUSES).toHaveLength(4);
	});

	it('should have Dutch labels for all statuses', () => {
		expect(EVALUATION_STATUS_LABELS.draft).toBe('Concept');
		expect(EVALUATION_STATUS_LABELS.scoring).toBe('Beoordelen');
		expect(EVALUATION_STATUS_LABELS.completed).toBe('Afgerond');
		expect(EVALUATION_STATUS_LABELS.published).toBe('Gepubliceerd');
	});

	it('should have a label for every status', () => {
		for (const status of EVALUATION_STATUSES) {
			expect(EVALUATION_STATUS_LABELS[status]).toBeDefined();
			expect(EVALUATION_STATUS_LABELS[status].length).toBeGreaterThan(0);
		}
	});

	it('should follow the correct status flow', () => {
		const flow: EvaluationStatus[] = ['draft', 'scoring', 'completed', 'published'];
		// Statuses should be in logical order
		for (let i = 0; i < flow.length; i++) {
			expect(EVALUATION_STATUSES).toContain(flow[i]);
		}
		// Verify order matches
		expect([...EVALUATION_STATUSES]).toEqual(flow);
	});
});

describe('Scoring Methodology', () => {
	it('should have all expected methodologies', () => {
		expect(SCORING_METHODOLOGIES).toContain('lowest_price');
		expect(SCORING_METHODOLOGIES).toContain('emvi');
		expect(SCORING_METHODOLOGIES).toContain('best_price_quality');
		expect(SCORING_METHODOLOGIES).toHaveLength(3);
	});

	it('should have Dutch labels for all methodologies', () => {
		expect(SCORING_METHODOLOGY_LABELS.lowest_price).toBe('Laagste prijs');
		expect(SCORING_METHODOLOGY_LABELS.emvi).toBe('EMVI');
		expect(SCORING_METHODOLOGY_LABELS.best_price_quality).toBe('Beste prijs-kwaliteitverhouding');
	});

	it('should have descriptions for all methodologies', () => {
		for (const methodology of SCORING_METHODOLOGIES) {
			expect(SCORING_METHODOLOGY_DESCRIPTIONS[methodology]).toBeDefined();
			expect(SCORING_METHODOLOGY_DESCRIPTIONS[methodology].length).toBeGreaterThan(10);
		}
	});

	it('should have a label for every methodology', () => {
		for (const methodology of SCORING_METHODOLOGIES) {
			expect(SCORING_METHODOLOGY_LABELS[methodology]).toBeDefined();
		}
	});
});

describe('Criterion Types', () => {
	it('should have price and quality types', () => {
		expect(CRITERION_TYPES).toContain('price');
		expect(CRITERION_TYPES).toContain('quality');
		expect(CRITERION_TYPES).toHaveLength(2);
	});

	it('should have Dutch labels', () => {
		expect(CRITERION_TYPE_LABELS.price).toBe('Prijs');
		expect(CRITERION_TYPE_LABELS.quality).toBe('Kwaliteit');
	});

	it('should have a label for every type', () => {
		for (const type of CRITERION_TYPES) {
			expect(CRITERION_TYPE_LABELS[type]).toBeDefined();
		}
	});
});

describe('Type safety', () => {
	it('should enforce EvaluationStatus type', () => {
		const validStatus: EvaluationStatus = 'scoring';
		expect(EVALUATION_STATUSES).toContain(validStatus);
	});

	it('should enforce ScoringMethodology type', () => {
		const validMethodology: ScoringMethodology = 'emvi';
		expect(SCORING_METHODOLOGIES).toContain(validMethodology);
	});

	it('should enforce CriterionType type', () => {
		const validType: CriterionType = 'quality';
		expect(CRITERION_TYPES).toContain(validType);
	});
});
