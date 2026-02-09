// Unit tests for Sprint R5 — Market research Zod validation schemas

import { describe, it, expect } from 'vitest';
import {
	deskresearchSchema,
	generateRfiSchema,
	generateMarketReportSchema,
	saveMarketResearchSchema
} from '../../src/lib/server/api/validation';

// =============================================================================
// DESKRESEARCH SCHEMA
// =============================================================================

describe('deskresearchSchema', () => {
	it('accepts empty object (all fields optional)', () => {
		const result = deskresearchSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(10);
		}
	});

	it('accepts valid query', () => {
		const result = deskresearchSchema.safeParse({ query: 'ICT-diensten' });
		expect(result.success).toBe(true);
	});

	it('accepts valid cpv_codes', () => {
		const result = deskresearchSchema.safeParse({
			cpv_codes: ['72000000', '30200000']
		});
		expect(result.success).toBe(true);
	});

	it('accepts valid limit', () => {
		const result = deskresearchSchema.safeParse({ limit: 25 });
		expect(result.success).toBe(true);
	});

	it('rejects limit below 1', () => {
		const result = deskresearchSchema.safeParse({ limit: 0 });
		expect(result.success).toBe(false);
	});

	it('rejects limit above 50', () => {
		const result = deskresearchSchema.safeParse({ limit: 51 });
		expect(result.success).toBe(false);
	});

	it('rejects query exceeding max length', () => {
		const result = deskresearchSchema.safeParse({ query: 'A'.repeat(501) });
		expect(result.success).toBe(false);
	});

	it('accepts cpv_codes with max length items', () => {
		const result = deskresearchSchema.safeParse({
			cpv_codes: ['12345678901234567890']
		});
		expect(result.success).toBe(true);
	});

	it('rejects cpv_codes with items exceeding max length', () => {
		const result = deskresearchSchema.safeParse({
			cpv_codes: ['A'.repeat(21)]
		});
		expect(result.success).toBe(false);
	});

	it('default limit is 10', () => {
		const result = deskresearchSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(10);
		}
	});

	it('accepts all fields together', () => {
		const result = deskresearchSchema.safeParse({
			query: 'kantoorinrichting',
			cpv_codes: ['39100000'],
			limit: 15
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.query).toBe('kantoorinrichting');
			expect(result.data.cpv_codes).toEqual(['39100000']);
			expect(result.data.limit).toBe(15);
		}
	});
});

// =============================================================================
// GENERATE RFI SCHEMA
// =============================================================================

describe('generateRfiSchema', () => {
	it('accepts empty object', () => {
		const result = generateRfiSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts valid additional_context', () => {
		const result = generateRfiSchema.safeParse({
			additional_context: 'Focus op duurzaamheid en circulair inkopen'
		});
		expect(result.success).toBe(true);
	});

	it('rejects additional_context exceeding max length', () => {
		const result = generateRfiSchema.safeParse({
			additional_context: 'A'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts additional_context at max length', () => {
		const result = generateRfiSchema.safeParse({
			additional_context: 'A'.repeat(5000)
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty string for additional_context', () => {
		const result = generateRfiSchema.safeParse({
			additional_context: ''
		});
		expect(result.success).toBe(true);
	});
});

// =============================================================================
// GENERATE MARKET REPORT SCHEMA
// =============================================================================

describe('generateMarketReportSchema', () => {
	it('accepts empty object', () => {
		const result = generateMarketReportSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts valid additional_context', () => {
		const result = generateMarketReportSchema.safeParse({
			additional_context: 'Neem ook informatie over innovaties mee'
		});
		expect(result.success).toBe(true);
	});

	it('rejects additional_context exceeding max length', () => {
		const result = generateMarketReportSchema.safeParse({
			additional_context: 'A'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts additional_context at max length', () => {
		const result = generateMarketReportSchema.safeParse({
			additional_context: 'A'.repeat(5000)
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty string for additional_context', () => {
		const result = generateMarketReportSchema.safeParse({
			additional_context: ''
		});
		expect(result.success).toBe(true);
	});
});

// =============================================================================
// SAVE MARKET RESEARCH SCHEMA
// =============================================================================

describe('saveMarketResearchSchema', () => {
	it('accepts valid deskresearch save', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'deskresearch',
			content: 'Deskresearch resultaten...'
		});
		expect(result.success).toBe(true);
	});

	it('accepts valid rfi save', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'rfi',
			content: 'RFI vragenlijst...'
		});
		expect(result.success).toBe(true);
	});

	it('accepts valid market_consultation save', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'market_consultation',
			content: 'Marktconsultatie reacties...'
		});
		expect(result.success).toBe(true);
	});

	it('accepts valid conversations save', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'conversations',
			content: 'Gespreksverslag...'
		});
		expect(result.success).toBe(true);
	});

	it('accepts valid report save', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'report',
			content: 'Marktverkenningsrapport...'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid activity_type', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'invalid_type',
			content: 'Some content'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty content', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'rfi',
			content: ''
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing activity_type', () => {
		const result = saveMarketResearchSchema.safeParse({
			content: 'Some content'
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing content', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'rfi'
		});
		expect(result.success).toBe(false);
	});

	it('rejects content exceeding max length', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'rfi',
			content: 'A'.repeat(100001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts content at max length', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'rfi',
			content: 'A'.repeat(100000)
		});
		expect(result.success).toBe(true);
	});

	it('accepts optional metadata', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'rfi',
			content: 'RFI tekst',
			metadata: { questions_count: 10 }
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.metadata).toEqual({ questions_count: 10 });
		}
	});

	it('defaults metadata to empty object', () => {
		const result = saveMarketResearchSchema.safeParse({
			activity_type: 'rfi',
			content: 'RFI tekst'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.metadata).toEqual({});
		}
	});

	it('rejects empty object', () => {
		const result = saveMarketResearchSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});
