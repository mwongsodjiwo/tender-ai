// Correspondence helpers — letter type labels, phase mappings, formatting

import type { ProjectPhase } from '$types';

export const LETTER_TYPE_LABELS: Record<string, string> = {
	invitation_rfi: 'Uitnodiging RFI',
	invitation_consultation: 'Uitnodiging marktconsultatie',
	thank_you: 'Bedankbrief deelname',
	nvi: 'Nota van Inlichtingen',
	provisional_award: 'Voorlopige gunningsbeslissing',
	rejection: 'Afwijzingsbrief',
	final_award: 'Definitieve gunning',
	pv_opening: 'PV opening inschrijvingen',
	pv_evaluation: 'PV beoordeling',
	invitation_signing: 'Uitnodiging tot ondertekening',
	cover_letter: 'Begeleidende brief'
};

export const LETTER_TYPE_PHASES: Record<string, ProjectPhase[]> = {
	invitation_rfi: ['exploring'],
	invitation_consultation: ['exploring'],
	thank_you: ['exploring'],
	nvi: ['tendering'],
	provisional_award: ['tendering'],
	rejection: ['tendering'],
	final_award: ['tendering'],
	pv_opening: ['tendering'],
	pv_evaluation: ['tendering'],
	invitation_signing: ['contracting'],
	cover_letter: ['contracting']
};

export function formatCorrespondenceDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

export function getAvailableLetterTypes(
	currentPhase: ProjectPhase
): { value: string; label: string }[] {
	const phaseTypes = Object.entries(LETTER_TYPE_PHASES)
		.filter(([, phases]) => phases.includes(currentPhase))
		.map(([key]) => ({ value: key, label: LETTER_TYPE_LABELS[key] ?? key }));

	if (phaseTypes.length > 0) return phaseTypes;

	return Object.entries(LETTER_TYPE_LABELS).map(([value, label]) => ({ value, label }));
}
