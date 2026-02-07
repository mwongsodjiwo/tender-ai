// Document generation agent — regenerates and refines artifact sections

import { chat } from './client.js';
import { AI_CONFIG } from './config.js';
import type { Artifact, DocumentType, TemplateSection } from '$types';

const REGENERATION_SYSTEM_PROMPT = `Je bent een expert in het opstellen van Nederlandse aanbestedingsdocumenten. Je regenereert of verbetert een specifieke sectie van een aanbestedingsdocument.

## Regels
- Schrijf in formeel Nederlands, geschikt voor overheidspublicaties
- Volg de Aanbestedingswet 2012 en ARW 2016
- Markeer ontbrekende informatie met [NOG IN TE VULLEN: beschrijving]
- Wees concreet, vermijd vage formuleringen
- Gebruik Markdown-opmaak
- Behoud de structuur en stijl van het origineel tenzij anders gevraagd
- Verwerk de instructies van de gebruiker nauwkeurig`;

const SECTION_CHAT_SYSTEM_PROMPT = `Je bent de Tendermanager sectie-assistent. Je helpt gebruikers bij het verbeteren van een specifieke sectie van een aanbestedingsdocument.

## Context
Je hebt toegang tot de huidige inhoud van de sectie. De gebruiker kan vragen stellen over de inhoud, verbeteringen voorstellen, of je vragen om specifieke aanpassingen te maken.

## Regels
- Antwoord in het Nederlands
- Als de gebruiker vraagt om een aanpassing, geef de volledige bijgewerkte tekst
- Wees precies en juridisch correct
- Verwijs naar relevante wetgeving waar van toepassing
- Als je een volledige bijgewerkte sectie-inhoud geeft, begin die met [SECTIE_UPDATE] op een eigen regel`;

interface RegenerateParams {
	artifact: Artifact;
	documentType: DocumentType;
	briefingData: Record<string, unknown>;
	instructions?: string;
	contextSnippets?: string[];
}

interface RegenerateResult {
	content: string;
	tokenCount: number;
}

export async function regenerateSection(params: RegenerateParams): Promise<RegenerateResult> {
	const { artifact, documentType, briefingData, instructions, contextSnippets } = params;

	// Find section description from template
	const sectionTemplate = documentType.template_structure.find(
		(s: TemplateSection) => s.key === artifact.section_key
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

interface SectionChatParams {
	artifact: Artifact;
	messages: { role: string; content: string }[];
}

interface SectionChatResult {
	content: string;
	tokenCount: number;
	hasUpdate: boolean;
	updatedContent: string | null;
}

const SECTION_UPDATE_TAG = '[SECTIE_UPDATE]';

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
