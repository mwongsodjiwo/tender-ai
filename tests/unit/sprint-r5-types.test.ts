// Unit tests for Sprint R5 — Market research API request/response type shapes

import { describe, it, expect } from 'vitest';
import type {
	DeskresearchRequest,
	DeskresearchResult,
	DeskresearchResponse,
	GenerateRfiRequest,
	GenerateRfiResponse,
	GenerateMarketReportRequest,
	GenerateMarketReportResponse,
	SaveMarketResearchRequest
} from '../../src/lib/types/api';

// =============================================================================
// DESKRESEARCH TYPES
// =============================================================================

describe('DeskresearchRequest type shape', () => {
	const mockRequest: DeskresearchRequest = {
		project_id: '123e4567-e89b-12d3-a456-426614174000'
	};

	it('has required project_id field', () => {
		expect(mockRequest.project_id).toBeDefined();
		expect(typeof mockRequest.project_id).toBe('string');
	});

	it('supports optional query field', () => {
		const withQuery: DeskresearchRequest = { ...mockRequest, query: 'IT-diensten' };
		expect(withQuery.query).toBe('IT-diensten');
	});

	it('supports optional cpv_codes field', () => {
		const withCpv: DeskresearchRequest = { ...mockRequest, cpv_codes: ['72000000'] };
		expect(withCpv.cpv_codes).toEqual(['72000000']);
	});

	it('supports optional limit field', () => {
		const withLimit: DeskresearchRequest = { ...mockRequest, limit: 20 };
		expect(withLimit.limit).toBe(20);
	});
});

describe('DeskresearchResult type shape', () => {
	const mockResult: DeskresearchResult = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		title: 'Aanbesteding ICT-dienstverlening',
		contracting_authority: 'Gemeente Amsterdam',
		cpv_codes: ['72000000-5'],
		estimated_value: 500000,
		currency: 'EUR',
		publication_date: '2026-01-15',
		snippet: 'Levering en onderhoud van ICT-systemen...',
		relevance: 0.95
	};

	it('has all required fields', () => {
		expect(mockResult.id).toBeDefined();
		expect(mockResult.title).toBeDefined();
		expect(mockResult.cpv_codes).toBeDefined();
		expect(mockResult.snippet).toBeDefined();
		expect(mockResult.relevance).toBeDefined();
	});

	it('relevance is between 0 and 1', () => {
		expect(mockResult.relevance).toBeGreaterThanOrEqual(0);
		expect(mockResult.relevance).toBeLessThanOrEqual(1);
	});

	it('cpv_codes is an array', () => {
		expect(Array.isArray(mockResult.cpv_codes)).toBe(true);
	});

	it('nullable fields can be null', () => {
		const withNulls: DeskresearchResult = {
			...mockResult,
			contracting_authority: null,
			estimated_value: null,
			currency: null,
			publication_date: null
		};
		expect(withNulls.contracting_authority).toBeNull();
		expect(withNulls.estimated_value).toBeNull();
		expect(withNulls.currency).toBeNull();
		expect(withNulls.publication_date).toBeNull();
	});
});

describe('DeskresearchResponse type shape', () => {
	const mockResponse: DeskresearchResponse = {
		results: [],
		total: 0
	};

	it('has required fields', () => {
		expect(mockResponse.results).toBeDefined();
		expect(mockResponse.total).toBeDefined();
	});

	it('results is an array', () => {
		expect(Array.isArray(mockResponse.results)).toBe(true);
	});

	it('total is a number', () => {
		expect(typeof mockResponse.total).toBe('number');
	});

	it('supports optional ai_summary', () => {
		const withSummary: DeskresearchResponse = {
			...mockResponse,
			ai_summary: 'Er zijn 5 vergelijkbare aanbestedingen gevonden...'
		};
		expect(withSummary.ai_summary).toBeDefined();
	});
});

// =============================================================================
// RFI TYPES
// =============================================================================

describe('GenerateRfiRequest type shape', () => {
	const mockRequest: GenerateRfiRequest = {
		project_id: '123e4567-e89b-12d3-a456-426614174000'
	};

	it('has required project_id', () => {
		expect(mockRequest.project_id).toBeDefined();
	});

	it('supports optional additional_context', () => {
		const withContext: GenerateRfiRequest = {
			...mockRequest,
			additional_context: 'Focus op duurzaamheid'
		};
		expect(withContext.additional_context).toBe('Focus op duurzaamheid');
	});
});

describe('GenerateRfiResponse type shape', () => {
	const mockResponse: GenerateRfiResponse = {
		content: '# RFI Vragenlijst\n\n1. Wat is uw ervaring...',
		questions: ['Wat is uw ervaring?', 'Welke oplossingen biedt u?']
	};

	it('has required fields', () => {
		expect(mockResponse.content).toBeDefined();
		expect(mockResponse.questions).toBeDefined();
	});

	it('content is a non-empty string', () => {
		expect(typeof mockResponse.content).toBe('string');
		expect(mockResponse.content.length).toBeGreaterThan(0);
	});

	it('questions is an array of strings', () => {
		expect(Array.isArray(mockResponse.questions)).toBe(true);
		for (const q of mockResponse.questions) {
			expect(typeof q).toBe('string');
		}
	});
});

// =============================================================================
// MARKET REPORT TYPES
// =============================================================================

describe('GenerateMarketReportRequest type shape', () => {
	const mockRequest: GenerateMarketReportRequest = {
		project_id: '123e4567-e89b-12d3-a456-426614174000'
	};

	it('has required project_id', () => {
		expect(mockRequest.project_id).toBeDefined();
	});

	it('supports optional additional_context', () => {
		const withContext: GenerateMarketReportRequest = {
			...mockRequest,
			additional_context: 'Neem ook duurzaamheidsaspecten mee'
		};
		expect(withContext.additional_context).toBe('Neem ook duurzaamheidsaspecten mee');
	});
});

describe('GenerateMarketReportResponse type shape', () => {
	const mockResponse: GenerateMarketReportResponse = {
		content: '# Marktverkenningsrapport\n\n## Managementsamenvatting...'
	};

	it('has required content field', () => {
		expect(mockResponse.content).toBeDefined();
		expect(typeof mockResponse.content).toBe('string');
	});

	it('content is non-empty', () => {
		expect(mockResponse.content.length).toBeGreaterThan(0);
	});
});

// =============================================================================
// SAVE MARKET RESEARCH TYPES
// =============================================================================

describe('SaveMarketResearchRequest type shape', () => {
	const mockRequest: SaveMarketResearchRequest = {
		activity_type: 'rfi',
		content: 'RFI vragenlijst tekst...'
	};

	it('has required fields', () => {
		expect(mockRequest.activity_type).toBeDefined();
		expect(mockRequest.content).toBeDefined();
	});

	it('supports optional metadata', () => {
		const withMeta: SaveMarketResearchRequest = {
			...mockRequest,
			metadata: { questions_count: 10 }
		};
		expect(withMeta.metadata).toBeDefined();
		expect(withMeta.metadata?.questions_count).toBe(10);
	});

	it('activity_type is a string', () => {
		expect(typeof mockRequest.activity_type).toBe('string');
	});

	it('content is a string', () => {
		expect(typeof mockRequest.content).toBe('string');
	});
});
