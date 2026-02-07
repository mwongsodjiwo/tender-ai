// Text chunker — splits documents into chunks for embedding

import { HARVESTER_CONFIG } from './config.js';

interface TextChunk {
	content: string;
	chunk_index: number;
	token_count: number;
}

export function chunkText(
	text: string,
	chunkSize: number = HARVESTER_CONFIG.chunkSize,
	chunkOverlap: number = HARVESTER_CONFIG.chunkOverlap
): TextChunk[] {
	if (!text || text.trim().length === 0) {
		return [];
	}

	const cleanedText = text.replace(/\s+/g, ' ').trim();

	if (cleanedText.length <= chunkSize) {
		return [{
			content: cleanedText,
			chunk_index: 0,
			token_count: estimateTokenCount(cleanedText)
		}];
	}

	const chunks: TextChunk[] = [];
	let startIndex = 0;
	let chunkIndex = 0;

	while (startIndex < cleanedText.length) {
		let endIndex = startIndex + chunkSize;

		if (endIndex < cleanedText.length) {
			// Try to break at sentence boundary
			endIndex = findSentenceBoundary(cleanedText, startIndex, endIndex);
		} else {
			endIndex = cleanedText.length;
		}

		const content = cleanedText.substring(startIndex, endIndex).trim();

		if (content.length > 0) {
			chunks.push({
				content,
				chunk_index: chunkIndex,
				token_count: estimateTokenCount(content)
			});
			chunkIndex++;
		}

		startIndex = endIndex - chunkOverlap;

		if (startIndex >= cleanedText.length) break;
		if (endIndex === cleanedText.length) break;
	}

	return chunks;
}

function findSentenceBoundary(
	text: string,
	startIndex: number,
	targetEnd: number
): number {
	const SEARCH_WINDOW = 100;
	const searchStart = Math.max(targetEnd - SEARCH_WINDOW, startIndex);
	const searchRegion = text.substring(searchStart, targetEnd);

	// Look for sentence endings (. ! ? followed by space or end)
	const sentenceEndings = /[.!?]\s/g;
	let lastMatch: RegExpExecArray | null = null;
	let match: RegExpExecArray | null;

	while ((match = sentenceEndings.exec(searchRegion)) !== null) {
		lastMatch = match;
	}

	if (lastMatch) {
		return searchStart + lastMatch.index + lastMatch[0].length;
	}

	// Fall back to word boundary
	const lastSpace = text.lastIndexOf(' ', targetEnd);
	if (lastSpace > startIndex) {
		return lastSpace + 1;
	}

	return targetEnd;
}

function estimateTokenCount(text: string): number {
	// Rough estimation: ~4 characters per token for Dutch text
	const CHARS_PER_TOKEN = 4;
	return Math.ceil(text.length / CHARS_PER_TOKEN);
}
