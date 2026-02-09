// Unit tests for Urenregistratie module — Zod validation schemas

import { describe, it, expect } from 'vitest';
import {
	createTimeEntrySchema,
	updateTimeEntrySchema,
	timeEntryQuerySchema
} from '../../src/lib/server/api/validation';

// =============================================================================
// CREATE TIME ENTRY VALIDATION
// =============================================================================

describe('createTimeEntrySchema', () => {
	const validEntry = {
		project_id: '550e8400-e29b-41d4-a716-446655440000',
		date: '2026-02-09',
		hours: 4,
		activity_type: 'specifying' as const,
		notes: 'Gewerkt aan PvE'
	};

	it('accepts a valid time entry', () => {
		const result = createTimeEntrySchema.safeParse(validEntry);
		expect(result.success).toBe(true);
	});

	it('accepts entry without notes', () => {
		const { notes, ...withoutNotes } = validEntry;
		const result = createTimeEntrySchema.safeParse(withoutNotes);
		expect(result.success).toBe(true);
	});

	it('defaults notes to empty string', () => {
		const { notes, ...withoutNotes } = validEntry;
		const result = createTimeEntrySchema.safeParse(withoutNotes);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.notes).toBe('');
		}
	});

	it('rejects missing project_id', () => {
		const { project_id, ...withoutProject } = validEntry;
		const result = createTimeEntrySchema.safeParse(withoutProject);
		expect(result.success).toBe(false);
	});

	it('rejects invalid project_id (not UUID)', () => {
		const result = createTimeEntrySchema.safeParse({ ...validEntry, project_id: 'not-a-uuid' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid date format', () => {
		const result = createTimeEntrySchema.safeParse({ ...validEntry, date: '09-02-2026' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid date format (no dashes)', () => {
		const result = createTimeEntrySchema.safeParse({ ...validEntry, date: '20260209' });
		expect(result.success).toBe(false);
	});

	it('rejects zero hours', () => {
		const result = createTimeEntrySchema.safeParse({ ...validEntry, hours: 0 });
		expect(result.success).toBe(false);
	});

	it('rejects negative hours', () => {
		const result = createTimeEntrySchema.safeParse({ ...validEntry, hours: -1 });
		expect(result.success).toBe(false);
	});

	it('rejects hours greater than 24', () => {
		const result = createTimeEntrySchema.safeParse({ ...validEntry, hours: 25 });
		expect(result.success).toBe(false);
	});

	it('accepts hours exactly 24', () => {
		const result = createTimeEntrySchema.safeParse({ ...validEntry, hours: 24 });
		expect(result.success).toBe(true);
	});

	it('accepts decimal hours (0.5)', () => {
		const result = createTimeEntrySchema.safeParse({ ...validEntry, hours: 0.5 });
		expect(result.success).toBe(true);
	});

	it('accepts decimal hours (2.25)', () => {
		const result = createTimeEntrySchema.safeParse({ ...validEntry, hours: 2.25 });
		expect(result.success).toBe(true);
	});

	it('rejects invalid activity type', () => {
		const result = createTimeEntrySchema.safeParse({ ...validEntry, activity_type: 'invalid' });
		expect(result.success).toBe(false);
	});

	it('accepts all valid activity types', () => {
		const types = ['specifying', 'evaluation', 'nvi', 'correspondence', 'market_research', 'meeting', 'other'];
		for (const actType of types) {
			const result = createTimeEntrySchema.safeParse({ ...validEntry, activity_type: actType });
			expect(result.success).toBe(true);
		}
	});

	it('rejects notes longer than 1000 characters', () => {
		const longNotes = 'a'.repeat(1001);
		const result = createTimeEntrySchema.safeParse({ ...validEntry, notes: longNotes });
		expect(result.success).toBe(false);
	});

	it('accepts notes of exactly 1000 characters', () => {
		const maxNotes = 'a'.repeat(1000);
		const result = createTimeEntrySchema.safeParse({ ...validEntry, notes: maxNotes });
		expect(result.success).toBe(true);
	});
});

// =============================================================================
// UPDATE TIME ENTRY VALIDATION
// =============================================================================

describe('updateTimeEntrySchema', () => {
	it('accepts partial update with only hours', () => {
		const result = updateTimeEntrySchema.safeParse({ hours: 3 });
		expect(result.success).toBe(true);
	});

	it('accepts partial update with only activity_type', () => {
		const result = updateTimeEntrySchema.safeParse({ activity_type: 'meeting' });
		expect(result.success).toBe(true);
	});

	it('accepts partial update with only notes', () => {
		const result = updateTimeEntrySchema.safeParse({ notes: 'Updated note' });
		expect(result.success).toBe(true);
	});

	it('accepts empty object (no changes)', () => {
		const result = updateTimeEntrySchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects invalid hours in update', () => {
		const result = updateTimeEntrySchema.safeParse({ hours: -5 });
		expect(result.success).toBe(false);
	});

	it('rejects hours over 24 in update', () => {
		const result = updateTimeEntrySchema.safeParse({ hours: 30 });
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// TIME ENTRY QUERY VALIDATION
// =============================================================================

describe('timeEntryQuerySchema', () => {
	it('accepts valid week format', () => {
		const result = timeEntryQuerySchema.safeParse({ week: '2026-W07' });
		expect(result.success).toBe(true);
	});

	it('accepts valid date range', () => {
		const result = timeEntryQuerySchema.safeParse({
			from: '2026-01-01',
			to: '2026-03-31'
		});
		expect(result.success).toBe(true);
	});

	it('accepts date range with project filter', () => {
		const result = timeEntryQuerySchema.safeParse({
			from: '2026-01-01',
			to: '2026-03-31',
			project_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty query (no filters)', () => {
		const result = timeEntryQuerySchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects invalid week format', () => {
		const result = timeEntryQuerySchema.safeParse({ week: '2026-07' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid week format (no W prefix)', () => {
		const result = timeEntryQuerySchema.safeParse({ week: '202607' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid date format in from', () => {
		const result = timeEntryQuerySchema.safeParse({ from: '2026/01/01' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid project_id', () => {
		const result = timeEntryQuerySchema.safeParse({ project_id: 'not-a-uuid' });
		expect(result.success).toBe(false);
	});
});
