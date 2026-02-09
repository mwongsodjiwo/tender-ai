// Unit tests for Urenregistratie module — Week utility functions

import { describe, it, expect } from 'vitest';
import {
	getISOWeekNumber,
	getISOWeekYear,
	toISOWeekString,
	getWeekMonday,
	getWeekDates,
	formatDateISO,
	formatDateDutch,
	formatWeekRange,
	previousWeek,
	nextWeek
} from '../../src/lib/utils/week';

// =============================================================================
// getISOWeekNumber
// =============================================================================

describe('getISOWeekNumber', () => {
	it('returns week 1 for Jan 1 2026 (Thursday)', () => {
		expect(getISOWeekNumber(new Date(2026, 0, 1))).toBe(1);
	});

	it('returns week 7 for Feb 9 2026 (Monday)', () => {
		expect(getISOWeekNumber(new Date(2026, 1, 9))).toBe(7);
	});

	it('returns week 52 or 53 for Dec 31', () => {
		const week = getISOWeekNumber(new Date(2026, 11, 31));
		expect(week).toBeGreaterThanOrEqual(52);
		expect(week).toBeLessThanOrEqual(53);
	});
});

// =============================================================================
// toISOWeekString
// =============================================================================

describe('toISOWeekString', () => {
	it('returns correct format', () => {
		const result = toISOWeekString(new Date(2026, 1, 9));
		expect(result).toMatch(/^\d{4}-W\d{2}$/);
	});

	it('returns 2026-W07 for Feb 9 2026', () => {
		expect(toISOWeekString(new Date(2026, 1, 9))).toBe('2026-W07');
	});

	it('pads week number with zero', () => {
		const result = toISOWeekString(new Date(2026, 0, 5));
		expect(result).toBe('2026-W02');
	});
});

// =============================================================================
// getWeekMonday
// =============================================================================

describe('getWeekMonday', () => {
	it('returns a Monday', () => {
		const monday = getWeekMonday('2026-W07');
		expect(monday.getDay()).toBe(1); // Monday
	});

	it('returns Feb 9 for 2026-W07', () => {
		const monday = getWeekMonday('2026-W07');
		expect(monday.getDate()).toBe(9);
		expect(monday.getMonth()).toBe(1); // February
		expect(monday.getFullYear()).toBe(2026);
	});

	it('throws on invalid format', () => {
		expect(() => getWeekMonday('invalid')).toThrow();
	});

	it('throws on missing W prefix', () => {
		expect(() => getWeekMonday('2026-07')).toThrow();
	});
});

// =============================================================================
// getWeekDates
// =============================================================================

describe('getWeekDates', () => {
	it('returns 7 dates', () => {
		const dates = getWeekDates('2026-W07');
		expect(dates).toHaveLength(7);
	});

	it('starts on Monday and ends on Sunday', () => {
		const dates = getWeekDates('2026-W07');
		expect(dates[0].getDay()).toBe(1); // Monday
		expect(dates[6].getDay()).toBe(0); // Sunday
	});

	it('dates are consecutive', () => {
		const dates = getWeekDates('2026-W07');
		for (let i = 1; i < dates.length; i++) {
			const diff = dates[i].getTime() - dates[i - 1].getTime();
			const oneDay = 24 * 60 * 60 * 1000;
			expect(diff).toBe(oneDay);
		}
	});
});

// =============================================================================
// formatDateISO
// =============================================================================

describe('formatDateISO', () => {
	it('formats with zero-padded month and day', () => {
		expect(formatDateISO(new Date(2026, 0, 5))).toBe('2026-01-05');
	});

	it('formats Feb 9 correctly', () => {
		expect(formatDateISO(new Date(2026, 1, 9))).toBe('2026-02-09');
	});

	it('formats Dec 31 correctly', () => {
		expect(formatDateISO(new Date(2026, 11, 31))).toBe('2026-12-31');
	});
});

// =============================================================================
// formatDateDutch
// =============================================================================

describe('formatDateDutch', () => {
	it('formats Monday Feb 9 correctly', () => {
		const result = formatDateDutch(new Date(2026, 1, 9));
		expect(result).toBe('Maandag 9 feb');
	});

	it('formats Sunday correctly', () => {
		const result = formatDateDutch(new Date(2026, 1, 15));
		expect(result).toBe('Zondag 15 feb');
	});

	it('uses Dutch day names', () => {
		// Wednesday Feb 11 2026
		const result = formatDateDutch(new Date(2026, 1, 11));
		expect(result).toBe('Woensdag 11 feb');
	});
});

// =============================================================================
// formatWeekRange
// =============================================================================

describe('formatWeekRange', () => {
	it('includes year at the end', () => {
		const result = formatWeekRange('2026-W07');
		expect(result).toContain('2026');
	});

	it('includes dash separator', () => {
		const result = formatWeekRange('2026-W07');
		expect(result).toContain('–');
	});
});

// =============================================================================
// previousWeek / nextWeek
// =============================================================================

describe('previousWeek', () => {
	it('returns the week before', () => {
		expect(previousWeek('2026-W07')).toBe('2026-W06');
	});

	it('handles year boundary', () => {
		const prev = previousWeek('2026-W01');
		expect(prev).toMatch(/^\d{4}-W\d{2}$/);
		// Should be week 52 or 53 of 2025
		expect(prev).toMatch(/^2025-W5[23]$/);
	});
});

describe('nextWeek', () => {
	it('returns the week after', () => {
		expect(nextWeek('2026-W07')).toBe('2026-W08');
	});

	it('pads correctly', () => {
		expect(nextWeek('2026-W08')).toBe('2026-W09');
	});
});
