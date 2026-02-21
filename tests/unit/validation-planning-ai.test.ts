// Fase 54 — Zod validation tests: AI planning schemas

import { describe, it, expect } from 'vitest';
import {
	generatePlanningSchema,
	applyPlanningSchema
} from '../../src/lib/server/api/validation';

describe('generatePlanningSchema', () => {
	it('accepts valid planning generation request', () => {
		const result = generatePlanningSchema.safeParse({
			target_start_date: '2025-03-01',
			target_end_date: '2025-09-01'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (all optional with defaults)', () => {
		const result = generatePlanningSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects invalid date format', () => {
		const result = generatePlanningSchema.safeParse({
			target_start_date: 'maart 2025'
		});
		expect(result.success).toBe(false);
	});

	it('applies default preferences', () => {
		const result = generatePlanningSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.preferences).toBeDefined();
			expect(result.data.preferences?.buffer_days).toBe(5);
		}
	});

	it('accepts nullable dates', () => {
		const result = generatePlanningSchema.safeParse({
			target_start_date: null,
			target_end_date: null
		});
		expect(result.success).toBe(true);
	});

	it('rejects buffer_days above max', () => {
		const result = generatePlanningSchema.safeParse({
			preferences: { buffer_days: 50 }
		});
		expect(result.success).toBe(false);
	});
});

describe('applyPlanningSchema', () => {
	const validPlanning = {
		phases: [{
			phase: 'preparing',
			start_date: '2025-03-01',
			end_date: '2025-04-01',
			activities: [{
				title: 'Briefing',
				description: 'Project briefing',
				activity_type: 'preparing',
				planned_start: '2025-03-01',
				planned_end: '2025-03-15',
				estimated_hours: 20,
				assigned_role: 'project_leader'
			}],
			milestones: [{
				milestone_type: 'phase_start',
				title: 'Start voorbereiding',
				target_date: '2025-03-01',
				is_critical: true
			}]
		}],
		dependencies: [{
			from_title: 'Briefing',
			to_title: 'Onderzoek',
			type: 'finish_to_start',
			lag_days: 0
		}],
		total_duration_days: 30,
		total_estimated_hours: 20
	};

	it('accepts valid planning application', () => {
		const result = applyPlanningSchema.safeParse({
			planning: validPlanning
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing planning object', () => {
		const result = applyPlanningSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects planning with missing phases', () => {
		const result = applyPlanningSchema.safeParse({
			planning: {
				...validPlanning,
				phases: undefined
			}
		});
		expect(result.success).toBe(false);
	});

	it('rejects wrong type for total_duration_days', () => {
		const result = applyPlanningSchema.safeParse({
			planning: {
				...validPlanning,
				total_duration_days: 'dertig'
			}
		});
		expect(result.success).toBe(false);
	});

	it('defaults clear_existing to false', () => {
		const result = applyPlanningSchema.safeParse({
			planning: validPlanning
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.clear_existing).toBe(false);
		}
	});
});
