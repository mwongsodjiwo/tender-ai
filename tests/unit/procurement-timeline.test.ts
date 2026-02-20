// Unit tests for procurement timeline — Fase 34
// Tests calculateTimeline, cascadeDates, and PROCEDURE_DEADLINES config

import { describe, it, expect } from 'vitest';
import {
	calculateTimeline,
	cascadeDates,
	PROCEDURE_DEADLINES,
	type TimelineMilestone
} from '../../src/lib/utils/procurement-timeline';
import type { ProcedureType } from '../../src/lib/types/enums';
import { PROCEDURE_TYPES } from '../../src/lib/types/enums';

// =============================================================================
// PROCEDURE_DEADLINES — config completeness
// =============================================================================

describe('PROCEDURE_DEADLINES config', () => {
	it('has an entry for every ProcedureType', () => {
		for (const pt of PROCEDURE_TYPES) {
			expect(PROCEDURE_DEADLINES[pt]).toBeDefined();
			expect(Array.isArray(PROCEDURE_DEADLINES[pt])).toBe(true);
		}
	});

	it('europees openbaar has 35d publication to submission', () => {
		const steps = PROCEDURE_DEADLINES['open'];
		const pubToSub = steps.find((s) => s.to === 'submission_deadline');
		expect(pubToSub?.min_days).toBe(35);
	});

	it('europees openbaar has 20d Alcatel standstill', () => {
		const steps = PROCEDURE_DEADLINES['open'];
		const alcatel = steps.find((s) => s.to === 'standstill_end');
		expect(alcatel?.min_days).toBe(20);
	});

	it('nationaal openbaar has 20d publication to submission', () => {
		const steps = PROCEDURE_DEADLINES['national_open'];
		const pubToSub = steps.find((s) => s.to === 'submission_deadline');
		expect(pubToSub?.min_days).toBe(20);
	});

	it('nationaal openbaar has no Alcatel standstill', () => {
		const steps = PROCEDURE_DEADLINES['national_open'];
		const alcatel = steps.find((s) => s.to === 'standstill_end');
		expect(alcatel).toBeUndefined();
	});

	it('restricted has 30d publication to submission', () => {
		const steps = PROCEDURE_DEADLINES['restricted'];
		const pubToSub = steps.find((s) => s.to === 'submission_deadline');
		expect(pubToSub?.min_days).toBe(30);
	});

	it('national restricted has 15d publication to submission', () => {
		const steps = PROCEDURE_DEADLINES['national_restricted'];
		const pubToSub = steps.find((s) => s.to === 'submission_deadline');
		expect(pubToSub?.min_days).toBe(15);
	});
});

// =============================================================================
// calculateTimeline — europees openbaar
// =============================================================================

describe('calculateTimeline — europees openbaar', () => {
	const anchor = '2026-03-01';
	const milestones = calculateTimeline(anchor, 'open');

	it('starts with publication on anchor date', () => {
		expect(milestones[0].milestone_type).toBe('publication');
		expect(milestones[0].target_date).toBe('2026-03-01');
		expect(milestones[0].source).toBe('calculated');
	});

	it('calculates submission deadline 35 days later', () => {
		const sub = milestones.find((m) => m.milestone_type === 'submission_deadline');
		expect(sub?.target_date).toBe('2026-04-05');
	});

	it('calculates standstill end 20 days after award', () => {
		const award = milestones.find((m) => m.milestone_type === 'award_decision');
		const standstill = milestones.find((m) => m.milestone_type === 'standstill_end');
		expect(award?.target_date).toBe('2026-04-05');
		expect(standstill?.target_date).toBe('2026-04-25');
	});

	it('returns 5 milestones for open procedure', () => {
		expect(milestones).toHaveLength(5);
	});

	it('all milestones have source "calculated"', () => {
		for (const m of milestones) {
			expect(m.source).toBe('calculated');
		}
	});

	it('milestone types follow expected order', () => {
		const types = milestones.map((m) => m.milestone_type);
		expect(types).toEqual([
			'publication',
			'submission_deadline',
			'award_decision',
			'standstill_end',
			'contract_signed'
		]);
	});
});

// =============================================================================
// calculateTimeline — nationaal openbaar
// =============================================================================

describe('calculateTimeline — nationaal openbaar', () => {
	const anchor = '2026-06-01';
	const milestones = calculateTimeline(anchor, 'national_open');

	it('returns 4 milestones (no standstill)', () => {
		expect(milestones).toHaveLength(4);
	});

	it('calculates submission deadline 20 days later', () => {
		const sub = milestones.find((m) => m.milestone_type === 'submission_deadline');
		expect(sub?.target_date).toBe('2026-06-21');
	});

	it('does not include standstill milestone', () => {
		const standstill = milestones.find((m) => m.milestone_type === 'standstill_end');
		expect(standstill).toBeUndefined();
	});
});

// =============================================================================
// calculateTimeline — single source
// =============================================================================

describe('calculateTimeline — single source', () => {
	const anchor = '2026-01-15';
	const milestones = calculateTimeline(anchor, 'single_source');

	it('returns 3 milestones (publication, award, contract)', () => {
		expect(milestones).toHaveLength(3);
	});

	it('award and contract are on same date as publication', () => {
		expect(milestones[1].target_date).toBe('2026-01-15');
		expect(milestones[2].target_date).toBe('2026-01-15');
	});
});

// =============================================================================
// calculateTimeline — all procedure types produce valid output
// =============================================================================

describe('calculateTimeline — all procedure types', () => {
	const anchor = '2026-04-01';

	for (const pt of PROCEDURE_TYPES) {
		it(`produces milestones for ${pt}`, () => {
			const milestones = calculateTimeline(anchor, pt);
			expect(milestones.length).toBeGreaterThanOrEqual(2);
			expect(milestones[0].milestone_type).toBe('publication');
			expect(milestones[0].target_date).toBe(anchor);
		});
	}
});

// =============================================================================
// cascadeDates — shift downstream milestones
// =============================================================================

describe('cascadeDates — shift downstream', () => {
	const milestones = calculateTimeline('2026-03-01', 'open');

	it('shifts downstream dates when publication moves later', () => {
		const result = cascadeDates(milestones, 0, '2026-03-15');
		expect(result[0].target_date).toBe('2026-03-15');
		expect(result[0].source).toBe('manual');
		// submission should be at least 35 days from new publication
		expect(result[1].target_date).toBe('2026-04-19');
	});

	it('marks manually changed milestone as manual', () => {
		const result = cascadeDates(milestones, 0, '2026-03-15');
		expect(result[0].source).toBe('manual');
	});

	it('does not modify milestones before changed index', () => {
		const result = cascadeDates(milestones, 2, '2026-05-01');
		expect(result[0].target_date).toBe('2026-03-01');
		expect(result[1].target_date).toBe('2026-04-05');
	});
});

// =============================================================================
// cascadeDates — preserve valid manual dates
// =============================================================================

describe('cascadeDates — preserve valid manual dates', () => {
	it('preserves manual date that still satisfies minimum', () => {
		const milestones = calculateTimeline('2026-03-01', 'open');
		// Manually set submission to 2026-05-01 (well after 35d minimum)
		milestones[1].target_date = '2026-05-01';
		milestones[1].source = 'manual';

		// Now shift publication to 2026-03-05 (4 days later)
		// Submission at 2026-05-01 is still >= 35 days from 2026-03-05
		const result = cascadeDates(milestones, 0, '2026-03-05');
		expect(result[1].target_date).toBe('2026-05-01');
		expect(result[1].source).toBe('manual');
	});

	it('overrides manual date that violates minimum', () => {
		const milestones = calculateTimeline('2026-03-01', 'open');
		// Manually set submission to 2026-03-20 (only 19d from publication)
		milestones[1].target_date = '2026-03-20';
		milestones[1].source = 'manual';

		// Shift publication to 2026-03-10
		// 2026-03-20 is only 10 days from 2026-03-10, violates 35d minimum
		const result = cascadeDates(milestones, 0, '2026-03-10');
		expect(result[1].target_date).toBe('2026-04-14');
		expect(result[1].source).toBe('calculated');
	});
});

// =============================================================================
// cascadeDates — middle milestone change
// =============================================================================

describe('cascadeDates — middle milestone change', () => {
	it('shifts only downstream milestones', () => {
		const milestones = calculateTimeline('2026-03-01', 'open');
		// Change submission deadline (index 1) to much later
		const result = cascadeDates(milestones, 1, '2026-06-01');

		// Publication stays unchanged
		expect(result[0].target_date).toBe('2026-03-01');
		// Submission is set to new date
		expect(result[1].target_date).toBe('2026-06-01');
		expect(result[1].source).toBe('manual');
		// Award should cascade (0d from submission)
		expect(result[2].target_date).toBe('2026-06-01');
		// Standstill should cascade (20d from award)
		expect(result[3].target_date).toBe('2026-06-21');
	});
});

// =============================================================================
// cascadeDates — does not mutate input
// =============================================================================

describe('cascadeDates — immutability', () => {
	it('does not mutate the original milestones array', () => {
		const milestones = calculateTimeline('2026-03-01', 'open');
		const originalDates = milestones.map((m) => m.target_date);

		cascadeDates(milestones, 0, '2026-04-01');

		const afterDates = milestones.map((m) => m.target_date);
		expect(afterDates).toEqual(originalDates);
	});
});

// =============================================================================
// Edge cases
// =============================================================================

describe('calculateTimeline — edge cases', () => {
	it('handles year boundary correctly', () => {
		const milestones = calculateTimeline('2026-12-01', 'open');
		const sub = milestones.find((m) => m.milestone_type === 'submission_deadline');
		expect(sub?.target_date).toBe('2027-01-05');
	});

	it('handles leap year correctly', () => {
		// 2028 is a leap year
		const milestones = calculateTimeline('2028-02-01', 'national_open');
		const sub = milestones.find((m) => m.milestone_type === 'submission_deadline');
		// 20 days from Feb 1, 2028 = Feb 21, 2028
		expect(sub?.target_date).toBe('2028-02-21');
	});

	it('handles Feb 28 to Mar in non-leap year', () => {
		const milestones = calculateTimeline('2026-02-25', 'national_restricted');
		const sub = milestones.find((m) => m.milestone_type === 'submission_deadline');
		// 15 days from Feb 25, 2026 = Mar 12, 2026
		expect(sub?.target_date).toBe('2026-03-12');
	});
});
