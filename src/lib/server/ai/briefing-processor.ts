// Briefing processor — conversation handling and document generation

import { chat } from './client.js';
import { AI_CONFIG } from './config.js';
import type { Message, DocumentType, TemplateSection } from '$types';
import {
	BRIEFING_SYSTEM_PROMPT,
	GENERATION_SYSTEM_PROMPT,
	BRIEFING_COMPLETE_TAG
} from './briefing-prompts.js';

interface BriefingResult {
	content: string;
	tokenCount: number;
	isComplete: boolean;
	briefingData: Record<string, unknown>;
}

export async function conductBriefing(
	messages: Pick<Message, 'role' | 'content'>[]
): Promise<BriefingResult> {
	const result = await chat({
		messages,
		systemPrompt: BRIEFING_SYSTEM_PROMPT,
		temperature: 0.6,
		maxTokens: AI_CONFIG.maxTokens
	});

	const isComplete = result.content.includes(BRIEFING_COMPLETE_TAG);
	const content = result.content.replace(BRIEFING_COMPLETE_TAG, '').trim();

	let briefingData: Record<string, unknown> = {};
	if (isComplete) {
		briefingData = extractBriefingData(messages, content);
	}

	return {
		content,
		tokenCount: result.tokenCount,
		isComplete,
		briefingData
	};
}

function extractBriefingData(
	messages: Pick<Message, 'role' | 'content'>[],
	summary: string
): Record<string, unknown> {
	const allUserMessages = messages
		.filter((m) => m.role === 'user')
		.map((m) => m.content)
		.join('\n');

	return {
		summary,
		user_responses: allUserMessages,
		completed_at: new Date().toISOString()
	};
}

interface GenerateArtifactsParams {
	briefingData: Record<string, unknown>;
	documentType: DocumentType;
	projectName: string;
}

interface GeneratedSection {
	sectionKey: string;
	title: string;
	content: string;
}

export async function generateArtifacts(
	params: GenerateArtifactsParams
): Promise<GeneratedSection[]> {
	const { briefingData, documentType, projectName } = params;
	const sections: GeneratedSection[] = [];

	for (const section of documentType.template_structure) {
		const generated = await generateSection(briefingData, section, documentType.name, projectName);
		sections.push(generated);
	}

	return sections;
}

async function generateSection(
	briefingData: Record<string, unknown>,
	section: TemplateSection,
	documentTypeName: string,
	projectName: string
): Promise<GeneratedSection> {
	const prompt = `Genereer de inhoud voor de sectie "${section.title}" van het document "${documentTypeName}" voor het project "${projectName}".

Sectiebeschrijving: ${section.description}

Briefing-informatie:
${JSON.stringify(briefingData.summary, null, 2)}

Schrijf de volledige inhoud voor deze sectie. Gebruik Markdown-opmaak.`;

	const result = await chat({
		messages: [{ role: 'user', content: prompt }],
		systemPrompt: GENERATION_SYSTEM_PROMPT,
		temperature: 0.4,
		maxTokens: 2048
	});

	return {
		sectionKey: section.key,
		title: section.title,
		content: result.content
	};
}
