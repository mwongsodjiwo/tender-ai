// Unit tests for Sprint R6 — EMVI validation schemas

import { describe, it, expect } from 'vitest';
import {
	updateScoringMethodologySchema,
	createEmviCriterionSchema,
	updateEmviCriterionSchema
} from '../../src/lib/server/api/validation';

describe('updateScoringMethodologySchema', () => {
	it('accepts lowest_price', () => {
		const result = updateScoringMethodologySchema.safeParse({
			scoring_methodology: 'lowest_price'
		});
		expect(result.success).toBe(true);
	});

	it('accepts emvi', () => {
		const result = updateScoringMethodologySchema.safeParse({
			scoring_methodology: 'emvi'
		});
		expect(result.success).toBe(true);
	});

	it('accepts best_price_quality', () => {
		const result = updateScoringMethodologySchema.safeParse({
			scoring_methodology: 'best_price_quality'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid methodology', () => {
		const result = updateScoringMethodologySchema.safeParse({
			scoring_methodology: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing methodology', () => {
		const result = updateScoringMethodologySchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

describe('createEmviCriterionSchema', () => {
	it('accepts a valid price criterion', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Inschrijvingsprijs',
			description: 'De totale prijs van de inschrijving.',
			criterion_type: 'price',
			weight_percentage: 40
		});
		expect(result.success).toBe(true);
	});

	it('accepts a valid quality criterion', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Plan van Aanpak',
			description: 'Beoordeling op basis van het ingediende plan van aanpak.',
			criterion_type: 'quality',
			weight_percentage: 30
		});
		expect(result.success).toBe(true);
	});

	it('applies default values for optional fields', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Test criterium',
			criterion_type: 'quality',
			weight_percentage: 20
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBe('');
		}
	});

	it('rejects missing name', () => {
		const result = createEmviCriterionSchema.safeParse({
			criterion_type: 'quality',
			weight_percentage: 20
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty name', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: '',
			criterion_type: 'quality',
			weight_percentage: 20
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing criterion_type', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Test',
			weight_percentage: 20
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid criterion_type', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Test',
			criterion_type: 'invalid',
			weight_percentage: 20
		});
		expect(result.success).toBe(false);
	});

	it('rejects weight_percentage above 100', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Test',
			criterion_type: 'quality',
			weight_percentage: 150
		});
		expect(result.success).toBe(false);
	});

	it('rejects weight_percentage below 0', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Test',
			criterion_type: 'quality',
			weight_percentage: -5
		});
		expect(result.success).toBe(false);
	});

	it('accepts weight_percentage of 0', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Test',
			criterion_type: 'quality',
			weight_percentage: 0
		});
		expect(result.success).toBe(true);
	});

	it('accepts weight_percentage of 100', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Test',
			criterion_type: 'quality',
			weight_percentage: 100
		});
		expect(result.success).toBe(true);
	});

	it('rejects name longer than 300 characters', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'a'.repeat(301),
			criterion_type: 'quality',
			weight_percentage: 20
		});
		expect(result.success).toBe(false);
	});

	it('rejects description longer than 5000 characters', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Test',
			description: 'a'.repeat(5001),
			criterion_type: 'quality',
			weight_percentage: 20
		});
		expect(result.success).toBe(false);
	});

	it('accepts all valid criterion types', () => {
		const types = ['price', 'quality'];
		for (const type of types) {
			const result = createEmviCriterionSchema.safeParse({
				name: `Test ${type}`,
				criterion_type: type,
				weight_percentage: 50
			});
			expect(result.success).toBe(true);
		}
	});

	it('accepts optional sort_order', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Test',
			criterion_type: 'quality',
			weight_percentage: 20,
			sort_order: 5
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.sort_order).toBe(5);
		}
	});

	it('rejects negative sort_order', () => {
		const result = createEmviCriterionSchema.safeParse({
			name: 'Test',
			criterion_type: 'quality',
			weight_percentage: 20,
			sort_order: -1
		});
		expect(result.success).toBe(false);
	});
});

describe('updateEmviCriterionSchema', () => {
	it('accepts partial update with name only', () => {
		const result = updateEmviCriterionSchema.safeParse({
			name: 'Bijgewerkt criterium'
		});
		expect(result.success).toBe(true);
	});

	it('accepts partial update with weight only', () => {
		const result = updateEmviCriterionSchema.safeParse({
			weight_percentage: 35
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (no updates)', () => {
		const result = updateEmviCriterionSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects invalid weight_percentage', () => {
		const result = updateEmviCriterionSchema.safeParse({
			weight_percentage: 200
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid criterion_type', () => {
		const result = updateEmviCriterionSchema.safeParse({
			criterion_type: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('accepts criterion_type change', () => {
		const result = updateEmviCriterionSchema.safeParse({
			criterion_type: 'price'
		});
		expect(result.success).toBe(true);
	});

	it('accepts multiple field updates', () => {
		const result = updateEmviCriterionSchema.safeParse({
			name: 'Updated',
			weight_percentage: 25,
			criterion_type: 'quality',
			description: 'Updated description'
		});
		expect(result.success).toBe(true);
	});
});
