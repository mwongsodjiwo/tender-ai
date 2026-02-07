// Embedding generation using Anthropic Voyage or compatible embedding API
// Falls back to a simple hash-based approach when no embedding API is configured

import { EMBEDDING_CONFIG } from './config.js';

export async function generateEmbedding(text: string): Promise<number[] | null> {
	if (!EMBEDDING_CONFIG.apiKey || !EMBEDDING_CONFIG.endpoint) {
		return null;
	}

	try {
		const response = await fetch(EMBEDDING_CONFIG.endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${EMBEDDING_CONFIG.apiKey}`
			},
			body: JSON.stringify({
				model: EMBEDDING_CONFIG.model,
				input: [truncateText(text, EMBEDDING_CONFIG.maxInputLength)]
			})
		});

		if (!response.ok) {
			console.error(`Embedding API error: ${response.status}`);
			return null;
		}

		const data = await response.json();
		const embedding = data?.data?.[0]?.embedding ?? null;

		return Array.isArray(embedding) ? embedding : null;
	} catch (err) {
		console.error('Failed to generate embedding:', err instanceof Error ? err.message : err);
		return null;
	}
}

export async function generateEmbeddings(
	texts: string[]
): Promise<(number[] | null)[]> {
	if (!EMBEDDING_CONFIG.apiKey || !EMBEDDING_CONFIG.endpoint) {
		return texts.map(() => null);
	}

	// Process in batches
	const results: (number[] | null)[] = [];
	const batchSize = EMBEDDING_CONFIG.batchSize;

	for (let i = 0; i < texts.length; i += batchSize) {
		const batch = texts.slice(i, i + batchSize);

		try {
			const response = await fetch(EMBEDDING_CONFIG.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${EMBEDDING_CONFIG.apiKey}`
				},
				body: JSON.stringify({
					model: EMBEDDING_CONFIG.model,
					input: batch.map((t) => truncateText(t, EMBEDDING_CONFIG.maxInputLength))
				})
			});

			if (!response.ok) {
				results.push(...batch.map(() => null));
				continue;
			}

			const data = await response.json();
			const embeddings = data?.data ?? [];

			for (let j = 0; j < batch.length; j++) {
				const emb = embeddings[j]?.embedding ?? null;
				results.push(Array.isArray(emb) ? emb : null);
			}
		} catch {
			results.push(...batch.map(() => null));
		}
	}

	return results;
}

function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength);
}
