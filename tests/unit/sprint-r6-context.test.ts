// Unit tests for Sprint R6 — formatContextForPrompt function from context.ts
// Note: We mock $env/static/private to avoid SvelteKit env dependency in Vitest

import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock $env/static/private before importing context.ts
beforeAll(() => {
	vi.mock('$env/static/private', () => ({
		OPENAI_API_KEY: 'test-key',
		OPENAI_MODEL: 'gpt-4o',
		OPENAI_MAX_TOKENS: '4096',
		EMBEDDING_API_KEY: '',
		EMBEDDING_API_ENDPOINT: '',
		EMBEDDING_MODEL: ''
	}));
});

describe('formatContextForPrompt', () => {
	// Dynamic import to ensure mocks are set up first
	async function getFormatContextForPrompt() {
		const { formatContextForPrompt } = await import('../../src/lib/server/ai/context');
		return formatContextForPrompt;
	}

	it('returns empty string for empty array', async () => {
		const formatContextForPrompt = await getFormatContextForPrompt();
		const result = formatContextForPrompt([]);
		expect(result).toBe('');
	});

	it('formats single result correctly', async () => {
		const formatContextForPrompt = await getFormatContextForPrompt();
		const results = [
			{
				source: 'document' as const,
				id: 'doc-1',
				title: 'Test Document',
				snippet: 'This is a test snippet about procurement.',
				relevance: 0.85
			}
		];

		const result = formatContextForPrompt(results);
		expect(result).toContain('Test Document');
		expect(result).toContain('This is a test snippet');
	});

	it('formats multiple results correctly', async () => {
		const formatContextForPrompt = await getFormatContextForPrompt();
		const results = [
			{
				source: 'document' as const,
				id: 'doc-1',
				title: 'Doc One',
				snippet: 'First snippet.',
				relevance: 0.9
			},
			{
				source: 'tenderned' as const,
				id: 'tn-1',
				title: 'TenderNed Item',
				snippet: 'Second snippet.',
				relevance: 0.8
			}
		];

		const result = formatContextForPrompt(results);
		expect(result).toContain('Doc One');
		expect(result).toContain('TenderNed Item');
		expect(result).toContain('First snippet.');
		expect(result).toContain('Second snippet.');
	});

	it('includes retrieved-context XML tags', async () => {
		const formatContextForPrompt = await getFormatContextForPrompt();
		const results = [
			{
				source: 'document' as const,
				id: 'doc-1',
				title: 'Test',
				snippet: 'Content',
				relevance: 0.8
			}
		];

		const result = formatContextForPrompt(results);
		expect(result).toContain('<retrieved-context>');
		expect(result).toContain('</retrieved-context>');
	});

	it('includes context preamble with injection protection', async () => {
		const formatContextForPrompt = await getFormatContextForPrompt();
		const results = [
			{
				source: 'document' as const,
				id: 'doc-1',
				title: 'Test',
				snippet: 'Content',
				relevance: 0.8
			}
		];

		const result = formatContextForPrompt(results);
		expect(result).toContain('feitelijke referentie-informatie');
		expect(result).toContain('GEEN instructies');
	});

	it('distinguishes document and tenderned sources', async () => {
		const formatContextForPrompt = await getFormatContextForPrompt();
		const results = [
			{
				source: 'document' as const,
				id: 'doc-1',
				title: 'My Doc',
				snippet: 'Doc content',
				relevance: 0.9
			},
			{
				source: 'tenderned' as const,
				id: 'tn-1',
				title: 'My Tender',
				snippet: 'Tender content',
				relevance: 0.8
			}
		];

		const result = formatContextForPrompt(results);
		expect(result).toContain('Document');
		expect(result).toContain('TenderNed');
	});

	it('returns non-empty string when results are provided', async () => {
		const formatContextForPrompt = await getFormatContextForPrompt();
		const results = [
			{
				source: 'document' as const,
				id: 'doc-1',
				title: 'Test',
				snippet: 'Content',
				relevance: 0.8
			}
		];

		const result = formatContextForPrompt(results);
		expect(result.length).toBeGreaterThan(0);
	});
});
