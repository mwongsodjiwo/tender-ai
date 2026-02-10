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
	it('has exactly 5 activity types (project phases)', () => {
		expect(TIME_ENTRY_ACTIVITY_TYPES).toHaveLength(5);
	});

	it('contains all expected project phases', () => {
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('preparing');
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('exploring');
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('specifying');
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('tendering');
		expect(TIME_ENTRY_ACTIVITY_TYPES).toContain('contracting');
	});

	it('is in correct order matching project phase sequence', () => {
		expect(TIME_ENTRY_ACTIVITY_TYPES[0]).toBe('preparing');
		expect(TIME_ENTRY_ACTIVITY_TYPES[1]).toBe('exploring');
		expect(TIME_ENTRY_ACTIVITY_TYPES[2]).toBe('specifying');
		expect(TIME_ENTRY_ACTIVITY_TYPES[3]).toBe('tendering');
		expect(TIME_ENTRY_ACTIVITY_TYPES[4]).toBe('contracting');
	});

	it('is a readonly tuple (enforced by as const)', () => {
		// TypeScript enforces readonly at compile time; at runtime we verify it's an array with fixed length
		expect(Array.isArray(TIME_ENTRY_ACTIVITY_TYPES)).toBe(true);
		expect(TIME_ENTRY_ACTIVITY_TYPES.length).toBe(5);
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
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.preparing).toBe('Voorbereiden');
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.exploring).toBe('Verkennen');
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.specifying).toBe('Specificeren');
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.tendering).toBe('Aanbesteden');
		expect(TIME_ENTRY_ACTIVITY_TYPE_LABELS.contracting).toBe('Contracteren');
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
			'preparing',
			'exploring',
			'specifying',
			'tendering',
			'contracting'
		];
		expect(validTypes).toHaveLength(5);
	});
});
