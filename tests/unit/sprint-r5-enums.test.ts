// Unit tests for Sprint R5 — Market research activity types and labels

import { describe, it, expect } from 'vitest';
import {
	MARKET_RESEARCH_ACTIVITY_TYPES,
	MARKET_RESEARCH_ACTIVITY_TYPE_LABELS,
	type MarketResearchActivityType
} from '../../src/lib/types/enums';

// =============================================================================
// MARKET RESEARCH ACTIVITY TYPES
// =============================================================================

describe('Market research activity types enum', () => {
	it('has exactly 5 activity types', () => {
		expect(MARKET_RESEARCH_ACTIVITY_TYPES).toHaveLength(5);
	});

	it('contains all expected types', () => {
		expect(MARKET_RESEARCH_ACTIVITY_TYPES).toContain('deskresearch');
		expect(MARKET_RESEARCH_ACTIVITY_TYPES).toContain('rfi');
		expect(MARKET_RESEARCH_ACTIVITY_TYPES).toContain('market_consultation');
		expect(MARKET_RESEARCH_ACTIVITY_TYPES).toContain('conversations');
		expect(MARKET_RESEARCH_ACTIVITY_TYPES).toContain('report');
	});

	it('is in correct order', () => {
		expect(MARKET_RESEARCH_ACTIVITY_TYPES[0]).toBe('deskresearch');
		expect(MARKET_RESEARCH_ACTIVITY_TYPES[1]).toBe('rfi');
		expect(MARKET_RESEARCH_ACTIVITY_TYPES[2]).toBe('market_consultation');
		expect(MARKET_RESEARCH_ACTIVITY_TYPES[3]).toBe('conversations');
		expect(MARKET_RESEARCH_ACTIVITY_TYPES[4]).toBe('report');
	});

	it('is a const tuple', () => {
		expect(Array.isArray(MARKET_RESEARCH_ACTIVITY_TYPES)).toBe(true);
	});
});

// =============================================================================
// MARKET RESEARCH ACTIVITY TYPE LABELS (Dutch)
// =============================================================================

describe('Market research activity type labels (Dutch)', () => {
	it('has a label for every activity type', () => {
		for (const type of MARKET_RESEARCH_ACTIVITY_TYPES) {
			expect(MARKET_RESEARCH_ACTIVITY_TYPE_LABELS[type]).toBeDefined();
			expect(typeof MARKET_RESEARCH_ACTIVITY_TYPE_LABELS[type]).toBe('string');
			expect(MARKET_RESEARCH_ACTIVITY_TYPE_LABELS[type].length).toBeGreaterThan(0);
		}
	});

	it('has correct Dutch labels', () => {
		expect(MARKET_RESEARCH_ACTIVITY_TYPE_LABELS.deskresearch).toBe('Deskresearch');
		expect(MARKET_RESEARCH_ACTIVITY_TYPE_LABELS.rfi).toBe('Request for Information (RFI)');
		expect(MARKET_RESEARCH_ACTIVITY_TYPE_LABELS.market_consultation).toBe('Marktconsultatie');
		expect(MARKET_RESEARCH_ACTIVITY_TYPE_LABELS.conversations).toBe('Gesprekken');
		expect(MARKET_RESEARCH_ACTIVITY_TYPE_LABELS.report).toBe('Marktverkenningsrapport');
	});

	it('has no extra keys beyond defined types', () => {
		const labelKeys = Object.keys(MARKET_RESEARCH_ACTIVITY_TYPE_LABELS);
		expect(labelKeys).toHaveLength(MARKET_RESEARCH_ACTIVITY_TYPES.length);
		for (const key of labelKeys) {
			expect(MARKET_RESEARCH_ACTIVITY_TYPES).toContain(key);
		}
	});
});

// =============================================================================
// TYPE COMPATIBILITY
// =============================================================================

describe('MarketResearchActivityType type compatibility', () => {
	it('all types are valid MarketResearchActivityType values', () => {
		const types: MarketResearchActivityType[] = [
			'deskresearch',
			'rfi',
			'market_consultation',
			'conversations',
			'report'
		];
		expect(types).toEqual([...MARKET_RESEARCH_ACTIVITY_TYPES]);
	});
});
