// Semantic search and text-based fallback search

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentChunkWithDocument, TenderNedChunkWithItem } from '$types';
import { generateEmbedding } from './embeddings.js';
import {
	formatEmbedding,
	extractSnippet,
	calculateTextRelevance
} from './rag-types.js';
import type { SemanticSearchResult } from './rag-types.js';

export async function semanticSearch(
	supabase: SupabaseClient,
	query: string,
	options: {
		projectId?: string;
		organizationId?: string;
		limit?: number;
		threshold?: number;
	} = {}
): Promise<SemanticSearchResult[]> {
	const {
		limit = 5,
		threshold = 0.7,
		projectId,
		organizationId
	} = options;

	const queryEmbedding = await generateEmbedding(query);

	// If embedding generation fails, fall back to text search
	if (!queryEmbedding) {
		return fallbackTextSearch(supabase, query, { projectId, limit });
	}

	const results: SemanticSearchResult[] = [];

	// Search document chunks
	const { data: docChunks } = await supabase.rpc('match_document_chunks', {
		query_embedding: formatEmbedding(queryEmbedding),
		match_threshold: threshold,
		match_count: limit,
		filter_project_id: projectId ?? null,
		filter_organization_id: organizationId ?? null
	});

	for (const chunk of docChunks ?? []) {
		results.push({
			source: 'document',
			id: chunk.document_id,
			title: chunk.document_name,
			snippet: chunk.content,
			relevance: chunk.similarity,
			chunkId: chunk.id
		});
	}

	// Search TenderNed chunks
	const { data: tenderChunks } = await supabase.rpc('match_tenderned_chunks', {
		query_embedding: formatEmbedding(queryEmbedding),
		match_threshold: threshold,
		match_count: limit
	});

	for (const chunk of tenderChunks ?? []) {
		results.push({
			source: 'tenderned',
			id: chunk.tenderned_item_id,
			title: chunk.item_title,
			snippet: chunk.content,
			relevance: chunk.similarity,
			chunkId: chunk.id
		});
	}

	// Sort by relevance and limit
	results.sort((a, b) => b.relevance - a.relevance);
	return results.slice(0, limit);
}

async function fallbackTextSearch(
	supabase: SupabaseClient,
	query: string,
	options: { projectId?: string; limit?: number }
): Promise<SemanticSearchResult[]> {
	const { projectId, limit = 5 } = options;
	const results: SemanticSearchResult[] = [];

	// Search document chunks by text
	let docQuery = supabase
		.from('document_chunks')
		.select('id, document_id, content, documents!inner(name, deleted_at)')
		.ilike('content', `%${query}%`)
		.limit(limit);

	if (projectId) {
		docQuery = docQuery.eq('documents.project_id', projectId);
	}

	const { data: docChunks } = await docQuery.returns<DocumentChunkWithDocument[]>();

	for (const chunk of docChunks ?? []) {
		if (chunk.documents?.deleted_at) continue;

		results.push({
			source: 'document',
			id: chunk.document_id,
			title: chunk.documents?.name ?? 'Onbekend document',
			snippet: extractSnippet(chunk.content, query),
			relevance: calculateTextRelevance(chunk.content, query),
			chunkId: chunk.id
		});
	}

	// Search TenderNed chunks by text
	const { data: tenderChunks } = await supabase
		.from('tenderned_chunks')
		.select('id, tenderned_item_id, content, tenderned_items!inner(title)')
		.ilike('content', `%${query}%`)
		.limit(limit)
		.returns<TenderNedChunkWithItem[]>();

	for (const chunk of tenderChunks ?? []) {
		results.push({
			source: 'tenderned',
			id: chunk.tenderned_item_id,
			title: chunk.tenderned_items?.title ?? 'Onbekende aanbesteding',
			snippet: extractSnippet(chunk.content, query),
			relevance: calculateTextRelevance(chunk.content, query),
			chunkId: chunk.id
		});
	}

	results.sort((a, b) => b.relevance - a.relevance);
	return results.slice(0, limit);
}
