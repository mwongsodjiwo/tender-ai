// Default milestones per procedure type
// Used when creating a new project to seed standard milestones

import type { MilestoneType, ProjectPhase, ProcedureType } from '$types';

interface DefaultMilestone {
	milestone_type: MilestoneType;
	title: string;
	phase: ProjectPhase;
	is_critical: boolean;
	sort_order: number;
}

const OPEN_MILESTONES: DefaultMilestone[] = [
	{ milestone_type: 'phase_start', title: 'Start voorbereiding', phase: 'preparing', is_critical: false, sort_order: 0 },
	{ milestone_type: 'phase_end', title: 'Projectprofiel bevestigd', phase: 'preparing', is_critical: true, sort_order: 1 },
	{ milestone_type: 'phase_start', title: 'Start marktverkenning', phase: 'exploring', is_critical: false, sort_order: 2 },
	{ milestone_type: 'phase_end', title: 'Marktverkenning afgerond', phase: 'exploring', is_critical: false, sort_order: 3 },
	{ milestone_type: 'phase_start', title: 'Start specificatie', phase: 'specifying', is_critical: false, sort_order: 4 },
	{ milestone_type: 'phase_end', title: 'Aanbestedingsstukken gereed', phase: 'specifying', is_critical: true, sort_order: 5 },
	{ milestone_type: 'publication', title: 'Publicatie op TenderNed', phase: 'tendering', is_critical: true, sort_order: 6 },
	{ milestone_type: 'nota_van_inlichtingen', title: 'Deadline NvI-vragen', phase: 'tendering', is_critical: false, sort_order: 7 },
	{ milestone_type: 'submission_deadline', title: 'Inschrijfdeadline', phase: 'tendering', is_critical: true, sort_order: 8 },
	{ milestone_type: 'award_decision', title: 'Gunningsbesluit', phase: 'tendering', is_critical: true, sort_order: 9 },
	{ milestone_type: 'standstill_end', title: 'Einde Alcatel-termijn', phase: 'tendering', is_critical: false, sort_order: 10 },
	{ milestone_type: 'contract_signed', title: 'Contractondertekening', phase: 'contracting', is_critical: true, sort_order: 11 }
];

const RESTRICTED_MILESTONES: DefaultMilestone[] = [
	{ milestone_type: 'phase_start', title: 'Start voorbereiding', phase: 'preparing', is_critical: false, sort_order: 0 },
	{ milestone_type: 'phase_end', title: 'Projectprofiel bevestigd', phase: 'preparing', is_critical: true, sort_order: 1 },
	{ milestone_type: 'phase_start', title: 'Start marktverkenning', phase: 'exploring', is_critical: false, sort_order: 2 },
	{ milestone_type: 'phase_end', title: 'Marktverkenning afgerond', phase: 'exploring', is_critical: false, sort_order: 3 },
	{ milestone_type: 'phase_start', title: 'Start specificatie', phase: 'specifying', is_critical: false, sort_order: 4 },
	{ milestone_type: 'phase_end', title: 'Aanbestedingsstukken gereed', phase: 'specifying', is_critical: true, sort_order: 5 },
	{ milestone_type: 'custom', title: 'Selectieleidraad publicatie', phase: 'tendering', is_critical: true, sort_order: 6 },
	{ milestone_type: 'nota_van_inlichtingen', title: 'Deadline NvI-vragen selectie', phase: 'tendering', is_critical: false, sort_order: 7 },
	{ milestone_type: 'custom', title: 'Selectiebesluit', phase: 'tendering', is_critical: true, sort_order: 8 },
	{ milestone_type: 'publication', title: 'Uitnodiging inschrijving', phase: 'tendering', is_critical: true, sort_order: 9 },
	{ milestone_type: 'nota_van_inlichtingen', title: 'Deadline NvI-vragen inschrijving', phase: 'tendering', is_critical: false, sort_order: 10 },
	{ milestone_type: 'submission_deadline', title: 'Inschrijfdeadline', phase: 'tendering', is_critical: true, sort_order: 11 },
	{ milestone_type: 'award_decision', title: 'Gunningsbesluit', phase: 'tendering', is_critical: true, sort_order: 12 },
	{ milestone_type: 'standstill_end', title: 'Einde Alcatel-termijn', phase: 'tendering', is_critical: false, sort_order: 13 },
	{ milestone_type: 'contract_signed', title: 'Contractondertekening', phase: 'contracting', is_critical: true, sort_order: 14 }
];

const COMPETITIVE_DIALOGUE_MILESTONES: DefaultMilestone[] = [
	{ milestone_type: 'phase_start', title: 'Start voorbereiding', phase: 'preparing', is_critical: false, sort_order: 0 },
	{ milestone_type: 'phase_end', title: 'Projectprofiel bevestigd', phase: 'preparing', is_critical: true, sort_order: 1 },
	{ milestone_type: 'phase_start', title: 'Start marktverkenning', phase: 'exploring', is_critical: false, sort_order: 2 },
	{ milestone_type: 'phase_end', title: 'Marktverkenning afgerond', phase: 'exploring', is_critical: false, sort_order: 3 },
	{ milestone_type: 'publication', title: 'Publicatie aankondiging', phase: 'tendering', is_critical: true, sort_order: 4 },
	{ milestone_type: 'custom', title: 'Selectiebesluit', phase: 'tendering', is_critical: true, sort_order: 5 },
	{ milestone_type: 'custom', title: 'Start dialoog', phase: 'tendering', is_critical: true, sort_order: 6 },
	{ milestone_type: 'custom', title: 'Einde dialoog', phase: 'tendering', is_critical: true, sort_order: 7 },
	{ milestone_type: 'submission_deadline', title: 'Inschrijfdeadline', phase: 'tendering', is_critical: true, sort_order: 8 },
	{ milestone_type: 'award_decision', title: 'Gunningsbesluit', phase: 'tendering', is_critical: true, sort_order: 9 },
	{ milestone_type: 'standstill_end', title: 'Einde Alcatel-termijn', phase: 'tendering', is_critical: false, sort_order: 10 },
	{ milestone_type: 'contract_signed', title: 'Contractondertekening', phase: 'contracting', is_critical: true, sort_order: 11 }
];

const NEGOTIATED_WITH_PUB_MILESTONES: DefaultMilestone[] = [
	{ milestone_type: 'phase_start', title: 'Start voorbereiding', phase: 'preparing', is_critical: false, sort_order: 0 },
	{ milestone_type: 'phase_end', title: 'Projectprofiel bevestigd', phase: 'preparing', is_critical: true, sort_order: 1 },
	{ milestone_type: 'publication', title: 'Publicatie aankondiging', phase: 'tendering', is_critical: true, sort_order: 2 },
	{ milestone_type: 'custom', title: 'Selectiebesluit', phase: 'tendering', is_critical: true, sort_order: 3 },
	{ milestone_type: 'custom', title: 'Start onderhandelingen', phase: 'tendering', is_critical: false, sort_order: 4 },
	{ milestone_type: 'submission_deadline', title: 'Definitieve inschrijving', phase: 'tendering', is_critical: true, sort_order: 5 },
	{ milestone_type: 'award_decision', title: 'Gunningsbesluit', phase: 'tendering', is_critical: true, sort_order: 6 },
	{ milestone_type: 'standstill_end', title: 'Einde Alcatel-termijn', phase: 'tendering', is_critical: false, sort_order: 7 },
	{ milestone_type: 'contract_signed', title: 'Contractondertekening', phase: 'contracting', is_critical: true, sort_order: 8 }
];

const SIMPLE_MILESTONES: DefaultMilestone[] = [
	{ milestone_type: 'phase_start', title: 'Start voorbereiding', phase: 'preparing', is_critical: false, sort_order: 0 },
	{ milestone_type: 'phase_end', title: 'Projectprofiel bevestigd', phase: 'preparing', is_critical: true, sort_order: 1 },
	{ milestone_type: 'custom', title: 'Offerte-uitvraag verstuurd', phase: 'tendering', is_critical: true, sort_order: 2 },
	{ milestone_type: 'submission_deadline', title: 'Deadline offertes', phase: 'tendering', is_critical: true, sort_order: 3 },
	{ milestone_type: 'award_decision', title: 'Gunningsbesluit', phase: 'tendering', is_critical: true, sort_order: 4 },
	{ milestone_type: 'contract_signed', title: 'Contractondertekening', phase: 'contracting', is_critical: true, sort_order: 5 }
];

export const DEFAULT_MILESTONES: Record<ProcedureType, DefaultMilestone[]> = {
	open: OPEN_MILESTONES,
	restricted: RESTRICTED_MILESTONES,
	negotiated_with_publication: NEGOTIATED_WITH_PUB_MILESTONES,
	negotiated_without_publication: SIMPLE_MILESTONES,
	competitive_dialogue: COMPETITIVE_DIALOGUE_MILESTONES,
	innovation_partnership: RESTRICTED_MILESTONES,
	national_open: OPEN_MILESTONES,
	national_restricted: RESTRICTED_MILESTONES,
	single_source: SIMPLE_MILESTONES
};

export function getDefaultMilestones(procedureType: ProcedureType): DefaultMilestone[] {
	return DEFAULT_MILESTONES[procedureType] ?? OPEN_MILESTONES;
}
