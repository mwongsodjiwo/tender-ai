// RAG pipeline — processes uploads, generates embeddings, enables semantic search

import type { SupabaseClient } from '@supabase/supabase-js';
import { generateEmbedding, generateEmbeddings } from './embeddings.js';
import { EMBEDDING_CONFIG } from './config.js';

interface ChunkInput {
	content: string;
	chunkIndex: number;
	tokenCount: number;
}

// =============================================================================
// DOCUMENT PROCESSING
// =============================================================================

export async function processDocumentChunks(
	supabase: SupabaseClient,
	documentId: string,
	textContent: string
): Promise<number> {
	const chunks = splitIntoChunks(textContent);

	if (chunks.length === 0) return 0;

	// Delete existing chunks
	await supabase
		.from('document_chunks')
		.delete()
		.eq('document_id', documentId);

	// Generate embeddings for all chunks
	const embeddings = await generateEmbeddings(
		chunks.map((c) => c.content)
	);

	// Store chunks with embeddings
	const chunkRecords = chunks.map((chunk, i) => ({
		document_id: documentId,
		chunk_index: chunk.chunkIndex,
		content: chunk.content,
		token_count: chunk.tokenCount,
		embedding: embeddings[i] ? formatEmbedding(embeddings[i]) : null,
		metadata: {}
	}));

	const { error } = await supabase
		.from('document_chunks')
		.insert(chunkRecords);

	if (error) {
		console.error('Failed to store document chunks:', error.message);
		return 0;
	}

	return chunks.length;
}

// =============================================================================
// SEMANTIC SEARCH
// =============================================================================

interface SemanticSearchResult {
	source: 'document' | 'tenderned';
	id: string;
	title: string;
	snippet: string;
	relevance: number;
	chunkId: string;
}

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

// =============================================================================
// FALLBACK TEXT SEARCH
// =============================================================================

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

	const { data: docChunks } = await docQuery;

	for (const chunk of docChunks ?? []) {
		const doc = chunk.documents as unknown as { name: string; deleted_at: string | null };
		if (doc?.deleted_at) continue;

		results.push({
			source: 'document',
			id: chunk.document_id,
			title: doc?.name ?? 'Onbekend document',
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
		.limit(limit);

	for (const chunk of tenderChunks ?? []) {
		const item = chunk.tenderned_items as unknown as { title: string };
		results.push({
			source: 'tenderned',
			id: chunk.tenderned_item_id,
			title: item?.title ?? 'Onbekende aanbesteding',
			snippet: extractSnippet(chunk.content, query),
			relevance: calculateTextRelevance(chunk.content, query),
			chunkId: chunk.id
		});
	}

	results.sort((a, b) => b.relevance - a.relevance);
	return results.slice(0, limit);
}

// =============================================================================
// HELPERS
// =============================================================================

function splitIntoChunks(text: string): ChunkInput[] {
	const CHUNK_SIZE = 1000;
	const CHUNK_OVERLAP = 200;
	const CHARS_PER_TOKEN = 4;

	const cleanedText = text.replace(/\s+/g, ' ').trim();

	if (cleanedText.length === 0) return [];

	if (cleanedText.length <= CHUNK_SIZE) {
		return [{
			content: cleanedText,
			chunkIndex: 0,
			tokenCount: Math.ceil(cleanedText.length / CHARS_PER_TOKEN)
		}];
	}

	const chunks: ChunkInput[] = [];
	let start = 0;
	let index = 0;

	while (start < cleanedText.length) {
		let end = start + CHUNK_SIZE;

		if (end < cleanedText.length) {
			// Try to break at sentence boundary
			const searchStart = Math.max(end - 100, start);
			const searchRegion = cleanedText.substring(searchStart, end);
			const lastSentence = searchRegion.lastIndexOf('. ');

			if (lastSentence > -1) {
				end = searchStart + lastSentence + 2;
			} else {
				const lastSpace = cleanedText.lastIndexOf(' ', end);
				if (lastSpace > start) end = lastSpace + 1;
			}
		} else {
			end = cleanedText.length;
		}

		const content = cleanedText.substring(start, end).trim();
		if (content.length > 0) {
			chunks.push({
				content,
				chunkIndex: index,
				tokenCount: Math.ceil(content.length / CHARS_PER_TOKEN)
			});
			index++;
		}

		start = end - CHUNK_OVERLAP;
		if (start >= cleanedText.length || end === cleanedText.length) break;
	}

	return chunks;
}

function formatEmbedding(embedding: number[] | null): string | null {
	if (!embedding) return null;
	return `[${embedding.join(',')}]`;
}

function extractSnippet(text: string, query: string): string {
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

function calculateTextRelevance(text: string, query: string): number {
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
