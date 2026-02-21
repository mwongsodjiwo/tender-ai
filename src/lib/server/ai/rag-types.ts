// Types and utilities for RAG pipeline

export interface ChunkInput {
	content: string;
	chunkIndex: number;
	tokenCount: number;
}

export interface SemanticSearchResult {
	source: 'document' | 'tenderned';
	id: string;
	title: string;
	snippet: string;
	relevance: number;
	chunkId: string;
}

export function formatEmbedding(embedding: number[] | null): string | null {
	if (!embedding) return null;
	return `[${embedding.join(',')}]`;
}

export function extractSnippet(text: string, query: string): string {
	const SNIPPET_RADIUS = 150;
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();

	const index = lowerText.indexOf(lowerQuery);
	if (index === -1) return text.substring(0, SNIPPET_RADIUS * 2);

	const start = Math.max(0, index - SNIPPET_RADIUS);
	const end = Math.min(text.length, index + lowerQuery.length + SNIPPET_RADIUS);

	let snippet = text.substring(start, end).trim();
	if (start > 0) snippet = `...${snippet}`;
	if (end < text.length) snippet = `${snippet}...`;

	return snippet;
}

export function calculateTextRelevance(text: string, query: string): number {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const words = lowerQuery.split(/\s+/);

	let score = 0;

	if (lowerText.includes(lowerQuery)) score += 10;

	for (const word of words) {
		if (word.length < 2) continue;
		const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
		const matches = lowerText.match(regex);
		if (matches) score += matches.length;
	}

	return score / Math.log(text.length + 1);
}
