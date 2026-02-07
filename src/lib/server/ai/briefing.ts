// Briefing agent — guides user through project setup via conversation

import { chat } from './client.js';
import { AI_CONFIG } from './config.js';
import type { Message, DocumentType, TemplateSection } from '$types';

const BRIEFING_SYSTEM_PROMPT = `Je bent de Tendermanager briefing-assistent. Je helpt inkoopadviseurs bij Nederlandse overheden met het starten van een nieuw aanbestedingsproject.

Je doel is om via een gestructureerd gesprek alle benodigde informatie te verzamelen voor het genereren van aanbestedingsdocumenten.

## Gespreksstructuur

Stel stap voor stap vragen over:
1. **Projectbeschrijving** — Wat wordt er ingekocht? Wat is het doel?
2. **Aanbestedingsprocedure** — Welke procedure wordt gevolgd? (openbaar, niet-openbaar, etc.)
3. **Geschatte waarde** — Wat is de geraamde opdrachtwaarde?
4. **Planning** — Wanneer moet de aanbesteding gepubliceerd worden? Wat is de deadline?
5. **Eisen** — Wat zijn de belangrijkste functionele en technische eisen?
6. **Gunningscriteria** — Op basis waarvan wordt gegund? (prijs, kwaliteit, EMVI)
7. **Bijzonderheden** — Zijn er speciale voorwaarden, social return, duurzaamheidseisen?

## Regels

- Stel maximaal 2-3 vragen per beurt
- Wees vriendelijk en professioneel
- Gebruik vakjargon dat past bij inkoopadviseurs
- Als een antwoord onduidelijk is, vraag door
- Antwoord altijd in het Nederlands
- Geef na elk antwoord een korte samenvatting van wat je tot nu toe weet

## Briefing voltooien

Wanneer je voldoende informatie hebt verzameld (minimaal punten 1-4), geef dan aan dat de briefing compleet is door je bericht te eindigen met exact deze tag op een eigen regel:

[BRIEFING_COMPLEET]

Geef voor de tag een samenvatting van alle verzamelde informatie in een gestructureerd format.`;

interface BriefingResult {
	content: string;
	tokenCount: number;
	isComplete: boolean;
	briefingData: Record<string, unknown>;
}

const BRIEFING_COMPLETE_TAG = '[BRIEFING_COMPLEET]';

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

const GENERATION_SYSTEM_PROMPT = `Je bent een expert in het opstellen van Nederlandse aanbestedingsdocumenten. Op basis van de briefing-informatie genereer je de inhoud voor een specifieke sectie van een aanbestedingsdocument.

## Regels
- Schrijf in formeel Nederlands, geschikt voor overheidspublicaties
- Volg de structuur van de Aanbestedingswet 2012 en ARW 2016
- Markeer plaatsen waar specifieke informatie ontbreekt met [NOG IN TE VULLEN: beschrijving]
- Wees concreet en specifiek, vermijd vage formuleringen
- Gebruik nummering en opsommingen waar passend`;

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
		maxTokens: AI_CONFIG.maxTokens
	});

	return {
		sectionKey: section.key,
		title: section.title,
		content: result.content
	};
}
