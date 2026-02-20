// Procurement timeline calculation — Fase 34
// Calculates milestones based on procedure type and anchor date
// Supports cascading date changes while preserving manual overrides

import type { ProcedureType, MilestoneType } from '$types/enums';

/** Source of a milestone date: calculated by system or set manually */
export type MilestoneSource = 'manual' | 'calculated';

/** A milestone step in a procurement timeline */
export interface TimelineMilestone {
	milestone_type: MilestoneType;
	label: string;
	target_date: string;
	source: MilestoneSource;
	min_days_from_previous: number;
}

/** A single deadline step definition */
interface DeadlineStep {
	from: MilestoneType;
	to: MilestoneType;
	label: string;
	min_days: number;
}

/** Ordered deadline steps per procedure type */
const EUROPEAN_OPEN_STEPS: readonly DeadlineStep[] = [
	{ from: 'publication', to: 'submission_deadline', label: 'Inschrijfdeadline', min_days: 35 },
	{ from: 'submission_deadline', to: 'award_decision', label: 'Gunningsbesluit', min_days: 0 },
	{ from: 'award_decision', to: 'standstill_end', label: 'Einde Alcatel standstill', min_days: 20 },
	{ from: 'standstill_end', to: 'contract_signed', label: 'Contract getekend', min_days: 0 }
] as const;

const EUROPEAN_RESTRICTED_STEPS: readonly DeadlineStep[] = [
	{ from: 'publication', to: 'submission_deadline', label: 'Inschrijfdeadline', min_days: 30 },
	{ from: 'submission_deadline', to: 'award_decision', label: 'Gunningsbesluit', min_days: 0 },
	{ from: 'award_decision', to: 'standstill_end', label: 'Einde Alcatel standstill', min_days: 20 },
	{ from: 'standstill_end', to: 'contract_signed', label: 'Contract getekend', min_days: 0 }
] as const;

const NATIONAL_OPEN_STEPS: readonly DeadlineStep[] = [
	{ from: 'publication', to: 'submission_deadline', label: 'Inschrijfdeadline', min_days: 20 },
	{ from: 'submission_deadline', to: 'award_decision', label: 'Gunningsbesluit', min_days: 0 },
	{ from: 'award_decision', to: 'contract_signed', label: 'Contract getekend', min_days: 0 }
] as const;

const NATIONAL_RESTRICTED_STEPS: readonly DeadlineStep[] = [
	{ from: 'publication', to: 'submission_deadline', label: 'Inschrijfdeadline', min_days: 15 },
	{ from: 'submission_deadline', to: 'award_decision', label: 'Gunningsbesluit', min_days: 0 },
	{ from: 'award_decision', to: 'contract_signed', label: 'Contract getekend', min_days: 0 }
] as const;

const NEGOTIATED_STEPS: readonly DeadlineStep[] = [
	{ from: 'publication', to: 'submission_deadline', label: 'Inschrijfdeadline', min_days: 30 },
	{ from: 'submission_deadline', to: 'award_decision', label: 'Gunningsbesluit', min_days: 0 },
	{ from: 'award_decision', to: 'standstill_end', label: 'Einde Alcatel standstill', min_days: 20 },
	{ from: 'standstill_end', to: 'contract_signed', label: 'Contract getekend', min_days: 0 }
] as const;

const COMPETITIVE_DIALOGUE_STEPS: readonly DeadlineStep[] = [
	{ from: 'publication', to: 'submission_deadline', label: 'Inschrijfdeadline', min_days: 30 },
	{ from: 'submission_deadline', to: 'award_decision', label: 'Gunningsbesluit', min_days: 0 },
	{ from: 'award_decision', to: 'standstill_end', label: 'Einde Alcatel standstill', min_days: 20 },
	{ from: 'standstill_end', to: 'contract_signed', label: 'Contract getekend', min_days: 0 }
] as const;

const SINGLE_SOURCE_STEPS: readonly DeadlineStep[] = [
	{ from: 'publication', to: 'award_decision', label: 'Gunningsbesluit', min_days: 0 },
	{ from: 'award_decision', to: 'contract_signed', label: 'Contract getekend', min_days: 0 }
] as const;

/** Maps procedure types to their deadline steps */
export const PROCEDURE_DEADLINES: Record<ProcedureType, readonly DeadlineStep[]> = {
	open: EUROPEAN_OPEN_STEPS,
	restricted: EUROPEAN_RESTRICTED_STEPS,
	negotiated_with_publication: NEGOTIATED_STEPS,
	negotiated_without_publication: SINGLE_SOURCE_STEPS,
	competitive_dialogue: COMPETITIVE_DIALOGUE_STEPS,
	innovation_partnership: NEGOTIATED_STEPS,
	national_open: NATIONAL_OPEN_STEPS,
	national_restricted: NATIONAL_RESTRICTED_STEPS,
	single_source: SINGLE_SOURCE_STEPS
};

/** Adds calendar days to a date string (YYYY-MM-DD) */
function addDays(dateStr: string, days: number): string {
	const date = new Date(dateStr + 'T00:00:00Z');
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().split('T')[0];
}

/** Calculates the number of days between two date strings */
function daysBetween(fromStr: string, toStr: string): number {
	const from = new Date(fromStr + 'T00:00:00Z');
	const to = new Date(toStr + 'T00:00:00Z');
	const diffMs = to.getTime() - from.getTime();
	return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Calculates a full timeline from an anchor date and procedure type */
export function calculateTimeline(
	anchorDate: string,
	procedureType: ProcedureType
): TimelineMilestone[] {
	const steps = PROCEDURE_DEADLINES[procedureType];
	const milestones: TimelineMilestone[] = [];

	milestones.push({
		milestone_type: 'publication',
		label: 'Publicatie',
		target_date: anchorDate,
		source: 'calculated',
		min_days_from_previous: 0
	});

	let currentDate = anchorDate;
	for (const step of steps) {
		const nextDate = addDays(currentDate, step.min_days);
		milestones.push({
			milestone_type: step.to,
			label: step.label,
			target_date: nextDate,
			source: 'calculated',
			min_days_from_previous: step.min_days
		});
		currentDate = nextDate;
	}

	return milestones;
}

/** Cascades date changes through milestones, preserving valid manual dates */
export function cascadeDates(
	milestones: TimelineMilestone[],
	changedIndex: number,
	newDate: string
): TimelineMilestone[] {
	const result = milestones.map((m) => ({ ...m }));
	result[changedIndex].target_date = newDate;
	result[changedIndex].source = 'manual';

	for (let i = changedIndex + 1; i < result.length; i++) {
		const prevDate = result[i - 1].target_date;
		const minDays = result[i].min_days_from_previous;
		const earliestAllowed = addDays(prevDate, minDays);

		if (isDateBefore(result[i].target_date, earliestAllowed)) {
			result[i].target_date = earliestAllowed;
			if (result[i].source === 'manual') {
				result[i].source = 'calculated';
			}
		}
		// Manual dates that still satisfy minimum are preserved
	}

	return result;
}

/** Returns true if dateA is strictly before dateB */
function isDateBefore(dateA: string, dateB: string): boolean {
	return daysBetween(dateA, dateB) > 0;
}
