// Context agent — searches uploaded documents and TenderNed data via embeddings

import Anthropic from '@anthropic-ai/sdk';
import { AI_CONFIG } from './config.js';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ContextSearchParams {
	supabase: SupabaseClient;
	query: string;
	projectId?: string;
	limit?: number;
}

interface ContextResult {
	source: 'document' | 'tenderned';
	id: string;
	title: string;
	snippet: string;
	relevance: number;
}

const anthropic = new Anthropic({ apiKey: AI_CONFIG.apiKey });

async function generateEmbedding(text: string): Promise<number[] | null> {
	// Use Anthropic to generate a search-optimized query
	// For actual embedding, we would use a dedicated embedding model
	// For now, fall back to text-based search
	return null;
}

export async function searchContext(params: ContextSearchParams): Promise<ContextResult[]> {
	const { supabase, query, projectId, limit = 5 } = params;
	const results: ContextResult[] = [];

	// Search uploaded documents (text-based for now, embedding-based when available)
	const docQuery = supabase
		.from('documents')
		.select('id, name, content_text')
		.is('deleted_at', null)
		.not('content_text', 'is', null)
		.ilike('content_text', `%${query}%`)
		.limit(limit);

	if (projectId) {
		docQuery.or(`project_id.eq.${projectId},project_id.is.null`);
	}

	const { data: documents } = await docQuery;

	for (const doc of documents ?? []) {
		const snippet = extractSnippet(doc.content_text ?? '', query);
		if (snippet) {
			results.push({
				source: 'document',
				id: doc.id,
				title: doc.name,
				snippet,
				relevance: calculateRelevance(doc.content_text ?? '', query)
			});
		}
	}

	// Search TenderNed items
	const { data: tenderItems } = await supabase
		.from('tenderned_items')
		.select('id, title, description')
		.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
		.limit(limit);

	for (const item of tenderItems ?? []) {
		const searchText = `${item.title} ${item.description ?? ''}`;
		const snippet = extractSnippet(searchText, query);
		results.push({
			source: 'tenderned',
			id: item.id,
			title: item.title,
			snippet: snippet ?? item.description?.substring(0, 200) ?? '',
			relevance: calculateRelevance(searchText, query)
		});
	}

	// Sort by relevance and limit
	results.sort((a, b) => b.relevance - a.relevance);
	return results.slice(0, limit);
}

function extractSnippet(text: string, query: string): string | null {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const SNIPPET_RADIUS = 150;

	const index = lowerText.indexOf(lowerQuery);
	if (index === -1) return null;

	const start = Math.max(0, index - SNIPPET_RADIUS);
	const end = Math.min(text.length, index + lowerQuery.length + SNIPPET_RADIUS);

	let snippet = text.substring(start, end).trim();
	if (start > 0) snippet = `...${snippet}`;
	if (end < text.length) snippet = `${snippet}...`;

	return snippet;
}

function calculateRelevance(text: string, query: string): number {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const words = lowerQuery.split(/\s+/);

	let score = 0;

	// Exact phrase match
	if (lowerText.includes(lowerQuery)) {
		score += 10;
	}

	// Individual word matches
	for (const word of words) {
		if (word.length < 2) continue;
		const regex = new RegExp(word, 'gi');
		const matches = lowerText.match(regex);
		if (matches) {
			score += matches.length;
		}
	}

	// Normalize by text length
	return score / Math.log(text.length + 1);
}
