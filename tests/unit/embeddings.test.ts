// Unit tests for embedding generation

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config and logger before importing
vi.mock('$server/ai/config', () => ({
	EMBEDDING_CONFIG: {
		apiKey: 'test-key',
		endpoint: 'https://api.test.com/embeddings',
		model: 'test-model',
		dimensions: 1536,
		maxInputLength: 8000,
		batchSize: 2
	}
}));

vi.mock('$server/logger', () => ({
	logError: vi.fn()
}));

import { generateEmbedding, generateEmbeddings } from '$server/ai/embeddings';

describe('generateEmbedding', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('returns embedding array on success', async () => {
		const mockEmbedding = [0.1, 0.2, 0.3];
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: [{ embedding: mockEmbedding }] })
		});

		const result = await generateEmbedding('test text');
		expect(result).toEqual(mockEmbedding);
	});

	it('sends correct request to API', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: [{ embedding: [0.1] }] })
		});

		await generateEmbedding('test text');
		expect(global.fetch).toHaveBeenCalledWith(
			'https://api.test.com/embeddings',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Authorization': 'Bearer test-key'
				})
			})
		);
	});

	it('returns null on API error', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500
		});

		const result = await generateEmbedding('test');
		expect(result).toBeNull();
	});

	it('returns null on network error', async () => {
		global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

		const result = await generateEmbedding('test');
		expect(result).toBeNull();
	});

	it('returns null when embedding is not an array', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: [{ embedding: 'not-array' }] })
		});

		const result = await generateEmbedding('test');
		expect(result).toBeNull();
	});

	it('returns null when response data is empty', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: [] })
		});

		const result = await generateEmbedding('test');
		expect(result).toBeNull();
	});

	it('truncates text longer than maxInputLength', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ data: [{ embedding: [0.1] }] })
		});

		const longText = 'x'.repeat(10000);
		await generateEmbedding(longText);

		const callBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
		expect(callBody.input[0].length).toBe(8000);
	});
});

describe('generateEmbeddings', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('returns embeddings for multiple texts', async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({
				data: [
					{ embedding: [0.1, 0.2] },
					{ embedding: [0.3, 0.4] }
				]
			})
		});

		const results = await generateEmbeddings(['text 1', 'text 2']);
		expect(results).toEqual([[0.1, 0.2], [0.3, 0.4]]);
	});

	it('processes in batches of configured batchSize', async () => {
		global.fetch = vi.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ data: [{ embedding: [0.1] }, { embedding: [0.2] }] })
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ data: [{ embedding: [0.3] }] })
			});

		// batchSize is mocked as 2, so 3 texts = 2 batches
		const results = await generateEmbeddings(['a', 'b', 'c']);
		expect(global.fetch).toHaveBeenCalledTimes(2);
		expect(results).toEqual([[0.1], [0.2], [0.3]]);
	});

	it('returns null for each text on API error', async () => {
		global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

		const results = await generateEmbeddings(['a', 'b']);
		expect(results).toEqual([null, null]);
	});

	it('returns null for each text on network error', async () => {
		global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

		const results = await generateEmbeddings(['a', 'b']);
		expect(results).toEqual([null, null]);
	});
});

describe('generateEmbedding — no API key', () => {
	it('returns null when API key is empty', async () => {
		// Reset and reimport with empty config
		vi.doMock('$server/ai/config', () => ({
			EMBEDDING_CONFIG: {
				apiKey: '',
				endpoint: '',
				model: 'test',
				dimensions: 1536,
				maxInputLength: 8000,
				batchSize: 20
			}
		}));

		const mod = await import('$server/ai/embeddings');
		const result = await mod.generateEmbedding('test');
		expect(result).toBeNull();
	});
});
