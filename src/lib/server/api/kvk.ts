// KVK API client — server-side proxy to KVK Zoeken & Basisprofiel API

import { KVK_API_KEY } from '$env/static/private';
import type {
	KvkSearchParams,
	KvkSearchResult,
	KvkSearchResponse,
	KvkBasisProfiel
} from '$types/api/kvk.js';

const KVK_TIMEOUT_MS = 10_000;
const DEFAULT_RESULTS_PER_PAGE = 10;
const KVK_BASE_URL = 'https://api.kvk.nl/api/v2';

function buildSearchUrl(params: KvkSearchParams): string {
	const base = KVK_BASE_URL;
	const url = new URL(`${base}/zoeken`);

	if (params.naam) url.searchParams.set('naam', params.naam);
	if (params.kvkNummer) url.searchParams.set('kvkNummer', params.kvkNummer);
	if (params.plaats) url.searchParams.set('plaats', params.plaats);
	if (params.type) url.searchParams.set('type', params.type);

	url.searchParams.set(
		'resultatenPerPagina',
		String(params.resultatenPerPagina ?? DEFAULT_RESULTS_PER_PAGE)
	);
	url.searchParams.set('pagina', String(params.pagina ?? 1));

	return url.toString();
}

function getHeaders(): Record<string, string> {
	return {
		apikey: KVK_API_KEY,
		Accept: 'application/json'
	};
}

export async function searchKvk(
	params: KvkSearchParams
): Promise<KvkSearchResult[]> {
	const url = buildSearchUrl(params);

	const response = await fetch(url, {
		headers: getHeaders(),
		signal: AbortSignal.timeout(KVK_TIMEOUT_MS)
	});

	if (!response.ok) {
		throw new KvkApiError(
			`KVK zoeken mislukt: ${response.status} ${response.statusText}`,
			response.status
		);
	}

	const data: KvkSearchResponse = await response.json();
	return data.resultaten ?? [];
}

export async function getKvkProfile(
	kvkNummer: string
): Promise<KvkBasisProfiel> {
	const url = `https://api.kvk.nl/api/v1/basisprofielen/${kvkNummer}`;

	const response = await fetch(url, {
		headers: getHeaders(),
		signal: AbortSignal.timeout(KVK_TIMEOUT_MS)
	});

	if (!response.ok) {
		throw new KvkApiError(
			`KVK basisprofiel mislukt: ${response.status} ${response.statusText}`,
			response.status
		);
	}

	return response.json();
}

export class KvkApiError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number
	) {
		super(message);
		this.name = 'KvkApiError';
	}
}
