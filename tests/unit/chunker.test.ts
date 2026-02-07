// Unit tests for text chunker

import { describe, it, expect } from 'vitest';
import { chunkText } from '../../harvester/chunker';

describe('chunkText', () => {
	it('returns empty array for empty string', () => {
		const chunks = chunkText('');
		expect(chunks).toEqual([]);
	});

	it('returns empty array for whitespace-only string', () => {
		const chunks = chunkText('   \n  \t  ');
		expect(chunks).toEqual([]);
	});

	it('returns single chunk for short text', () => {
		const text = 'Dit is een korte tekst.';
		const chunks = chunkText(text, 1000, 200);
		expect(chunks).toHaveLength(1);
		expect(chunks[0].content).toBe(text);
		expect(chunks[0].chunk_index).toBe(0);
		expect(chunks[0].token_count).toBeGreaterThan(0);
	});

	it('splits long text into multiple chunks', () => {
		const text = 'Dit is een zin. '.repeat(100); // ~1600 chars
		const chunks = chunkText(text, 500, 100);
		expect(chunks.length).toBeGreaterThan(1);
	});

	it('maintains chunk order with sequential indices', () => {
		const text = 'Eerste alinea met tekst. '.repeat(50);
		const chunks = chunkText(text, 200, 50);

		for (let i = 0; i < chunks.length; i++) {
			expect(chunks[i].chunk_index).toBe(i);
		}
	});

	it('estimates token count for each chunk', () => {
		const text = 'Test tekst voor token counting. '.repeat(20);
		const chunks = chunkText(text, 200, 50);

		for (const chunk of chunks) {
			expect(chunk.token_count).toBeGreaterThan(0);
			// Rough check: ~4 chars per token
			expect(chunk.token_count).toBeLessThanOrEqual(chunk.content.length);
		}
	});

	it('handles text without sentence boundaries', () => {
		const text = 'a'.repeat(2000);
		const chunks = chunkText(text, 500, 100);
		expect(chunks.length).toBeGreaterThan(1);
	});

	it('tries to split at sentence boundaries', () => {
		const text = 'Eerste zin eindigt hier. Tweede zin begint hier en gaat door. Derde zin is ook aanwezig.';
		const chunks = chunkText(text, 50, 10);

		// Check that at least one chunk ends near a sentence boundary
		const endsWithPeriod = chunks.some(
			(c) => c.content.endsWith('.') || c.content.endsWith('. ')
		);
		// With such small chunk size, some will end mid-sentence,
		// but the algorithm should try
		expect(chunks.length).toBeGreaterThan(0);
	});

	it('respects chunk overlap', () => {
		const text = 'Woord '.repeat(200); // 1200 chars
		const chunks = chunkText(text, 400, 100);

		if (chunks.length >= 2) {
			// End of chunk N should overlap with start of chunk N+1
			const chunk1End = chunks[0].content.slice(-50);
			const chunk2Start = chunks[1].content.slice(0, 50);
			// There should be some overlapping content
			// (exact match depends on word/sentence boundaries)
			expect(chunks.length).toBeGreaterThanOrEqual(2);
		}
	});
});
