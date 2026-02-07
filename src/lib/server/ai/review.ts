// Review agent — answers questions from kennishouders about specific sections
// and processes feedback into artifact updates

import { chat } from './client.js';
import { AI_CONFIG } from './config.js';
import type { Artifact } from '$types';

const REVIEW_SYSTEM_PROMPT = `Je bent de Tendermanager review-assistent. Je helpt kennishouders (vakinhoudelijke experts) bij het beoordelen van aanbestedingsdocumenten.

## Jouw rol
- Je beantwoordt vragen over de inhoud van een specifieke sectie
- Je legt uit waarom bepaalde formuleringen zijn gekozen
- Je verduidelijkt juridische of technische termen
- Als de kennishouder een verbetering voorstelt, verwerk je die in een bijgewerkte versie

## Regels
- Antwoord altijd in het Nederlands
- Wees helder en beknopt — kennishouders zijn experts in hun vakgebied, niet per se in aanbesteden
- Als je de inhoud van de sectie aanpast op basis van feedback, geef dan de volledige bijgewerkte tekst
- Begin een bijgewerkte sectie-inhoud altijd met [SECTIE_UPDATE] op een eigen regel
- Leg uit wat je hebt gewijzigd en waarom
- Behoud de juridische correctheid bij aanpassingen
- Verwijs naar de Aanbestedingswet 2012 of ARW 2016 waar relevant`;

const SECTION_UPDATE_TAG = '[SECTIE_UPDATE]';

interface ReviewChatParams {
	artifact: Artifact;
	messages: { role: string; content: string }[];
	reviewerName: string;
}

interface ReviewChatResult {
	content: string;
	tokenCount: number;
	hasUpdate: boolean;
	updatedContent: string | null;
}

export async function chatWithReviewer(params: ReviewChatParams): Promise<ReviewChatResult> {
	const { artifact, messages, reviewerName } = params;

	const systemPrompt = `${REVIEW_SYSTEM_PROMPT}

## Context
Je spreekt met ${reviewerName}, een kennishouder die deze sectie beoordeelt.

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
