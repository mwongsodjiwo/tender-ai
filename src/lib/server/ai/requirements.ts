// AI requirements generation — generates concept requirements from briefing data

import { chat } from './client.js';
import { AI_CONFIG } from './config.js';
import type { RequirementType, RequirementCategory } from '$types';

const REQUIREMENTS_GENERATION_PROMPT = `# Rol en identiteit

Je bent een senior aanbestedingsjurist en inkoopspecialist gespecialiseerd in het opstellen van Programma's van Eisen (PvE) voor Nederlandse overheidsopdrachten. Je genereert gestructureerde eisen op basis van briefing-informatie.

# Doel

Genereer een set concept-eisen voor een aanbestedingsproject op basis van de verstrekte briefing-informatie. De eisen moeten:
1. Relevant zijn voor het projecttype en de scope
2. Voldoen aan de Aanbestedingswet 2012 en de Gids Proportionaliteit
3. Proportioneel zijn ten opzichte van de opdrachtwaarde
4. Gecategoriseerd zijn

# Eisentypen

Het PvE kent slechts twee typen:

- **eis** (Eis): Harde knock-out eisen waaraan MOET worden voldaan. Niet-voldoen leidt tot uitsluiting. Gebruik dit voor essentiële geschiktheidseisen en minimumvereisten.
- **wens** (Wens): Nice-to-have eisen die extra waarde toevoegen maar niet verplicht zijn.

Let op: gunningscriteria (EMVI-weging) worden NIET in het PvE opgenomen. Die worden apart beheerd in de gunningscriteria-tool.

# Categorieën

- **functional**: Functionele eisen — wat het product/de dienst moet DOEN
- **technical**: Technische eisen — HOE het technisch moet werken
- **process**: Proceseisen — eisen aan werkwijze, planning, communicatie
- **quality**: Kwaliteitseisen — eisen aan kwaliteitsniveau, certificeringen, normen
- **sustainability**: Duurzaamheidseisen — MVO, milieu, social return, circulair

# Regels

- Genereer minimaal 8 en maximaal 20 eisen
- Verdeel over minimaal 3 categorieën
- Eisen (knock-out): 5-12 stuks (essentiële minimumeisen)
- Wensen: 3-8 stuks
- Prioriteit: 1 (laag) tot 5 (hoog) — verdeel realistisch
- Formuleer eisen SMART: Specifiek, Meetbaar, Acceptabel, Realistisch, Tijdgebonden
- Gebruik formeel Nederlands

# Juridisch kader

- Geschiktheidseisen: conform art. 2.90–2.98 Aw 2012
- Selectiecriteria: conform art. 2.99 Aw 2012
- Proportionaliteit: Gids Proportionaliteit, hoofdstuk 3 en 4

# Outputformat

Geef de eisen als een JSON-array. Elk object heeft:
- "title": korte eistitel (max 100 tekens)
- "description": uitgebreide beschrijving met toetsbare criteria
- "requirement_type": "eis" | "wens"
- "category": "functional" | "technical" | "process" | "quality" | "sustainability"
- "priority": getal 1-5

Geef ALLEEN de JSON-array, geen andere tekst. Begin met [ en eindig met ].`;

interface GeneratedRequirement {
	title: string;
	description: string;
	requirement_type: RequirementType;
	category: RequirementCategory;
	priority: number;
}

interface GenerateRequirementsParams {
	briefingData: Record<string, unknown>;
	projectName: string;
	procedureType: string | null;
	estimatedValue: number | null;
}

interface GenerateRequirementsResult {
	requirements: GeneratedRequirement[];
	tokenCount: number;
}

export async function generateRequirements(
	params: GenerateRequirementsParams
): Promise<GenerateRequirementsResult> {
	const { briefingData, projectName, procedureType, estimatedValue } = params;

	const prompt = `Genereer concept-eisen voor het volgende aanbestedingsproject:

Projectnaam: ${projectName}
Procedure: ${procedureType ?? 'Nog niet bepaald'}
Geschatte waarde: ${estimatedValue ? `€${estimatedValue.toLocaleString('nl-NL')}` : 'Nog niet bepaald'}

Briefing-informatie:
${JSON.stringify(briefingData.summary ?? briefingData, null, 2)}

Genereer een passende set eisen (knock-out) en wensen voor dit project.`;

	const result = await chat({
		messages: [{ role: 'user', content: prompt }],
		systemPrompt: REQUIREMENTS_GENERATION_PROMPT,
		temperature: 0.5,
		maxTokens: AI_CONFIG.maxTokens
	});

	const requirements = parseRequirementsJson(result.content);

	return {
		requirements,
		tokenCount: result.tokenCount
	};
}

function parseRequirementsJson(content: string): GeneratedRequirement[] {
	// Extract JSON array from response
	const jsonMatch = content.match(/\[[\s\S]*\]/);
	if (!jsonMatch) {
		return [];
	}

	try {
		const parsed = JSON.parse(jsonMatch[0]) as unknown[];

		const validTypes = new Set(['eis', 'wens']);
		const validCategories = new Set(['functional', 'technical', 'process', 'quality', 'sustainability']);

		return parsed
			.filter((item): item is Record<string, unknown> =>
				typeof item === 'object' && item !== null
			)
			.filter((item) =>
				typeof item.title === 'string' &&
				typeof item.requirement_type === 'string' &&
				validTypes.has(item.requirement_type) &&
				typeof item.category === 'string' &&
				validCategories.has(item.category)
			)
			.map((item) => ({
				title: String(item.title).slice(0, 500),
				description: String(item.description ?? '').slice(0, 5000),
				requirement_type: item.requirement_type as RequirementType,
				category: item.category as RequirementCategory,
				priority: Math.max(1, Math.min(5, Math.round(Number(item.priority) || 3)))
			}));
	} catch {
		return [];
	}
}
