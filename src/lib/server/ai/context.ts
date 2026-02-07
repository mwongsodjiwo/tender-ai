// Context agent — searches uploaded documents and TenderNed data
// Uses RAG pipeline for semantic search with embedding fallback to text search

import type { SupabaseClient } from '@supabase/supabase-js';
import { semanticSearch } from './rag.js';

interface ContextSearchParams {
	supabase: SupabaseClient;
	query: string;
	projectId?: string;
	organizationId?: string;
	limit?: number;
}

interface ContextResult {
	source: 'document' | 'tenderned';
	id: string;
	title: string;
	snippet: string;
	relevance: number;
}

export async function searchContext(params: ContextSearchParams): Promise<ContextResult[]> {
	const { supabase, query, projectId, organizationId, limit = 5 } = params;

	const results = await semanticSearch(supabase, query, {
		projectId,
		organizationId,
		limit
	});

	return results.map((r) => ({
		source: r.source,
		id: r.id,
		title: r.title,
		snippet: r.snippet,
		relevance: r.relevance
	}));
}

export function formatContextForPrompt(results: ContextResult[]): string {
	if (results.length === 0) return '';

	const sections = results.map((r, i) => {
		const sourceLabel = r.source === 'document' ? 'Document' : 'TenderNed';
		return `[${sourceLabel} ${i + 1}] ${r.title}\n${r.snippet}`;
	});

	return `\n\n--- Relevante context ---\n${sections.join('\n\n')}\n--- Einde context ---\n`;
}
