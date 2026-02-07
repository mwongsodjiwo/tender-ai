// OpenAI API client

import OpenAI from 'openai';
import { AI_CONFIG, SYSTEM_PROMPTS } from './config.js';
import type { Message } from '$types';

const openai = new OpenAI({
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

	const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
		{ role: 'system', content: systemPrompt },
		...messages.map((msg) => ({
			role: msg.role as 'user' | 'assistant',
			content: msg.content
		}))
	];

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const response = await openai.chat.completions.create({
				model: AI_CONFIG.model,
				max_tokens: maxTokens,
				temperature,
				messages: openaiMessages
			});

			const content = response.choices[0]?.message?.content ?? '';
			const tokenCount =
				(response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0);

			return { content, tokenCount };
		} catch (err: unknown) {
			const isRateLimit = err instanceof OpenAI.APIError && err.status === 429;
			if (!isRateLimit || attempt === MAX_RETRIES) {
				throw err;
			}
			const retryAfter = err instanceof OpenAI.APIError
				? Number(err.headers?.['retry-after'] || 0)
				: 0;
			const delay = Math.max(retryAfter * 1000, (2 ** attempt) * 5000);
			console.log(`Rate limited, retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
			await sleep(delay);
		}
	}

	throw new Error('Max retries exceeded');
}
