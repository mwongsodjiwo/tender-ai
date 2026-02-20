// Unit tests for Fase 7 — KVK file verification (types, client, routes, mapper)

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// =============================================================================
// KVK TYPES FILE VERIFICATION
// =============================================================================

describe('KVK types file', () => {
	const source = readFileSync(
		path.resolve('src/lib/types/api/kvk.ts'), 'utf-8'
	);

	it('exports KvkSearchParams interface', () => {
		expect(source).toContain('export interface KvkSearchParams');
	});

	it('exports KvkSearchResult interface', () => {
		expect(source).toContain('export interface KvkSearchResult');
	});

	it('exports KvkBasisProfiel interface', () => {
		expect(source).toContain('export interface KvkBasisProfiel');
	});

	it('exports KvkSearchResponse interface', () => {
		expect(source).toContain('export interface KvkSearchResponse');
	});

	it('exports KvkAdres interface', () => {
		expect(source).toContain('export interface KvkAdres');
	});

	it('exports KvkSbiActiviteit interface', () => {
		expect(source).toContain('export interface KvkSbiActiviteit');
	});
});

// =============================================================================
// KVK CLIENT FILE VERIFICATION
// =============================================================================

describe('KVK client file', () => {
	const source = readFileSync(
		path.resolve('src/lib/server/api/kvk.ts'), 'utf-8'
	);

	it('imports KVK_API_KEY from env', () => {
		expect(source).toContain('KVK_API_KEY');
		expect(source).toContain('$env/static/private');
	});

	it('exports searchKvk function', () => {
		expect(source).toContain('export async function searchKvk');
	});

	it('exports getKvkProfile function', () => {
		expect(source).toContain('export async function getKvkProfile');
	});

	it('exports KvkApiError class', () => {
		expect(source).toContain('export class KvkApiError');
	});

	it('uses /zoeken endpoint', () => {
		expect(source).toContain('/zoeken');
	});

	it('uses /basisprofielen/ endpoint', () => {
		expect(source).toContain('/basisprofielen/');
	});
});

// =============================================================================
// KVK SEARCH ROUTE FILE VERIFICATION
// =============================================================================

describe('KVK search route file', () => {
	const source = readFileSync(
		path.resolve('src/routes/api/kvk/search/+server.ts'), 'utf-8'
	);

	it('exports GET handler', () => {
		expect(source).toContain('export const GET');
	});

	it('uses kvkSearchQuerySchema', () => {
		expect(source).toContain('kvkSearchQuerySchema');
	});

	it('calls searchKvk', () => {
		expect(source).toContain('searchKvk');
	});

	it('handles KvkApiError', () => {
		expect(source).toContain('KvkApiError');
	});

	it('requires authentication', () => {
		expect(source).toContain('UNAUTHORIZED');
	});
});

// =============================================================================
// KVK PROFIEL ROUTE FILE VERIFICATION
// =============================================================================

describe('KVK profiel route file', () => {
	const source = readFileSync(
		path.resolve('src/routes/api/kvk/[kvkNummer]/+server.ts'), 'utf-8'
	);

	it('exports GET handler', () => {
		expect(source).toContain('export const GET');
	});

	it('uses kvkNummerParamSchema', () => {
		expect(source).toContain('kvkNummerParamSchema');
	});

	it('calls getKvkProfile', () => {
		expect(source).toContain('getKvkProfile');
	});

	it('handles 404 from KVK', () => {
		expect(source).toContain('NOT_FOUND');
	});

	it('handles external API error', () => {
		expect(source).toContain('EXTERNAL_API_ERROR');
	});
});

// =============================================================================
// KVK-TO-ORG MAPPER FILE VERIFICATION
// =============================================================================

describe('kvk-to-org mapper file', () => {
	const source = readFileSync(
		path.resolve('src/lib/utils/kvk-to-org.ts'), 'utf-8'
	);

	it('exports mapKvkToOrganization function', () => {
		expect(source).toContain('export function mapKvkToOrganization');
	});

	it('maps kvk_nummer', () => {
		expect(source).toContain('kvk_nummer');
	});

	it('maps handelsnaam', () => {
		expect(source).toContain('handelsnaam');
	});

	it('maps sbi_codes', () => {
		expect(source).toContain('sbi_codes');
	});

	it('imports KvkBasisProfiel type', () => {
		expect(source).toContain('KvkBasisProfiel');
	});

	it('imports UpdateOrganizationRequest type', () => {
		expect(source).toContain('UpdateOrganizationRequest');
	});
});
