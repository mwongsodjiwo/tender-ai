// Unit tests for Sprint R2 — Phase activity validation schemas

import { describe, it, expect } from 'vitest';
import {
	createPhaseActivitySchema,
	updatePhaseActivitySchema
} from '../../src/lib/server/api/validation';

describe('createPhaseActivitySchema', () => {
	it('accepts valid activity with required fields', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'preparing',
			activity_type: 'briefing',
			title: 'Briefing afnemen'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe('not_started');
			expect(result.data.description).toBe('');
			expect(result.data.sort_order).toBe(0);
		}
	});

	it('accepts all valid phases', () => {
		const phases = ['preparing', 'exploring', 'specifying', 'tendering', 'contracting'] as const;
		for (const phase of phases) {
			const result = createPhaseActivitySchema.safeParse({
				phase,
				activity_type: 'test',
				title: 'Test activiteit'
			});
			expect(result.success).toBe(true);
		}
	});

	it('rejects invalid phase', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'invalid_phase',
			activity_type: 'test',
			title: 'Test'
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing phase', () => {
		const result = createPhaseActivitySchema.safeParse({
			activity_type: 'test',
			title: 'Test'
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing activity_type', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'preparing',
			title: 'Test'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty activity_type', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'preparing',
			activity_type: '',
			title: 'Test'
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing title', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'preparing',
			activity_type: 'test'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty title', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'preparing',
			activity_type: 'test',
			title: ''
		});
		expect(result.success).toBe(false);
	});

	it('accepts all valid statuses', () => {
		const statuses = ['not_started', 'in_progress', 'completed', 'skipped'] as const;
		for (const status of statuses) {
			const result = createPhaseActivitySchema.safeParse({
				phase: 'preparing',
				activity_type: 'test',
				title: 'Test',
				status
			});
			expect(result.success).toBe(true);
		}
	});

	it('rejects invalid status', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'preparing',
			activity_type: 'test',
			title: 'Test',
			status: 'invalid_status'
		});
		expect(result.success).toBe(false);
	});

	it('defaults status to not_started', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'preparing',
			activity_type: 'test',
			title: 'Test'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe('not_started');
		}
	});

	it('accepts valid assigned_to UUID', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'preparing',
			activity_type: 'test',
			title: 'Test',
			assigned_to: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid assigned_to (not UUID)', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'preparing',
			activity_type: 'test',
			title: 'Test',
			assigned_to: 'not-a-uuid'
		});
		expect(result.success).toBe(false);
	});

	it('rejects negative sort_order', () => {
		const result = createPhaseActivitySchema.safeParse({
			phase: 'preparing',
			activity_type: 'test',
			title: 'Test',
			sort_order: -1
		});
		expect(result.success).toBe(false);
	});
});

describe('updatePhaseActivitySchema', () => {
	it('accepts empty object (all fields optional)', () => {
		const result = updatePhaseActivitySchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts partial update with status', () => {
		const result = updatePhaseActivitySchema.safeParse({
			status: 'completed'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid status in update', () => {
		const result = updatePhaseActivitySchema.safeParse({
			status: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('accepts null assigned_to (unassign)', () => {
		const result = updatePhaseActivitySchema.safeParse({
			assigned_to: null
		});
		expect(result.success).toBe(true);
	});

	it('accepts null due_date', () => {
		const result = updatePhaseActivitySchema.safeParse({
			due_date: null
		});
		expect(result.success).toBe(true);
	});

	it('accepts title update', () => {
		const result = updatePhaseActivitySchema.safeParse({
			title: 'Nieuwe titel'
		});
		expect(result.success).toBe(true);
	});

	it('rejects empty title in update', () => {
		const result = updatePhaseActivitySchema.safeParse({
			title: ''
		});
		expect(result.success).toBe(false);
	});
});
