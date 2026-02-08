// Unit tests for Sprint R5 — Requirements (PvE eisenmanager) validation schemas

import { describe, it, expect } from 'vitest';
import {
	createRequirementSchema,
	updateRequirementSchema,
	reorderRequirementsSchema,
	generateRequirementsSchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('createRequirementSchema', () => {
	it('accepts a valid knockout requirement', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Inschrijver beschikt over ISO 9001 certificering',
			description: 'De inschrijver dient te beschikken over een geldig ISO 9001:2015 certificaat.',
			requirement_type: 'knockout',
			category: 'quality',
			priority: 5
		});
		expect(result.success).toBe(true);
	});

	it('accepts a valid award criterion with weight', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Plan van aanpak',
			description: 'Beoordeling op basis van het ingediende plan van aanpak.',
			requirement_type: 'award_criterion',
			category: 'process',
			weight_percentage: 30,
			priority: 4
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.weight_percentage).toBe(30);
		}
	});

	it('accepts a valid wish requirement', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Social Return on Investment',
			requirement_type: 'wish',
			category: 'sustainability',
			priority: 2
		});
		expect(result.success).toBe(true);
	});

	it('applies default values for optional fields', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Basis eis',
			requirement_type: 'knockout',
			category: 'functional'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBe('');
			expect(result.data.weight_percentage).toBe(0);
			expect(result.data.priority).toBe(3);
		}
	});

	it('rejects missing title', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			requirement_type: 'knockout',
			category: 'functional'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid requirement_type', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Test',
			requirement_type: 'invalid_type',
			category: 'functional'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid category', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Test',
			requirement_type: 'knockout',
			category: 'invalid_category'
		});
		expect(result.success).toBe(false);
	});

	it('rejects weight_percentage above 100', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Test',
			requirement_type: 'award_criterion',
			category: 'functional',
			weight_percentage: 150
		});
		expect(result.success).toBe(false);
	});

	it('rejects weight_percentage below 0', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Test',
			requirement_type: 'award_criterion',
			category: 'functional',
			weight_percentage: -5
		});
		expect(result.success).toBe(false);
	});

	it('rejects priority below 1', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Test',
			requirement_type: 'knockout',
			category: 'functional',
			priority: 0
		});
		expect(result.success).toBe(false);
	});

	it('rejects priority above 5', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Test',
			requirement_type: 'knockout',
			category: 'functional',
			priority: 6
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid document_type_id', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: 'not-a-uuid',
			title: 'Test',
			requirement_type: 'knockout',
			category: 'functional'
		});
		expect(result.success).toBe(false);
	});

	it('accepts all valid requirement types', () => {
		const types = ['knockout', 'award_criterion', 'wish'];
		for (const type of types) {
			const result = createRequirementSchema.safeParse({
				document_type_id: VALID_UUID,
				title: `Test ${type}`,
				requirement_type: type,
				category: 'functional'
			});
			expect(result.success).toBe(true);
		}
	});

	it('accepts all valid categories', () => {
		const categories = ['functional', 'technical', 'process', 'quality', 'sustainability'];
		for (const category of categories) {
			const result = createRequirementSchema.safeParse({
				document_type_id: VALID_UUID,
				title: `Test ${category}`,
				requirement_type: 'knockout',
				category
			});
			expect(result.success).toBe(true);
		}
	});

	it('rejects title longer than 500 characters', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'a'.repeat(501),
			requirement_type: 'knockout',
			category: 'functional'
		});
		expect(result.success).toBe(false);
	});

	it('rejects description longer than 5000 characters', () => {
		const result = createRequirementSchema.safeParse({
			document_type_id: VALID_UUID,
			title: 'Test',
			description: 'a'.repeat(5001),
			requirement_type: 'knockout',
			category: 'functional'
		});
		expect(result.success).toBe(false);
	});
});

describe('updateRequirementSchema', () => {
	it('accepts partial update with title only', () => {
		const result = updateRequirementSchema.safeParse({
			title: 'Bijgewerkte titel'
		});
		expect(result.success).toBe(true);
	});

	it('accepts partial update with weight and priority', () => {
		const result = updateRequirementSchema.safeParse({
			weight_percentage: 25,
			priority: 4
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (no updates)', () => {
		const result = updateRequirementSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects invalid weight_percentage', () => {
		const result = updateRequirementSchema.safeParse({
			weight_percentage: 200
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid priority', () => {
		const result = updateRequirementSchema.safeParse({
			priority: 10
		});
		expect(result.success).toBe(false);
	});

	it('accepts category change', () => {
		const result = updateRequirementSchema.safeParse({
			category: 'technical'
		});
		expect(result.success).toBe(true);
	});

	it('accepts requirement_type change', () => {
		const result = updateRequirementSchema.safeParse({
			requirement_type: 'wish'
		});
		expect(result.success).toBe(true);
	});
});

describe('reorderRequirementsSchema', () => {
	it('accepts valid ordered IDs', () => {
		const result = reorderRequirementsSchema.safeParse({
			ordered_ids: [
				'550e8400-e29b-41d4-a716-446655440001',
				'550e8400-e29b-41d4-a716-446655440002',
				'550e8400-e29b-41d4-a716-446655440003'
			]
		});
		expect(result.success).toBe(true);
	});

	it('rejects empty array', () => {
		const result = reorderRequirementsSchema.safeParse({
			ordered_ids: []
		});
		expect(result.success).toBe(false);
	});

	it('rejects non-UUID strings', () => {
		const result = reorderRequirementsSchema.safeParse({
			ordered_ids: ['not-a-uuid']
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing ordered_ids', () => {
		const result = reorderRequirementsSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

describe('generateRequirementsSchema', () => {
	it('accepts valid document_type_id', () => {
		const result = generateRequirementsSchema.safeParse({
			document_type_id: VALID_UUID
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid document_type_id', () => {
		const result = generateRequirementsSchema.safeParse({
			document_type_id: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing document_type_id', () => {
		const result = generateRequirementsSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});
