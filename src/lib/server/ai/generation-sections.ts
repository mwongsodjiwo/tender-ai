// Section-specific generation — leidraad sections and correspondence letters

import { chat } from './client.js';
import { AI_CONFIG } from './config.js';
import { LEIDRAAD_SECTION_GENERATION_PROMPT, LEIDRAAD_SECTION_DESCRIPTIONS } from './leidraad-prompts.js';
import { LETTER_GENERATION_PROMPT, LETTER_TYPE_DESCRIPTIONS } from './correspondence-prompts.js';
import type {
	GenerateSectionParams,
	GenerateSectionResult,
	GenerateLetterParams,
	GenerateLetterResult
} from './generation-types.js';

export async function generateSectionContent(
	params: GenerateSectionParams
): Promise<GenerateSectionResult> {
	const {
		sectionKey,
		sectionTitle,
		sectionDescription,
		projectProfile,
		marketResearchContext,
		knowledgeBaseContext,
		instructions
	} = params;

	// Use enriched description from leidraad-prompts if available
	const description =
		sectionDescription ||
		LEIDRAAD_SECTION_DESCRIPTIONS[sectionKey] ||
		'Geen beschrijving beschikbaar';

	let prompt = `Genereer de sectie "${sectionTitle}" van een Aanbestedingsleidraad.

## Sectiebeschrijving
${description}

## Projectprofiel
${JSON.stringify(projectProfile, null, 2)}`;

	if (marketResearchContext) {
		prompt += `\n\n## Marktverkenningsresultaten\n${marketResearchContext}`;
	}

	if (knowledgeBaseContext) {
		prompt += `\n\n## Context uit kennisbank\n${knowledgeBaseContext}`;
	}

	if (instructions) {
		prompt += `\n\n## Specifieke instructies van de gebruiker\n${instructions}`;
	}

	prompt += '\n\nGenereer de volledige inhoud voor deze sectie.';

	const result = await chat({
		messages: [{ role: 'user', content: prompt }],
		systemPrompt: LEIDRAAD_SECTION_GENERATION_PROMPT,
		temperature: 0.4,
		maxTokens: AI_CONFIG.maxTokens
	});

	return {
		content: result.content,
		tokenCount: result.tokenCount
	};
}

export async function generateLetter(params: GenerateLetterParams): Promise<GenerateLetterResult> {
	const {
		letterType,
		phase,
		projectProfile,
		recipient,
		evaluationData,
		knowledgeBaseContext,
		instructions
	} = params;

	const typeInfo = LETTER_TYPE_DESCRIPTIONS[letterType];
	const typeLabel = typeInfo?.label ?? letterType;
	const typeDescription = typeInfo?.description ?? '';

	let prompt = `Genereer een "${typeLabel}" brief voor de fase "${phase}".

## Brieftype
${typeLabel}: ${typeDescription}

## Projectprofiel
${JSON.stringify(projectProfile, null, 2)}`;

	if (recipient) {
		prompt += `\n\n## Ontvanger\n${recipient}`;
	}

	if (evaluationData) {
		prompt += `\n\n## Beoordelingsgegevens
Inschrijver: ${evaluationData.tendererName}
Totaalscore: ${evaluationData.totalScore}
${evaluationData.ranking ? `Ranking: ${evaluationData.ranking}` : ''}
Scores per criterium:
${JSON.stringify(evaluationData.scores, null, 2)}`;
	}

	if (knowledgeBaseContext) {
		prompt += `\n\n## Context uit kennisbank\n${knowledgeBaseContext}`;
	}

	if (instructions) {
		prompt += `\n\n## Specifieke instructies van de gebruiker\n${instructions}`;
	}

	prompt += '\n\nGenereer de volledige brief volgens het outputformat (begin met "Onderwerp: ...").';

	const result = await chat({
		messages: [{ role: 'user', content: prompt }],
		systemPrompt: LETTER_GENERATION_PROMPT,
		temperature: 0.3,
		maxTokens: AI_CONFIG.maxTokens
	});

	// Parse output: first line after "Onderwerp:" is subject, rest is body
	const content = result.content.trim();
	let subject = '';
	let body = content;

	const subjectMatch = content.match(/^Onderwerp:\s*(.+?)(?:\n|$)/m);
	if (subjectMatch) {
		subject = subjectMatch[1].trim();
		body = content.slice(subjectMatch.index! + subjectMatch[0].length).trim();
	}

	return {
		subject,
		body,
		tokenCount: result.tokenCount
	};
}
