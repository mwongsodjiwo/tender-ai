// Unit tests for OpenAI client — chat function with retry logic

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

class MockAPIError extends Error {
	status: number;
	headers: Record<string, string>;
	constructor(status: number, message: string, headers: Record<string, string> = {}) {
		super(message);
		this.status = status;
		this.headers = headers;
	}
}

const mockCreate = vi.fn();

vi.mock('$server/logger', () => ({ logInfo: vi.fn() }));

vi.mock('$env/static/private', () => ({
	OPENAI_API_KEY: 'test-key',
	OPENAI_MODEL: 'gpt-4o-test',
	OPENAI_MAX_TOKENS: '1024',
	EMBEDDING_API_KEY: '',
	EMBEDDING_API_ENDPOINT: '',
	EMBEDDING_MODEL: ''
}));

vi.mock('openai', () => {
	return {
		default: class OpenAI {
			static APIError = MockAPIError;
			chat = { completions: { create: mockCreate } };
		}
	};
});

// Dynamic import so mocks are in place first
let chat: typeof import('$server/ai/client').chat;

beforeAll(async () => {
	const mod = await import('$server/ai/client');
	chat = mod.chat;
});

describe('chat', () => {
	beforeEach(() => {
		mockCreate.mockReset();
	});

	it('returns content and token count on success', async () => {
		mockCreate.mockResolvedValue({
			choices: [{ message: { content: 'Hello world' } }],
			usage: { prompt_tokens: 10, completion_tokens: 5 }
		});

		const result = await chat({
			messages: [{ role: 'user', content: 'Hi' }]
		});

		expect(result.content).toBe('Hello world');
		expect(result.tokenCount).toBe(15);
	});

	it('uses default system prompt', async () => {
		mockCreate.mockResolvedValue({
			choices: [{ message: { content: 'OK' } }],
			usage: { prompt_tokens: 5, completion_tokens: 2 }
		});

		await chat({ messages: [{ role: 'user', content: 'Hi' }] });

		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				messages: expect.arrayContaining([
					expect.objectContaining({ role: 'system' })
				])
			})
		);
	});

	it('uses custom system prompt when provided', async () => {
		mockCreate.mockResolvedValue({
			choices: [{ message: { content: 'OK' } }],
			usage: { prompt_tokens: 5, completion_tokens: 2 }
		});

		await chat({
			messages: [{ role: 'user', content: 'Hi' }],
			systemPrompt: 'Custom prompt'
		});

		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				messages: expect.arrayContaining([
					{ role: 'system', content: 'Custom prompt' }
				])
			})
		);
	});

	it('passes temperature and maxTokens', async () => {
		mockCreate.mockResolvedValue({
			choices: [{ message: { content: 'OK' } }],
			usage: { prompt_tokens: 5, completion_tokens: 2 }
		});

		await chat({
			messages: [{ role: 'user', content: 'Hi' }],
			temperature: 0.2,
			maxTokens: 500
		});

		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				temperature: 0.2,
				max_tokens: 500
			})
		);
	});

	it('returns empty string when content is null', async () => {
		mockCreate.mockResolvedValue({
			choices: [{ message: { content: null } }],
			usage: { prompt_tokens: 5, completion_tokens: 0 }
		});

		const result = await chat({ messages: [{ role: 'user', content: 'Hi' }] });
		expect(result.content).toBe('');
	});

	it('returns 0 tokens when usage is missing', async () => {
		mockCreate.mockResolvedValue({
			choices: [{ message: { content: 'OK' } }],
			usage: null
		});

		const result = await chat({ messages: [{ role: 'user', content: 'Hi' }] });
		expect(result.tokenCount).toBe(0);
	});

	it('throws non-rate-limit errors immediately', async () => {
		mockCreate.mockRejectedValue(new MockAPIError(500, 'Server error'));

		await expect(chat({ messages: [{ role: 'user', content: 'Hi' }] })).rejects.toThrow();
		expect(mockCreate).toHaveBeenCalledTimes(1);
	});

	it('throws generic errors immediately', async () => {
		mockCreate.mockRejectedValue(new Error('Generic error'));

		await expect(chat({ messages: [{ role: 'user', content: 'Hi' }] })).rejects.toThrow('Generic error');
		expect(mockCreate).toHaveBeenCalledTimes(1);
	});
});
