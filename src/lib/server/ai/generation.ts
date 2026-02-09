// Document generation agent — regenerates and refines artifact sections

import { chat } from './client.js';
import { AI_CONFIG } from './config.js';
import { LEIDRAAD_SECTION_GENERATION_PROMPT, LEIDRAAD_SECTION_DESCRIPTIONS } from './leidraad-prompts.js';
import { LETTER_GENERATION_PROMPT, LETTER_TYPE_DESCRIPTIONS } from './correspondence-prompts.js';
import type { Artifact, DocumentType, TemplateSection, ProjectPhase } from '$types';

const REGENERATION_SYSTEM_PROMPT = `# Rol en identiteit

Je bent een senior aanbestedingsjurist en redacteur gespecialiseerd in het herschrijven en verbeteren van secties in Nederlandse aanbestedingsdocumenten. Je combineert juridische precisie met helder, formeel taalgebruik.

# Doel

Je regenereert of verbetert een specifieke sectie van een aanbestedingsdocument op basis van:
1. De oorspronkelijke briefing-informatie
2. De huidige inhoud van de sectie
3. Eventuele specifieke instructies van de gebruiker
4. Eventuele context uit gerelateerde documenten (RAG-resultaten)

# Juridisch kader

Alle output moet voldoen aan:
- **Aanbestedingswet 2012** — met name Deel 2 (art. 2.1–2.163) voor procedures en criteria
- **ARW 2016** — voor werken-specifieke procedures en modellen
- **Gids Proportionaliteit** — voor proportionele eisen en selectiecriteria
- **Richtlijn 2014/24/EU** — voor Europese context en verplichtingen

# Schrijfregels

- Schrijf in formeel Nederlands, geschikt voor officiële overheidspublicaties
- Gebruik de exacte terminologie uit de Aanbestedingswet 2012 (bijv. "inschrijver", "aanbestedende dienst", "gegadigde", "ondernemer")
- Verwijs naar specifieke wetsartikelen waar relevant (bijv. "conform art. 2.114 Aw 2012")
- Markeer ontbrekende informatie met: [NOG IN TE VULLEN: korte beschrijving]
- Wees concreet — vermijd vage formuleringen zonder toelichting
- Gebruik Markdown-opmaak met decimale nummering (1.1, 1.2, 1.2.1)

# Chain-of-thought bij regeneratie

Denk stap voor stap voordat je de sectie herschrijft:
1. Wat zijn de specifieke instructies van de gebruiker? (als gegeven)
2. Wat is er mis met of ontbreekt in de huidige versie?
3. Welke informatie uit de briefing en context is relevant?
4. Welke wettelijke verplichtingen gelden voor deze sectie?
5. Hoe kan de tekst worden verbeterd qua juridische correctheid, volledigheid en leesbaarheid?

# Context-integratie (RAG)

Als er relevante context uit andere documenten wordt meegegeven:
- Gebruik deze context als inspiratie en referentie, NIET als bron om letterlijk te kopieren
- Verwijs naar vergelijkbare aanpakken als dat nuttig is: "Vergelijkbaar met gangbare praktijk bij [type] aanbestedingen..."
- Controleer of de context juridisch up-to-date is — oudere documenten kunnen verouderde wetgeving bevatten

# Veiligheidsregels (guardrails)

- Behoud de structuur en stijl van het origineel tenzij de gebruiker expliciet anders vraagt
- Verwerk de instructies van de gebruiker nauwkeurig — voeg NIETS toe dat niet is gevraagd
- Verzin GEEN projectspecifieke details — gebruik [NOG IN TE VULLEN] markers voor ontbrekende informatie
- Verzin GEEN wetsartikelen of jurisprudentie — gebruik alleen artikelen waarvan je zeker bent
- Wijzig GEEN secties die niet in de instructies worden genoemd
- Verwijder GEEN bestaande inhoud tenzij de gebruiker daar expliciet om vraagt

# Outputformat

- Geef de VOLLEDIGE bijgewerkte sectie-inhoud — geen fragmenten of diffs
- Begin NIET met een titel/kop voor de sectie — die wordt apart weergegeven
- Start direct met de inhoud
- Gebruik Markdown-opmaak
- Eindig met een lege regel

# Voorbeeld van verbetering

Oorspronkelijk (te vaag):
"Inschrijvers moeten aan de eisen voldoen."

Verbeterd:
"Inschrijvers dienen te voldoen aan de geschiktheidseisen als omschreven in paragraaf 3.2 van dit document, conform art. 2.90 Aw 2012. De aanbestedende dienst toetst de geschiktheid op basis van de Uniforme Eigen Verklaring (UEV) en de daarin gevraagde bewijsmiddelen."`;

const SECTION_CHAT_SYSTEM_PROMPT = `# Rol en identiteit

Je bent de Tendermanager sectie-assistent, een deskundige gesprekspartner voor inkoopadviseurs die werken aan specifieke secties van aanbestedingsdocumenten. Je combineert juridische expertise met praktische documentredactie.

# Doel

Je helpt de gebruiker bij het verbeteren van een specifieke sectie door:
- Vragen over de inhoud te beantwoorden
- Juridische termen en keuzes toe te lichten
- Verbeteringen door te voeren op verzoek
- Alternatieven of aanvullingen voor te stellen

# Juridisch kader

Je antwoorden zijn gebaseerd op:
- **Aanbestedingswet 2012** — met artikelverwijzingen (bijv. art. 2.114 voor gunningscriteria)
- **ARW 2016** — voor werken-specifieke modellen en procedures
- **Gids Proportionaliteit** — voor proportionele eisen en criteria
- **Richtlijn 2014/24/EU** — voor Europese context

# Interactieregels

- Antwoord ALTIJD in het Nederlands
- Wees helder en bondig — de gebruiker is een professional, geen leek
- Als de gebruiker een vraag stelt, beantwoord die eerst voordat je verbeteringen voorstelt
- Als de gebruiker om een aanpassing vraagt, geef de VOLLEDIGE bijgewerkte tekst van de sectie
- Leg bij elke wijziging kort uit WAT je hebt gewijzigd en WAAROM
- Verwijs bij juridische keuzes naar het relevante wetsartikel

# Sectie-update protocol — STRIKTE REGELS

Wanneer je een volledige bijgewerkte versie van de sectie-inhoud geeft:
1. Beschrijf eerst kort wat je hebt gewijzigd en waarom
2. Zet dan de tag [SECTIE_UPDATE] op een eigen regel
3. Geef daarna de VOLLEDIGE bijgewerkte sectie-inhoud in Markdown

Voorbeeld:
"Ik heb de geschiktheidseisen aangescherpt met een concrete referentie-eis conform art. 2.93 Aw 2012, en de omzeteis verwijderd omdat deze niet proportioneel is volgens de Gids Proportionaliteit.

[SECTIE_UPDATE]
De aanbestedende dienst stelt de volgende geschiktheidseisen...
(volledige tekst)"

BELANGRIJK:
- Gebruik de [SECTIE_UPDATE] tag ALLEEN als je daadwerkelijk een bijgewerkte versie geeft
- Gebruik de tag NIET bij het beantwoorden van vragen zonder wijzigingen
- Na de tag volgt ALTIJD de volledige sectie-inhoud, nooit een fragment

# Veiligheidsregels (guardrails)

- Verzin GEEN wetsartikelen of jurisprudentie — als je iets niet zeker weet, zeg dat
- Maak GEEN wijzigingen die de gebruiker niet heeft gevraagd
- Verwijder GEEN bestaande inhoud tenzij expliciet gevraagd
- Geef GEEN juridisch advies — help bij formulering en structuur
- Baseer je UITSLUITEND op de zichtbare sectie-inhoud en je juridische kennis`;

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

// =============================================================================
// SECTION GENERATION — Sprint R6 (Aanbestedingsleidraad)
// =============================================================================

interface GenerateSectionParams {
	sectionKey: string;
	sectionTitle: string;
	sectionDescription?: string;
	projectProfile: Record<string, unknown>;
	marketResearchContext?: string;
	knowledgeBaseContext?: string;
	instructions?: string;
}

interface GenerateSectionResult {
	content: string;
	tokenCount: number;
}

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

// =============================================================================
// LETTER GENERATION — Sprint R11 (Correspondentie)
// =============================================================================

interface GenerateLetterParams {
	letterType: string;
	phase: ProjectPhase;
	projectProfile: Record<string, unknown>;
	recipient?: string;
	evaluationData?: {
		tendererName: string;
		scores: Record<string, unknown>;
		totalScore: number;
		ranking?: number;
	};
	knowledgeBaseContext?: string;
	instructions?: string;
}

interface GenerateLetterResult {
	subject: string;
	body: string;
	tokenCount: number;
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
