// Fase 109 — Integration test for planning tab flow
// Simulates the full user flow through the planning tab:
// 1. Open planning tab with saved milestones — dates are correct
// 2. Enter edit mode — dates do NOT change
// 3. Change a date — cascade warning appears
// 4. Click undo — milestones revert to previous state

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	calculateTimeline,
	cascadeDates,
	type TimelineMilestone
} from '../../src/lib/utils/procurement-timeline';
import {
	computeChangedMilestones,
	formatDateNl,
	type ChangedMilestone
} from '../../src/lib/utils/milestone-display';
import type { ProcedureType } from '../../src/lib/types/enums';

// =============================================================================
// Helpers to simulate the PlanningMilestones component state machine
// =============================================================================

interface ComponentState {
	milestones: TimelineMilestone[];
	initialized: boolean;
	disabled: boolean;
	prevMs: TimelineMilestone[] | null;
	showWarn: boolean;
	warnChanges: ChangedMilestone[];
	warnMessage: string | null;
	warnTimer: ReturnType<typeof setTimeout> | null;
	milestonesChangedCount: number;
}

function createComponentState(
	milestones: TimelineMilestone[],
	disabled: boolean
): ComponentState {
	return {
		milestones: [...milestones],
		initialized: milestones.length > 0,
		disabled,
		prevMs: null,
		showWarn: false,
		warnChanges: [],
		warnMessage: null,
		warnTimer: null,
		milestonesChangedCount: 0
	};
}

function initializeIfNeeded(
	state: ComponentState,
	anchorDate: string,
	procedureType: ProcedureType | null
): void {
	const hasValidInput = procedureType !== null && anchorDate !== '';
	if (state.milestones.length > 0) state.initialized = true;
	if (hasValidInput && !state.initialized && state.milestones.length === 0 && procedureType) {
		state.milestones = calculateTimeline(anchorDate, procedureType);
		state.initialized = true;
		state.milestonesChangedCount++;
	}
}

function handleDateChange(state: ComponentState, index: number, newDate: string): void {
	if (!newDate) return;
	state.prevMs = state.milestones.map((m) => ({ ...m }));
	state.milestones = cascadeDates(state.milestones, index, newDate);
	const changes = computeChangedMilestones(state.prevMs, state.milestones, index);
	if (changes.length > 0) {
		state.warnChanges = changes;
		state.warnMessage = null;
		state.showWarn = true;
		if (state.warnTimer) clearTimeout(state.warnTimer);
		state.warnTimer = setTimeout(() => { state.showWarn = false; }, 10_000);
	} else {
		state.showWarn = false;
		if (state.warnTimer) clearTimeout(state.warnTimer);
	}
	state.milestonesChangedCount++;
}

function undoMilestones(state: ComponentState): void {
	if (!state.prevMs) return;
	state.milestones = state.prevMs.map((m) => ({ ...m }));
	state.showWarn = false;
	if (state.warnTimer) clearTimeout(state.warnTimer);
	state.milestonesChangedCount++;
}

function recalculate(state: ComponentState, anchorDate: string, procedureType: ProcedureType): void {
	state.prevMs = state.milestones.map((m) => ({ ...m }));
	state.milestones = calculateTimeline(anchorDate, procedureType);
	const msg = `Planning herberekend vanaf ${formatDateNl(anchorDate)}. Alle handmatige wijzigingen zijn vervangen door berekende waarden.`;
	state.warnChanges = [];
	state.warnMessage = msg;
	state.showWarn = true;
	if (state.warnTimer) clearTimeout(state.warnTimer);
	state.warnTimer = setTimeout(() => { state.showWarn = false; }, 10_000);
	state.milestonesChangedCount++;
}

// =============================================================================
// Test scenario 1: Open planning tab with saved milestones
// =============================================================================

describe('integration — open planning with saved milestones', () => {
	it('saved milestones are displayed as-is, not recalculated', () => {
		const saved = calculateTimeline('2026-04-01', 'open');
		// Simulate manual edits saved in DB
		saved[3].target_date = '2026-06-15';
		saved[3].source = 'manual';

		const state = createComponentState(saved, true); // disabled = read mode
		initializeIfNeeded(state, '2026-04-01', 'open');

		expect(state.milestones[3].target_date).toBe('2026-06-15');
		expect(state.milestones[3].source).toBe('manual');
		expect(state.milestonesChangedCount).toBe(0);
	});

	it('all saved milestone dates are preserved', () => {
		const saved = calculateTimeline('2026-04-01', 'restricted');
		const savedDates = saved.map((m) => m.target_date);

		const state = createComponentState(saved, true);
		initializeIfNeeded(state, '2026-04-01', 'restricted');

		expect(state.milestones.map((m) => m.target_date)).toEqual(savedDates);
	});
});

// =============================================================================
// Test scenario 2: Enter edit mode — dates do NOT change
// =============================================================================

describe('integration — enter edit mode without date changes', () => {
	it('switching from disabled to enabled preserves dates', () => {
		const saved = calculateTimeline('2026-04-01', 'open');
		const savedDates = saved.map((m) => m.target_date);

		// Read mode
		const readState = createComponentState(saved, true);
		initializeIfNeeded(readState, '2026-04-01', 'open');

		// Edit mode (same milestones, disabled = false)
		const editState = createComponentState(readState.milestones, false);
		initializeIfNeeded(editState, '2026-04-01', 'open');

		expect(editState.milestones.map((m) => m.target_date)).toEqual(savedDates);
		expect(editState.milestonesChangedCount).toBe(0);
	});

	it('edit mode with manual dates does not reset them', () => {
		const saved = calculateTimeline('2026-04-01', 'open');
		saved[5].target_date = '2026-08-01';
		saved[5].source = 'manual';

		const editState = createComponentState(saved, false);
		initializeIfNeeded(editState, '2026-04-01', 'open');

		expect(editState.milestones[5].target_date).toBe('2026-08-01');
		expect(editState.milestonesChangedCount).toBe(0);
	});
});

// =============================================================================
// Test scenario 3: Change a date — cascade warning appears
// =============================================================================

describe('integration — date change triggers cascade warning', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('changing publication date shows cascade warning', () => {
		const saved = calculateTimeline('2026-03-01', 'open');
		const state = createComponentState(saved, false);
		const pubIdx = state.milestones.findIndex((m) => m.milestone_type === 'publication');

		handleDateChange(state, pubIdx, '2026-06-01');

		expect(state.showWarn).toBe(true);
		expect(state.warnChanges.length).toBeGreaterThan(0);
		expect(state.warnMessage).toBeNull();
	});

	it('warning contains downstream milestones only', () => {
		const saved = calculateTimeline('2026-03-01', 'open');
		const state = createComponentState(saved, false);
		const pubIdx = state.milestones.findIndex((m) => m.milestone_type === 'publication');

		handleDateChange(state, pubIdx, '2026-06-01');

		// No upstream milestones should be in changes
		const upstreamTypes = ['project_start', 'market_exploration', 'specification_ready'];
		for (const change of state.warnChanges) {
			const origMs = saved.find((m) => m.label === change.label);
			if (origMs) {
				expect(upstreamTypes).not.toContain(origMs.milestone_type);
			}
		}
	});

	it('warning shows correct dates and day differences', () => {
		const saved = calculateTimeline('2026-03-01', 'open');
		const state = createComponentState(saved, false);
		const pubIdx = state.milestones.findIndex((m) => m.milestone_type === 'publication');

		handleDateChange(state, pubIdx, '2026-06-01');

		for (const change of state.warnChanges) {
			expect(change.daysDiff).toBeGreaterThan(0);
			expect(change.oldDate).not.toBe(change.newDate);
		}
	});

	it('warning auto-dismisses after 10 seconds', () => {
		const saved = calculateTimeline('2026-03-01', 'open');
		const state = createComponentState(saved, false);
		const pubIdx = state.milestones.findIndex((m) => m.milestone_type === 'publication');

		handleDateChange(state, pubIdx, '2026-06-01');
		expect(state.showWarn).toBe(true);

		vi.advanceTimersByTime(10_000);
		expect(state.showWarn).toBe(false);
	});
});

// =============================================================================
// Test scenario 4: Click undo — milestones revert
// =============================================================================

describe('integration — undo reverts milestones', () => {
	it('undo after date change restores exact previous dates', () => {
		const saved = calculateTimeline('2026-03-01', 'open');
		const savedDates = saved.map((m) => m.target_date);
		const state = createComponentState(saved, false);
		const pubIdx = state.milestones.findIndex((m) => m.milestone_type === 'publication');

		handleDateChange(state, pubIdx, '2026-06-01');
		expect(state.milestones.map((m) => m.target_date)).not.toEqual(savedDates);

		undoMilestones(state);
		expect(state.milestones.map((m) => m.target_date)).toEqual(savedDates);
		expect(state.showWarn).toBe(false);
	});

	it('undo after recalculate restores manual edits', () => {
		const saved = calculateTimeline('2026-03-01', 'open');
		saved[5].target_date = '2026-09-15';
		saved[5].source = 'manual';

		const state = createComponentState(saved, false);
		recalculate(state, '2026-03-01', 'open');

		// After recalculate, manual edits are gone
		expect(state.milestones[5].source).toBe('calculated');

		undoMilestones(state);

		// After undo, manual edits are restored
		expect(state.milestones[5].target_date).toBe('2026-09-15');
		expect(state.milestones[5].source).toBe('manual');
	});

	it('undo clears the warning', () => {
		const saved = calculateTimeline('2026-03-01', 'open');
		const state = createComponentState(saved, false);
		const pubIdx = state.milestones.findIndex((m) => m.milestone_type === 'publication');

		handleDateChange(state, pubIdx, '2026-06-01');
		expect(state.showWarn).toBe(true);

		undoMilestones(state);
		expect(state.showWarn).toBe(false);
	});
});

// =============================================================================
// Test scenario 5: Recalculate shows specific message
// =============================================================================

describe('integration — recalculate message', () => {
	it('recalculate shows planning-recalculated message', () => {
		const saved = calculateTimeline('2026-03-01', 'open');
		const state = createComponentState(saved, false);

		recalculate(state, '2026-03-01', 'open');

		expect(state.showWarn).toBe(true);
		expect(state.warnMessage).toContain('herberekend');
		expect(state.warnMessage).toContain('handmatige wijzigingen');
		expect(state.warnChanges).toHaveLength(0);
	});
});

// =============================================================================
// Test scenario 6: First-time planning (no saved milestones)
// =============================================================================

describe('integration — first-time planning calculates from anchor', () => {
	it('empty milestones triggers calculateTimeline from anchor', () => {
		const state = createComponentState([], false);
		initializeIfNeeded(state, '2026-05-01', 'open');

		expect(state.milestones.length).toBeGreaterThan(0);
		expect(state.milestones[0].milestone_type).toBe('project_start');
		expect(state.milestones[0].target_date).toBe('2026-05-01');
		expect(state.milestonesChangedCount).toBe(1);
	});

	it('first-time planning uses anchor from profile, not today', () => {
		const state = createComponentState([], false);
		initializeIfNeeded(state, '2026-09-15', 'restricted');

		expect(state.milestones[0].target_date).toBe('2026-09-15');
	});
});
