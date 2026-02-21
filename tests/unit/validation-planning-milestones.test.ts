// Fase 54 — Zod validation tests: milestone & dependency schemas

import { describe, it, expect } from 'vitest';
import {
	createMilestoneSchema,
	updateMilestoneSchema,
	createDependencySchema,
	workloadQuerySchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('createMilestoneSchema', () => {
	it('accepts valid milestone', () => {
		const result = createMilestoneSchema.safeParse({
			milestone_type: 'publication',
			title: 'Publicatiedatum',
			target_date: '2025-06-01'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing title', () => {
		const result = createMilestoneSchema.safeParse({
			milestone_type: 'publication',
			target_date: '2025-06-01'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid date format', () => {
		const result = createMilestoneSchema.safeParse({
			milestone_type: 'publication',
			title: 'Publicatie',
			target_date: '01-06-2025'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid milestone_type', () => {
		const result = createMilestoneSchema.safeParse({
			milestone_type: 'nonexistent_type',
			title: 'Test',
			target_date: '2025-06-01'
		});
		expect(result.success).toBe(false);
	});

	it('accepts optional fields with defaults', () => {
		const result = createMilestoneSchema.safeParse({
			milestone_type: 'custom',
			title: 'Aangepast',
			target_date: '2025-12-31',
			is_critical: true,
			phase: 'tendering'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.is_critical).toBe(true);
		}
	});
});

describe('updateMilestoneSchema', () => {
	it('accepts partial update', () => {
		const result = updateMilestoneSchema.safeParse({
			title: 'Nieuwe titel'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (all optional)', () => {
		const result = updateMilestoneSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects title exceeding max length', () => {
		const result = updateMilestoneSchema.safeParse({
			title: 'x'.repeat(301)
		});
		expect(result.success).toBe(false);
	});

	it('accepts nullable actual_date', () => {
		const result = updateMilestoneSchema.safeParse({
			actual_date: null
		});
		expect(result.success).toBe(true);
	});
});

describe('createDependencySchema', () => {
	it('accepts valid dependency', () => {
		const result = createDependencySchema.safeParse({
			source_type: 'activity',
			source_id: VALID_UUID,
			target_type: 'milestone',
			target_id: VALID_UUID
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing source_id', () => {
		const result = createDependencySchema.safeParse({
			source_type: 'activity',
			target_type: 'milestone',
			target_id: VALID_UUID
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid source_type', () => {
		const result = createDependencySchema.safeParse({
			source_type: 'task',
			source_id: VALID_UUID,
			target_type: 'milestone',
			target_id: VALID_UUID
		});
		expect(result.success).toBe(false);
	});

	it('accepts lag_days within bounds', () => {
		const result = createDependencySchema.safeParse({
			source_type: 'activity',
			source_id: VALID_UUID,
			target_type: 'activity',
			target_id: VALID_UUID,
			lag_days: -10
		});
		expect(result.success).toBe(true);
	});

	it('rejects lag_days exceeding 365', () => {
		const result = createDependencySchema.safeParse({
			source_type: 'activity',
			source_id: VALID_UUID,
			target_type: 'activity',
			target_id: VALID_UUID,
			lag_days: 400
		});
		expect(result.success).toBe(false);
	});
});

describe('workloadQuerySchema', () => {
	it('accepts valid date range', () => {
		const result = workloadQuerySchema.safeParse({
			from: '2025-01-01',
			to: '2025-12-31'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object', () => {
		const result = workloadQuerySchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects invalid date format', () => {
		const result = workloadQuerySchema.safeParse({
			from: '2025/01/01'
		});
		expect(result.success).toBe(false);
	});

	it('rejects from after to (refinement)', () => {
		const result = workloadQuerySchema.safeParse({
			from: '2025-12-31',
			to: '2025-01-01'
		});
		expect(result.success).toBe(false);
	});
});
