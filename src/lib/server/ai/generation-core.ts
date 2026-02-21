// Core prompt building — regeneration and section chat

import { chat } from './client.js';
import { AI_CONFIG } from './config.js';
import {
	REGENERATION_SYSTEM_PROMPT,
	SECTION_CHAT_SYSTEM_PROMPT,
	SECTION_UPDATE_TAG
} from './generation-types.js';
import type {
	RegenerateParams,
	RegenerateResult,
	SectionChatParams,
	SectionChatResult
} from './generation-types.js';

export async function regenerateSection(params: RegenerateParams): Promise<RegenerateResult> {
	const { artifact, documentType, briefingData, instructions, contextSnippets } = params;

	// Find section description from template
	const sectionTemplate = documentType.template_structure.find(
		(s: import('./generation-types.js').TemplateSection) => s.key === artifact.section_key
	);

	let prompt = `Regenereer de sectie "${artifact.title}" van het document "${documentType.name}".

Sectiebeschrijving: ${sectionTemplate?.description ?? 'Geen beschrijving beschikbaar'}

Briefing-informatie:
${JSON.stringify(briefingData.summary ?? briefingData, null, 2)}

Huidige inhoud:
${artifact.content}`;

	if (instructions) {
		prompt += `\n\nSpecifieke instructies van de gebruiker:\n${instructions}`;
	}

	if (contextSnippets && contextSnippets.length > 0) {
		prompt += `\n\nRelevante context uit andere documenten:\n${contextSnippets.join('\n---\n')}`;
	}

	prompt += '\n\nGeef de volledige bijgewerkte inhoud voor deze sectie.';

	const result = await chat({
		messages: [{ role: 'user', content: prompt }],
		systemPrompt: REGENERATION_SYSTEM_PROMPT,
		temperature: 0.4,
		maxTokens: AI_CONFIG.maxTokens
	});

	return {
		content: result.content,
		tokenCount: result.tokenCount
	};
}

export async function chatAboutSection(params: SectionChatParams): Promise<SectionChatResult> {
	const { artifact, messages } = params;

	const systemPrompt = `${SECTION_CHAT_SYSTEM_PROMPT}

## Huidige sectie-inhoud
Titel: ${artifact.title}
Inhoud:
${artifact.content}`;

	const formattedMessages = messages.map((msg) => ({
		role: msg.role as 'user' | 'assistant',
		content: msg.content
	}));

	const result = await chat({
		messages: formattedMessages,
		systemPrompt,
		temperature: 0.5,
		maxTokens: AI_CONFIG.maxTokens
	});

	const hasUpdate = result.content.includes(SECTION_UPDATE_TAG);
	let updatedContent: string | null = null;

	if (hasUpdate) {
		const parts = result.content.split(SECTION_UPDATE_TAG);
		updatedContent = parts[1]?.trim() ?? null;
	}

	return {
		content: result.content.replace(SECTION_UPDATE_TAG, '').trim(),
		tokenCount: result.tokenCount,
		hasUpdate,
		updatedContent
	};
}
