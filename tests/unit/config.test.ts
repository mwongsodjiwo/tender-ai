// Unit tests for AI configuration — verifies config structure and defaults

import { describe, it, expect, vi } from 'vitest';

// Mock the SvelteKit private env module
vi.mock('$env/static/private', () => ({
	OPENAI_API_KEY: 'sk-test-key',
	OPENAI_MODEL: 'gpt-4o-test',
	OPENAI_MAX_TOKENS: '2048',
	EMBEDDING_API_KEY: 'emb-test-key',
	EMBEDDING_API_ENDPOINT: 'https://api.test.com/embed',
	EMBEDDING_MODEL: 'voyage-test'
}));

import { AI_CONFIG, EMBEDDING_CONFIG, SYSTEM_PROMPTS } from '$server/ai/config';

describe('AI_CONFIG', () => {
	it('has apiKey from environment', () => {
		expect(AI_CONFIG.apiKey).toBe('sk-test-key');
	});

	it('has model from environment', () => {
		expect(AI_CONFIG.model).toBe('gpt-4o-test');
	});

	it('has maxTokens as number', () => {
		expect(AI_CONFIG.maxTokens).toBe(2048);
		expect(typeof AI_CONFIG.maxTokens).toBe('number');
	});

	it('has defaultTemperature', () => {
		expect(AI_CONFIG.defaultTemperature).toBe(0.7);
	});
});

describe('EMBEDDING_CONFIG', () => {
	it('has apiKey from environment', () => {
		expect(EMBEDDING_CONFIG.apiKey).toBe('emb-test-key');
	});

	it('has endpoint from environment', () => {
		expect(EMBEDDING_CONFIG.endpoint).toBe('https://api.test.com/embed');
	});

	it('has model from environment', () => {
		expect(EMBEDDING_CONFIG.model).toBe('voyage-test');
	});

	it('has dimensions set to 1536', () => {
		expect(EMBEDDING_CONFIG.dimensions).toBe(1536);
	});

	it('has maxInputLength set to 8000', () => {
		expect(EMBEDDING_CONFIG.maxInputLength).toBe(8000);
	});

	it('has batchSize set to 20', () => {
		expect(EMBEDDING_CONFIG.batchSize).toBe(20);
	});
});

describe('SYSTEM_PROMPTS', () => {
	it('has general prompt', () => {
		expect(SYSTEM_PROMPTS.general).toBeDefined();
		expect(typeof SYSTEM_PROMPTS.general).toBe('string');
	});

	it('general prompt mentions Tendermanager AI', () => {
		expect(SYSTEM_PROMPTS.general).toContain('Tendermanager AI');
	});

	it('general prompt is in Dutch', () => {
		expect(SYSTEM_PROMPTS.general).toContain('Nederlands');
	});

	it('general prompt mentions Aanbestedingswet 2012', () => {
		expect(SYSTEM_PROMPTS.general).toContain('Aanbestedingswet 2012');
	});

	it('general prompt includes safety guardrails', () => {
		expect(SYSTEM_PROMPTS.general).toContain('GEEN juridisch advies');
		expect(SYSTEM_PROMPTS.general).toContain('GEEN aannames');
	});

	it('general prompt specifies Markdown output format', () => {
		expect(SYSTEM_PROMPTS.general).toContain('Markdown');
	});
});

describe('AI_CONFIG defaults', () => {
	it('would fall back to gpt-4o for empty OPENAI_MODEL', async () => {
		vi.resetModules();
		vi.doMock('$env/static/private', () => ({
			OPENAI_API_KEY: 'key',
			OPENAI_MODEL: '',
			OPENAI_MAX_TOKENS: '',
			EMBEDDING_API_KEY: '',
			EMBEDDING_API_ENDPOINT: '',
			EMBEDDING_MODEL: ''
		}));

		const { AI_CONFIG: config } = await import('$server/ai/config');
		expect(config.model).toBe('gpt-4o');
		expect(config.maxTokens).toBe(4096);
	});
});
