// Unit tests for KVK API client — searchKvk and getKvkProfile with mocked fetch

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the SvelteKit private env module (must match exact export names from kvk.ts)
vi.mock('$env/static/private', () => ({
	KVK_API_KEY: 'test-kvk-api-key'
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { searchKvk, getKvkProfile, KvkApiError } from '$server/api/kvk';

const MOCK_SEARCH_RESPONSE = {
	pagina: 1,
	resultatenPerPagina: 10,
	totaal: 1,
	resultaten: [
		{
			kvkNummer: '12345678',
			naam: 'Test B.V.',
			adres: {
				straatnaam: 'Hoofdstraat',
				huisnummer: '1',
				postcode: '1234AB',
				plaats: 'Amsterdam'
			},
			type: 'hoofdvestiging',
			actief: 'Ja'
		}
	]
};

const MOCK_PROFIEL_RESPONSE = {
	kvkNummer: '12345678',
	naam: 'Test B.V.',
	rechtsvorm: 'Besloten Vennootschap',
	hoofdvestiging: {
		vestigingsnummer: '000012345678',
		handelsnamen: ['Test B.V.'],
		adressen: [
			{
				straatnaam: 'Hoofdstraat',
				huisnummer: '1',
				postcode: '1234AB',
				plaats: 'Amsterdam'
			}
		],
		sbiActiviteiten: [
			{
				sbiCode: '62.01',
				sbiOmschrijving: 'Ontwikkelen en produceren van software',
				indHoofdactiviteit: 'Ja'
			}
		]
	}
};

beforeEach(() => {
	mockFetch.mockReset();
});

// =============================================================================
// searchKvk
// =============================================================================

describe('searchKvk', () => {
	it('returns search results on success', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(MOCK_SEARCH_RESPONSE)
		});

		const results = await searchKvk({ naam: 'Test' });

		expect(results).toHaveLength(1);
		expect(results[0].kvkNummer).toBe('12345678');
		expect(results[0].naam).toBe('Test B.V.');
	});

	it('passes search params to URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ ...MOCK_SEARCH_RESPONSE, resultaten: [] })
		});

		await searchKvk({ naam: 'Bedrijf', plaats: 'Rotterdam', pagina: 2 });

		const calledUrl = mockFetch.mock.calls[0][0] as string;
		expect(calledUrl).toContain('naam=Bedrijf');
		expect(calledUrl).toContain('plaats=Rotterdam');
		expect(calledUrl).toContain('pagina=2');
	});

	it('sends API key in headers', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(MOCK_SEARCH_RESPONSE)
		});

		await searchKvk({ naam: 'Test' });

		const headers = mockFetch.mock.calls[0][1].headers;
		expect(headers.apikey).toBe('test-kvk-api-key');
	});

	it('throws KvkApiError on HTTP failure', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error'
		});

		await expect(searchKvk({ naam: 'Test' })).rejects.toThrow(KvkApiError);
	});

	it('returns empty array when no results', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ ...MOCK_SEARCH_RESPONSE, resultaten: [] })
		});

		const results = await searchKvk({ naam: 'Nonexistent' });
		expect(results).toEqual([]);
	});
});

// =============================================================================
// getKvkProfile
// =============================================================================

describe('getKvkProfile', () => {
	it('returns profile on success', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(MOCK_PROFIEL_RESPONSE)
		});

		const profiel = await getKvkProfile('12345678');

		expect(profiel.kvkNummer).toBe('12345678');
		expect(profiel.rechtsvorm).toBe('Besloten Vennootschap');
		expect(profiel.hoofdvestiging.sbiActiviteiten).toHaveLength(1);
	});

	it('calls correct basisprofiel URL', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(MOCK_PROFIEL_RESPONSE)
		});

		await getKvkProfile('12345678');

		const calledUrl = mockFetch.mock.calls[0][0] as string;
		expect(calledUrl).toContain('/basisprofielen/12345678');
	});

	it('throws KvkApiError on 404', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			statusText: 'Not Found'
		});

		try {
			await getKvkProfile('99999999');
		} catch (error) {
			expect(error).toBeInstanceOf(KvkApiError);
			expect((error as KvkApiError).statusCode).toBe(404);
		}
	});

	it('throws KvkApiError on server error', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 503,
			statusText: 'Service Unavailable'
		});

		await expect(getKvkProfile('12345678')).rejects.toThrow(KvkApiError);
	});
});

// =============================================================================
// KvkApiError
// =============================================================================

describe('KvkApiError', () => {
	it('has correct name and statusCode', () => {
		const error = new KvkApiError('test error', 502);
		expect(error.name).toBe('KvkApiError');
		expect(error.statusCode).toBe(502);
		expect(error.message).toBe('test error');
	});

	it('is instanceof Error', () => {
		const error = new KvkApiError('test', 500);
		expect(error).toBeInstanceOf(Error);
	});
});
