// Unit tests for Urenregistratie module — Enums and types

import { describe, it, expect } from 'vitest';
import {
	TIME_ENTRY_ACTIVITY_TYPES,
	TIME_ENTRY_ACTIVITY_TYPE_LABELS,
	type TimeEntryActivityType
} from '../../src/lib/types/enums';

// =============================================================================
// TIME ENTRY ACTIVITY TYPES
// =============================================================================

describe('Time entry activity types enum', () => {
	it('has exactly 7 activity types', () => {
		expect(TIME_ENTRY_ACTIVITY_TYPES).toHaveLength(7);
	});

	it('contains all expected types', () => {
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('specifying');
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('evaluation');
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('nvi');
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('correspondence');
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('market_research');
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('meeting');
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('other');
	});

	it('is in correct order matching spec', () => {
		expect(TIME_ENTRY_ACTIVITY_TYPES[0]).toBe('specifying');
		expect(TIME_ENTRY_ACTIVITY_TYPES[1]).toBe('evaluation');
		expect(TIME_ENTRY_ACTIVITY_TYPES[2]).toBe('nvi');
		expect(TIME_ENTRY_ACTIVITY_TYPES[3]).toBe('correspondence');
		expect(TIME_ENTRY_ACTIVITY_TYPES[4]).toBe('market_research');
		expect(TIME_ENTRY_ACTIVITY_TYPES[5]).toBe('meeting');
		expect(TIME_ENTRY_ACTIVITY_TYPES[6]).toBe('other');
	});

	it('is a readonly tuple (enforced by as const)', () => {
		// TypeScript enforces readonly at compile time; at runtime we verify it's an array with fixed length
		expect(Array.isArray(TIME_ENTRY_ACTIVITY_TYPES)).toBe(true);
		expect(TIME_ENTRY_ACTIVITY_TYPES.length).toBe(7);
	});
});

// =============================================================================
// TIME ENTRY ACTIVITY TYPE LABELS (Dutch)
// =============================================================================

describe('Time entry activity type labels', () => {
	it('has a Dutch label for every activity type', () => {
		for (const actType of TIME_ENTRY_ACTIVITY_TYPES) {
			expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS[actType]).toBeDefined();
			expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS[actType].length).toBeGreaterThan(0);
		}
	});

	it('maps to correct Dutch labels', () => {
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.specifying).toBe('Specificeren');
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.evaluation).toBe('Beoordeling');
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.nvi).toBe('NvI');
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.correspondence).toBe('Correspondentie');
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.market_research).toBe('Marktverkenning');
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.meeting).toBe('Overleg');
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.other).toBe('Overig');
	});

	it('has no extra keys beyond the enum values', () => {
		const labelKeys = Object.keys(TIME_ENTRY_ACTIVITY_TYPE_LABELS);
		expect(labelKeys).toHaveLength(TIME_ENTRY_ACTIVITY_TYPES.length);
		for (const key of labelKeys) {
			expect(TIME_ENTRY_ACTIVITY_TYPES).toContain(key);
		}
	});
});

// =============================================================================
// TYPE ASSERTIONS
// =============================================================================

describe('TimeEntryActivityType type', () => {
	it('accepts valid activity types', () => {
		const validTypes: TimeEntryActivityType[] = [
			'specifying',
			'evaluation',
			'nvi',
			'correspondence',
			'market_research',
			'meeting',
			'other'
		];
		expect(validTypes).toHaveLength(7);
	});
});
