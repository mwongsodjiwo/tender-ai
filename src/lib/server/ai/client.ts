// Anthropic Claude API client

import Anthropic from '@anthropic-ai/sdk';
import { AI_CONFIG, SYSTEM_PROMPTS } from './config.js';
import type { Message } from '$types';

const anthropic = new Anthropic({
	apiKey: AI_CONFIG.apiKey
});

interface ChatParams {
	messages: Pick<Message, 'role' | 'content'>[];
	systemPrompt?: string;
	temperature?: number;
	maxTokens?: number;
}

interface ChatResult {
	content: string;
	tokenCount: number;
}

const MAX_RETRIES = 5;

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function chat(params: ChatParams): Promise<ChatResult> {
	const {
		messages,
		systemPrompt = SYSTEM_PROMPTS.general,
		temperature = AI_CONFIG.defaultTemperature,
		maxTokens = AI_CONFIG.maxTokens
	} = params;

	const formattedMessages = messages.map((msg) => ({
		role: msg.role as 'user' | 'assistant',
		content: msg.content
	}));

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const response = await anthropic.messages.create({
				model: AI_CONFIG.model,
				max_tokens: maxTokens,
				temperature,
				system: systemPrompt,
				messages: formattedMessages
			});

			const textBlock = response.content.find((block) => block.type === 'text');
			const content = textBlock?.type === 'text' ? textBlock.text : '';

			return {
				content,
				tokenCount: response.usage.input_tokens + response.usage.output_tokens
			};
		} catch (err: unknown) {
			const isRateLimit = err instanceof Error && 'status' in err && (err as { status: number }).status === 429;
			if (!isRateLimit || attempt === MAX_RETRIES) {
				throw err;
			}
			// Parse retry-after header or use exponential backoff
			const retryAfter = err instanceof Error && 'headers' in err
				? Number((err as { headers: Record<string, string> }).headers?.['retry-after'] || 0)
				: 0;
			const delay = Math.max(retryAfter * 1000, (2 ** attempt) * 5000);
			console.log(`Rate limited, retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
			await sleep(delay);
		}
	}

	throw new Error('Max retries exceeded');
}
