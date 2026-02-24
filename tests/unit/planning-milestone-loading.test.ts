// Fase 109 — Unit tests for milestone loading logic
// Tests the initialized flag and calculateTimeline gating from PlanningMilestones.svelte:
// - Existing milestones (length > 0) should NOT trigger calculateTimeline
// - Empty milestones should trigger calculateTimeline exactly once
// - Tab-switch (re-render with same milestones) should NOT reset milestones

import { describe, it, expect, vi } from 'vitest';
import {
	calculateTimeline,
	type TimelineMilestone
} from '../../src/lib/utils/procurement-timeline';
import type { ProcedureType } from '../../src/lib/types/enums';

/**
 * Replicates the initialization logic from PlanningMilestones.svelte lines 29-35:
 *
 * let initialized = false;
 * $: hasValidInput = procedureType !== null && anchorDate !== '';
 * $: if (hasValidInput && !initialized && milestones.length === 0 && procedureType) {
 *     milestones = calculateTimeline(anchorDate, procedureType);
 *     initialized = true;
 *     onMilestonesChange?.(milestones);
 * }
 * $: if (milestones.length > 0) initialized = true;
 */
function simulateInitialization(
	anchorDate: string,
	procedureType: ProcedureType | null,
	existingMilestones: TimelineMilestone[],
	calcFn: typeof calculateTimeline
): { milestones: TimelineMilestone[]; calcCalled: boolean } {
	let initialized = false;
	let milestones = [...existingMilestones];
	let calcCalled = false;

	const hasValidInput = procedureType !== null && anchorDate !== '';

	// Reactive 1: milestones.length > 0 sets initialized
	if (milestones.length > 0) initialized = true;

	// Reactive 2: compute if needed
	if (hasValidInput && !initialized && milestones.length === 0 && procedureType) {
		milestones = calcFn(anchorDate, procedureType);
		initialized = true;
		calcCalled = true;
	}

	return { milestones, calcCalled };
}

describe('milestone loading — existing milestones prevent recalculation', () => {
	it('does NOT call calculateTimeline when milestones are pre-loaded', () => {
		const existing = calculateTimeline('2026-05-01', 'open');
		const mockCalc = vi.fn(calculateTimeline);

		const result = simulateInitialization('2026-05-01', 'open', existing, mockCalc);

		expect(mockCalc).not.toHaveBeenCalled();
		expect(result.calcCalled).toBe(false);
		expect(result.milestones).toEqual(existing);
	});

	it('does NOT call calculateTimeline for restricted with saved milestones', () => {
		const existing = calculateTimeline('2026-03-01', 'restricted');
		const mockCalc = vi.fn(calculateTimeline);

		const result = simulateInitialization('2026-03-01', 'restricted', existing, mockCalc);

		expect(mockCalc).not.toHaveBeenCalled();
		expect(result.milestones).toHaveLength(existing.length);
	});

	it('preserves existing milestone dates exactly', () => {
		const existing = calculateTimeline('2026-04-15', 'national_open');
		// Simulate manual edits to saved milestones
		existing[3].target_date = '2026-07-20';
		existing[3].source = 'manual';

		const mockCalc = vi.fn(calculateTimeline);
		const result = simulateInitialization('2026-04-15', 'national_open', existing, mockCalc);

		expect(result.milestones[3].target_date).toBe('2026-07-20');
		expect(result.milestones[3].source).toBe('manual');
	});
});

describe('milestone loading — empty milestones trigger calculation once', () => {
	it('calls calculateTimeline when milestones are empty', () => {
		const mockCalc = vi.fn(calculateTimeline);

		const result = simulateInitialization('2026-06-01', 'open', [], mockCalc);

		expect(mockCalc).toHaveBeenCalledTimes(1);
		expect(mockCalc).toHaveBeenCalledWith('2026-06-01', 'open');
		expect(result.milestones.length).toBeGreaterThan(0);
	});

	it('sets initialized after first calculation', () => {
		const mockCalc = vi.fn(calculateTimeline);

		const { milestones } = simulateInitialization('2026-06-01', 'open', [], mockCalc);
		// Second initialization with the calculated milestones should NOT trigger again
		const result2 = simulateInitialization('2026-06-01', 'open', milestones, mockCalc);

		// mockCalc was only called once (in the first run)
		expect(mockCalc).toHaveBeenCalledTimes(1);
		expect(result2.calcCalled).toBe(false);
	});

	it('does NOT calculate when procedureType is null', () => {
		const mockCalc = vi.fn(calculateTimeline);

		const result = simulateInitialization('2026-06-01', null, [], mockCalc);

		expect(mockCalc).not.toHaveBeenCalled();
		expect(result.milestones).toHaveLength(0);
	});

	it('does NOT calculate when anchorDate is empty', () => {
		const mockCalc = vi.fn(calculateTimeline);

		const result = simulateInitialization('', 'open', [], mockCalc);

		expect(mockCalc).not.toHaveBeenCalled();
		expect(result.milestones).toHaveLength(0);
	});
});

describe('milestone loading — tab-switch simulation', () => {
	it('milestones survive a simulated tab-switch (re-render)', () => {
		const existing = calculateTimeline('2026-03-15', 'open');
		const mockCalc = vi.fn(calculateTimeline);

		// First render: planning tab
		const render1 = simulateInitialization('2026-03-15', 'open', existing, mockCalc);
		// Second render: user switches to another tab and back
		const render2 = simulateInitialization('2026-03-15', 'open', render1.milestones, mockCalc);
		// Third render: another switch
		const render3 = simulateInitialization('2026-03-15', 'open', render2.milestones, mockCalc);

		expect(mockCalc).not.toHaveBeenCalled();
		expect(render3.milestones).toEqual(existing);
	});

	it('milestones with manual edits survive tab-switch', () => {
		const existing = calculateTimeline('2026-03-15', 'open');
		existing[5].target_date = '2026-09-01';
		existing[5].source = 'manual';

		const mockCalc = vi.fn(calculateTimeline);

		const render1 = simulateInitialization('2026-03-15', 'open', existing, mockCalc);
		const render2 = simulateInitialization('2026-03-15', 'open', render1.milestones, mockCalc);

		expect(render2.milestones[5].target_date).toBe('2026-09-01');
		expect(render2.milestones[5].source).toBe('manual');
		expect(mockCalc).not.toHaveBeenCalled();
	});

	it('even a single milestone prevents recalculation', () => {
		const single: TimelineMilestone[] = [{
			milestone_type: 'project_start',
			label: 'Projectstart',
			target_date: '2026-01-01',
			source: 'calculated',
			min_days_from_previous: 0,
			is_optional: false
		}];
		const mockCalc = vi.fn(calculateTimeline);

		const result = simulateInitialization('2026-01-01', 'open', single, mockCalc);

		expect(mockCalc).not.toHaveBeenCalled();
		expect(result.milestones).toHaveLength(1);
	});
});
