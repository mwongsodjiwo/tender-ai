// AI prompt builder for planning generation

import type { PlanningContext } from './ai-planning-context.js';
import { formatLegalMinimums } from './legal-constraints.js';
import { PROCEDURE_TYPE_LABELS, PROJECT_PHASE_LABELS } from '$types';

const PLANNING_JSON_SCHEMA = `{
  "phases": [
    {
      "phase": "preparing | exploring | specifying | tendering | contracting",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "activities": [
        {
          "title": "string (Nederlands)",
          "description": "string (korte beschrijving, Nederlands)",
          "activity_type": "string (bijv. document_review, meeting, drafting)",
          "planned_start": "YYYY-MM-DD",
          "planned_end": "YYYY-MM-DD",
          "estimated_hours": number,
          "assigned_role": "project_leader | procurement_advisor | legal_advisor | budget_holder | subject_expert"
        }
      ],
      "milestones": [
        {
          "milestone_type": "phase_start | phase_end | publication | submission_deadline | nota_van_inlichtingen | award_decision | standstill_end | contract_signed | custom",
          "title": "string (Nederlands)",
          "target_date": "YYYY-MM-DD",
          "is_critical": boolean
        }
      ]
    }
  ],
  "dependencies": [
    {
      "from_title": "string (exacte titel van een activiteit of milestone)",
      "to_title": "string (exacte titel van een activiteit of milestone)",
      "type": "finish_to_start | start_to_start | finish_to_finish | start_to_finish",
      "lag_days": number
    }
  ],
  "total_duration_days": number,
  "total_estimated_hours": number
}`;

export function buildPlanningSystemPrompt(): string {
	return `Je bent een ervaren inkoopadviseur die realistische planningen maakt voor aanbestedingstrajecten van Nederlandse overheden.

# Regels
- Alle tekst in het Nederlands
- Gebruik alleen datums in YYYY-MM-DD formaat
- Wettelijke minimumtermijnen zijn HARD — deze mogen NOOIT korter
- Voeg buffer toe voor reviews en goedkeuringen (minimaal 5 werkdagen per review)
- Plan parallelle activiteiten waar mogelijk (bijv. PvE en EMVI tegelijk in specificatiefase)
- Houd rekening met vakanties: zomer (juli-augustus minder capaciteit), kerst (2 weken stil)
- Weekenden zijn geen werkdagen
- Geef realistische ureninschattingen per activiteit
- Elk fase moet minimaal een phase_start en phase_end milestone hebben
- Kritieke milestones (wettelijk verplicht) moeten is_critical: true hebben

# Fases van een aanbestedingstraject
1. Voorbereiden (preparing): Briefing, projectprofiel, inkoopstrategie, teamsamenstelling
2. Verkennen (exploring): Deskresearch, RFI, marktconsultatie, marktverkenningsrapport
3. Specificeren (specifying): PvE, aanbestedingsleidraad, EMVI-criteria, UEA, conceptovereenkomst
4. Aanbesteden (tendering): Publicatie, NvI, beoordeling inschrijvingen, gunning, afwijzingsbrieven
5. Contracteren (contracting): Definitieve overeenkomst, ondertekening

# Output
Geef je antwoord UITSLUITEND als valid JSON object (geen markdown, geen uitleg buiten het JSON object).
Voeg een "rationale" veld toe (string, Nederlands) met je onderbouwing.
Voeg een "warnings" array toe met waarschuwingen (strings, Nederlands).`;
}

export function buildPlanningUserPrompt(
	context: PlanningContext,
	preferences: PlanningPreferences
): string {
	const procedureLabel = PROCEDURE_TYPE_LABELS[context.procedure_type] ?? context.procedure_type;

	const similarTendersText = context.similar_tenders.length > 0
		? context.similar_tenders
			.map((t) => `- "${t.title}": ${t.duration_days} dagen totaal (${t.procedure_type})`)
			.join('\n')
		: 'Geen vergelijkbare tenders gevonden in de kennisbank.';

	const teamRolesText = context.team_roles.length > 0
		? context.team_roles.join(', ')
		: 'Nog niet samengesteld';

	return `Maak een complete planning voor het volgende aanbestedingsproject.

## Projectinformatie
- Procedure: ${procedureLabel}
- Geschatte opdrachtwaarde: ${context.estimated_value ? `€${context.estimated_value.toLocaleString('nl-NL')}` : 'Niet opgegeven'}
- Scope: ${context.scope_description || 'Geen scope beschreven'}
- Teamgrootte: ${context.team_size} personen (rollen: ${teamRolesText})

## Wettelijke minimumtermijnen (Aw 2012)
${formatLegalMinimums(context.legal_minimums)}

## Vergelijkbare tenders (referentie voor doorlooptijd)
${similarTendersText}

## Gewenste parameters
- Startdatum: ${preferences.target_start_date || 'Zo snel mogelijk (gebruik vandaag)'}
- Einddatum: ${preferences.target_end_date || 'Niet gespecificeerd — plan realistisch'}
- Extra buffer per fase: ${preferences.buffer_days} werkdagen
- Parallelle activiteiten: ${preferences.parallel_activities ? 'Ja, plan parallel waar mogelijk' : 'Nee, plan sequentieel'}
- Review-momenten opnemen: ${preferences.include_reviews ? 'Ja' : 'Nee'}

## Verwachte output
Genereer een JSON object met het volgende schema:
${PLANNING_JSON_SCHEMA}

Zorg dat:
1. Elke fase start- en einddatum heeft
2. Alle wettelijke termijnen worden gerespecteerd
3. Afhankelijkheden logisch zijn (bijv. publicatie pas na specificatie)
4. De totale doorlooptijd realistisch is voor deze procedure
5. Activiteiten concrete, uitvoerbare taken zijn (niet te abstract)
6. Ureninschattingen passen bij de scope en teamgrootte`;
}

export interface PlanningPreferences {
	target_start_date: string | null;
	target_end_date: string | null;
	buffer_days: number;
	parallel_activities: boolean;
	include_reviews: boolean;
}

export interface GeneratedPlanning {
	phases: GeneratedPhase[];
	dependencies: GeneratedDependency[];
	total_duration_days: number;
	total_estimated_hours: number;
	rationale: string;
	warnings: string[];
}

export interface GeneratedPhase {
	phase: string;
	start_date: string;
	end_date: string;
	activities: GeneratedActivity[];
	milestones: GeneratedMilestone[];
}

export interface GeneratedActivity {
	title: string;
	description: string;
	activity_type: string;
	planned_start: string;
	planned_end: string;
	estimated_hours: number;
	assigned_role: string;
}

export interface GeneratedMilestone {
	milestone_type: string;
	title: string;
	target_date: string;
	is_critical: boolean;
}

export interface GeneratedDependency {
	from_title: string;
	to_title: string;
	type: string;
	lag_days: number;
}

export function parseAiPlanningResponse(responseText: string): GeneratedPlanning {
	// Strip markdown code fences if present
	let cleaned = responseText.trim();
	if (cleaned.startsWith('```json')) {
		cleaned = cleaned.slice(7);
	} else if (cleaned.startsWith('```')) {
		cleaned = cleaned.slice(3);
	}
	if (cleaned.endsWith('```')) {
		cleaned = cleaned.slice(0, -3);
	}
	cleaned = cleaned.trim();

	const parsed = JSON.parse(cleaned) as GeneratedPlanning;

	// Validate required structure
	if (!parsed.phases || !Array.isArray(parsed.phases)) {
		throw new Error('AI-response bevat geen geldige "phases" array.');
	}

	if (!parsed.dependencies || !Array.isArray(parsed.dependencies)) {
		parsed.dependencies = [];
	}

	if (typeof parsed.total_duration_days !== 'number') {
		parsed.total_duration_days = 0;
	}

	if (typeof parsed.total_estimated_hours !== 'number') {
		parsed.total_estimated_hours = 0;
	}

	if (typeof parsed.rationale !== 'string') {
		parsed.rationale = '';
	}

	if (!Array.isArray(parsed.warnings)) {
		parsed.warnings = [];
	}

	return parsed;
}
