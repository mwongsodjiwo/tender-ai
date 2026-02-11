// Legal minimum terms per procedure type (Dutch procurement law)
// Source: Aanbestedingswet 2012, Gids Proportionaliteit

import type { ProcedureType } from '$types';

export interface LegalMinimums {
	publication_period_days: number;
	nvi_response_days: number;
	standstill_days: number;
	selection_period_days?: number;
	dialogue_rounds?: number;
}

const LEGAL_MINIMUMS: Record<ProcedureType, LegalMinimums> = {
	open: {
		publication_period_days: 45,
		nvi_response_days: 6,
		standstill_days: 20
	},
	restricted: {
		publication_period_days: 30,
		selection_period_days: 30,
		nvi_response_days: 6,
		standstill_days: 20
	},
	negotiated_with_publication: {
		publication_period_days: 30,
		nvi_response_days: 6,
		standstill_days: 20
	},
	negotiated_without_publication: {
		publication_period_days: 0,
		nvi_response_days: 0,
		standstill_days: 0
	},
	competitive_dialogue: {
		publication_period_days: 30,
		nvi_response_days: 6,
		standstill_days: 20,
		dialogue_rounds: 3
	},
	innovation_partnership: {
		publication_period_days: 30,
		nvi_response_days: 6,
		standstill_days: 20
	},
	national_open: {
		publication_period_days: 20,
		nvi_response_days: 6,
		standstill_days: 20
	},
	national_restricted: {
		publication_period_days: 15,
		selection_period_days: 15,
		nvi_response_days: 6,
		standstill_days: 20
	},
	single_source: {
		publication_period_days: 0,
		nvi_response_days: 0,
		standstill_days: 0
	}
};

export function getLegalMinimums(procedureType: ProcedureType): LegalMinimums {
	return LEGAL_MINIMUMS[procedureType] ?? LEGAL_MINIMUMS.open;
}

export function formatLegalMinimums(minimums: LegalMinimums): string {
	const lines: string[] = [];

	if (minimums.publication_period_days > 0) {
		lines.push(`- Minimale publicatietermijn: ${minimums.publication_period_days} dagen`);
	}
	if (minimums.selection_period_days) {
		lines.push(`- Minimale selectieperiode: ${minimums.selection_period_days} dagen`);
	}
	if (minimums.nvi_response_days > 0) {
		lines.push(`- Minimale NvI-beantwoordtermijn: ${minimums.nvi_response_days} dagen`);
	}
	if (minimums.standstill_days > 0) {
		lines.push(`- Alcatel standstill-termijn: ${minimums.standstill_days} dagen`);
	}
	if (minimums.dialogue_rounds) {
		lines.push(`- Verwacht aantal dialoogrondes: ${minimums.dialogue_rounds}`);
	}

	return lines.join('\n');
}
