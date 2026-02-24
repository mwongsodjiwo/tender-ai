// Fase 109 — Component tests for cascade warning behavior
// Tests the cascade warning logic from PlanningMilestones.svelte:
// - Date change produces correct diff (labels, old date, new date, daysDiff)
// - Undo restores previous state
// - Warning disappears after 10 seconds
// - Recalculate shows different message

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

// =============================================================================
// Helper: simulates the warning state machine from PlanningMilestones.svelte
// =============================================================================

interface WarningState {
	showWarn: boolean;
	warnChanges: ChangedMilestone[];
	warnMessage: string | null;
	warnTimer: ReturnType<typeof setTimeout> | null;
}

function createWarningState(): WarningState {
	return { showWarn: false, warnChanges: [], warnMessage: null, warnTimer: null };
}

function setWarning(state: WarningState, changes: ChangedMilestone[], msg: string | null): void {
	state.warnChanges = changes;
	state.warnMessage = msg;
	state.showWarn = true;
	if (state.warnTimer) clearTimeout(state.warnTimer);
	state.warnTimer = setTimeout(() => { state.showWarn = false; }, 10_000);
}

function dismissWarning(state: WarningState): void {
	state.showWarn = false;
	if (state.warnTimer) clearTimeout(state.warnTimer);
}

// =============================================================================
// Tests: cascade warning diff computation
// =============================================================================

describe('cascade warning — diff after date change', () => {
	const timeline = calculateTimeline('2026-03-01', 'open');
	const pubIdx = timeline.findIndex((m) => m.milestone_type === 'publication');

	it('shows changes for milestones that shifted', () => {
		const newMs = cascadeDates(timeline, pubIdx, '2026-06-01');
		const changes = computeChangedMilestones(timeline, newMs, pubIdx);

		expect(changes.length).toBeGreaterThan(0);
		for (const change of changes) {
			expect(change.label).toBeTruthy();
			expect(change.oldDate).not.toBe(change.newDate);
			expect(change.daysDiff).not.toBe(0);
		}
	});

	it('excludes the user-edited milestone from changes', () => {
		const newMs = cascadeDates(timeline, pubIdx, '2026-06-01');
		const changes = computeChangedMilestones(timeline, newMs, pubIdx);

		const pubLabel = timeline[pubIdx].label;
		const editedInChanges = changes.find((c) => c.label === pubLabel);
		expect(editedInChanges).toBeUndefined();
	});

	it('has correct labels for each changed milestone', () => {
		const newMs = cascadeDates(timeline, pubIdx, '2026-06-01');
		const changes = computeChangedMilestones(timeline, newMs, pubIdx);

		for (const change of changes) {
			const origMs = timeline.find((m) => m.label === change.label);
			expect(origMs).toBeDefined();
		}
	});

	it('has correct old and new dates', () => {
		const newMs = cascadeDates(timeline, pubIdx, '2026-06-01');
		const changes = computeChangedMilestones(timeline, newMs, pubIdx);

		for (const change of changes) {
			const origMs = timeline.find((m) => m.label === change.label);
			const newMsItem = newMs.find((m) => m.label === change.label);
			expect(change.oldDate).toBe(origMs!.target_date);
			expect(change.newDate).toBe(newMsItem!.target_date);
		}
	});

	it('calculates correct daysDiff for each change', () => {
		const newMs = cascadeDates(timeline, pubIdx, '2026-06-01');
		const changes = computeChangedMilestones(timeline, newMs, pubIdx);

		for (const change of changes) {
			const oldMs = new Date(change.oldDate + 'T00:00:00Z').getTime();
			const newMsDate = new Date(change.newDate + 'T00:00:00Z').getTime();
			const expectedDiff = Math.round((newMsDate - oldMs) / 86400000);
			expect(change.daysDiff).toBe(expectedDiff);
		}
	});

	it('returns empty changes when no milestones shift', () => {
		// Move last milestone — nothing after it to cascade
		const lastIdx = timeline.length - 1;
		const newMs = cascadeDates(timeline, lastIdx, '2027-12-31');
		const changes = computeChangedMilestones(timeline, newMs, lastIdx);

		expect(changes).toHaveLength(0);
	});
});

// =============================================================================
// Tests: undo restores previous state
// =============================================================================

describe('cascade warning — undo restores milestones', () => {
	it('undo restores exact previous milestone dates', () => {
		const timeline = calculateTimeline('2026-03-01', 'open');
		const originalDates = timeline.map((m) => m.target_date);

		const pubIdx = timeline.findIndex((m) => m.milestone_type === 'publication');
		const prevMs = timeline.map((m) => ({ ...m }));
		const newMs = cascadeDates(timeline, pubIdx, '2026-06-01');

		// Simulate undo
		const restored = prevMs.map((m) => ({ ...m }));

		expect(restored.map((m) => m.target_date)).toEqual(originalDates);
		expect(restored.map((m) => m.target_date)).not.toEqual(
			newMs.map((m) => m.target_date)
		);
	});

	it('undo preserves manual source markers', () => {
		const timeline = calculateTimeline('2026-03-01', 'open');
		const nviIdx = timeline.findIndex((m) => m.milestone_type === 'nota_van_inlichtingen');

		// Simulate a manual edit followed by cascade
		const step1 = cascadeDates(timeline, nviIdx, '2026-07-01');
		const prevMs = step1.map((m) => ({ ...m }));

		const pubIdx = step1.findIndex((m) => m.milestone_type === 'publication');
		cascadeDates(step1, pubIdx, '2026-08-01');

		// Simulate undo
		const restored = prevMs.map((m) => ({ ...m }));

		expect(restored[nviIdx].source).toBe('manual');
		expect(restored[nviIdx].target_date).toBe('2026-07-01');
	});
});

// =============================================================================
// Tests: warning auto-dismiss after 10 seconds
// =============================================================================

describe('cascade warning — auto-dismiss after 10 seconds', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('warning is visible immediately after setWarning', () => {
		const state = createWarningState();
		setWarning(state, [{ label: 'NvI', oldDate: '2026-05-01', newDate: '2026-05-08', daysDiff: 7 }], null);

		expect(state.showWarn).toBe(true);
	});

	it('warning disappears after 10 seconds', () => {
		const state = createWarningState();
		setWarning(state, [{ label: 'NvI', oldDate: '2026-05-01', newDate: '2026-05-08', daysDiff: 7 }], null);

		vi.advanceTimersByTime(9_999);
		expect(state.showWarn).toBe(true);

		vi.advanceTimersByTime(1);
		expect(state.showWarn).toBe(false);
	});

	it('dismissWarning clears warning immediately', () => {
		const state = createWarningState();
		setWarning(state, [{ label: 'NvI', oldDate: '2026-05-01', newDate: '2026-05-08', daysDiff: 7 }], null);

		dismissWarning(state);
		expect(state.showWarn).toBe(false);
	});

	it('new warning resets the timer', () => {
		const state = createWarningState();
		setWarning(state, [{ label: 'NvI', oldDate: '2026-05-01', newDate: '2026-05-08', daysDiff: 7 }], null);

		vi.advanceTimersByTime(7_000);
		// Trigger new warning — timer resets
		setWarning(state, [{ label: 'Sub', oldDate: '2026-06-01', newDate: '2026-06-08', daysDiff: 7 }], null);

		vi.advanceTimersByTime(7_000);
		// Only 7s since last setWarning, should still be visible
		expect(state.showWarn).toBe(true);

		vi.advanceTimersByTime(3_000);
		// Now 10s since last setWarning
		expect(state.showWarn).toBe(false);
	});
});

// =============================================================================
// Tests: recalculate shows different message
// =============================================================================

describe('cascade warning — recalculate message', () => {
	it('recalculate sets message instead of changes', () => {
		const state = createWarningState();
		const anchorDate = '2026-03-01';
		const msg = `Planning herberekend vanaf ${formatDateNl(anchorDate)}. Alle handmatige wijzigingen zijn vervangen door berekende waarden.`;

		setWarning(state, [], msg);

		expect(state.showWarn).toBe(true);
		expect(state.warnMessage).toBe(msg);
		expect(state.warnChanges).toHaveLength(0);
	});

	it('recalculate message contains the anchor date', () => {
		const anchorDate = '2026-09-15';
		const msg = `Planning herberekend vanaf ${formatDateNl(anchorDate)}. Alle handmatige wijzigingen zijn vervangen door berekende waarden.`;

		expect(msg).toContain('15');
		expect(msg).toContain('september');
		expect(msg).toContain('2026');
	});

	it('cascade warning has changes but no message', () => {
		const state = createWarningState();
		const changes: ChangedMilestone[] = [
			{ label: 'NvI', oldDate: '2026-05-24', newDate: '2026-06-15', daysDiff: 22 }
		];

		setWarning(state, changes, null);

		expect(state.warnMessage).toBeNull();
		expect(state.warnChanges).toHaveLength(1);
		expect(state.warnChanges[0].label).toBe('NvI');
	});
});

// =============================================================================
// Tests: handleDateChange flow (full pipeline)
// =============================================================================

describe('cascade warning — full handleDateChange pipeline', () => {
	it('date change on publication cascades and produces correct warning', () => {
		const timeline = calculateTimeline('2026-03-01', 'open');
		const pubIdx = timeline.findIndex((m) => m.milestone_type === 'publication');

		// Simulate handleDateChange
		const prevMs = timeline.map((m) => ({ ...m }));
		const newMs = cascadeDates(timeline, pubIdx, '2026-06-01');
		const changes = computeChangedMilestones(prevMs, newMs, pubIdx);

		const state = createWarningState();
		if (changes.length > 0) setWarning(state, changes, null);

		expect(state.showWarn).toBe(true);
		expect(state.warnChanges.length).toBeGreaterThan(0);
		expect(state.warnMessage).toBeNull();
	});

	it('undo after handleDateChange restores timeline', () => {
		const timeline = calculateTimeline('2026-03-01', 'open');
		const pubIdx = timeline.findIndex((m) => m.milestone_type === 'publication');

		const prevMs = timeline.map((m) => ({ ...m }));
		const newMs = cascadeDates(timeline, pubIdx, '2026-06-01');

		// Simulate undo
		const restored = prevMs.map((m) => ({ ...m }));

		expect(restored.map((m) => m.target_date)).toEqual(
			timeline.map((m) => m.target_date)
		);
		expect(newMs.map((m) => m.target_date)).not.toEqual(
			restored.map((m) => m.target_date)
		);
	});
});
