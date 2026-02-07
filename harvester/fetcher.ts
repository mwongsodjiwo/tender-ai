// TenderNed data fetcher — retrieves data from TenderNed API

import { HARVESTER_CONFIG } from './config.js';

interface FetchResult {
	items: Record<string, unknown>[];
	totalCount: number;
	page: number;
	hasMore: boolean;
}

export async function fetchTenderNedPage(
	page: number = 0,
	pageSize: number = HARVESTER_CONFIG.pageSize
): Promise<FetchResult> {
	const url = new URL(`${HARVESTER_CONFIG.baseUrl}/publicaties`);
	url.searchParams.set('pagina', String(page));
	url.searchParams.set('resultatenPerPagina', String(pageSize));
	url.searchParams.set('sortering', 'publicatieDatum');
	url.searchParams.set('sorteerRichting', 'DESC');

	const response = await fetch(url.toString(), {
		headers: {
			'Accept': 'application/json',
			'User-Agent': 'TendermanagerAI/1.0 (harvester)'
		}
	});

	if (!response.ok) {
		throw new Error(
			`TenderNed API error: ${response.status} ${response.statusText}`
		);
	}

	const data = await response.json();

	const items = data.resultaten ?? data.publicaties ?? data ?? [];
	const totalCount = data.totaalAantal ?? data.aantalResultaten ?? items.length;
	const hasMore = (page + 1) * pageSize < totalCount;

	return {
		items: Array.isArray(items) ? items : [],
		totalCount,
		page,
		hasMore
	};
}

export async function fetchAllPages(
	maxItems: number = HARVESTER_CONFIG.maxItemsPerRun
): Promise<Record<string, unknown>[]> {
	const allItems: Record<string, unknown>[] = [];
	let page = 0;
	let hasMore = true;

	while (hasMore && allItems.length < maxItems) {
		const result = await fetchTenderNedPage(page);
		allItems.push(...result.items);
		hasMore = result.hasMore;
		page++;

		if (hasMore) {
			await delay(HARVESTER_CONFIG.requestDelayMs);
		}
	}

	return allItems.slice(0, maxItems);
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
