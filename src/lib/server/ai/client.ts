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
}
