// Document processing and context building for RAG pipeline

import type { SupabaseClient } from '@supabase/supabase-js';
import { generateEmbeddings } from './embeddings.js';
import { logError } from '$server/logger';
import { formatEmbedding } from './rag-types.js';
import type { ChunkInput } from './rag-types.js';

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
		logError('Failed to store document chunks', error.message);
		return 0;
	}

	return chunks.length;
}

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
