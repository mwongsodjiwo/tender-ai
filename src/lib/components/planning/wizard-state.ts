import { PROJECT_PHASE_LABELS } from '$types';

export type WizardStep = 'parameters' | 'preview' | 'confirmation';

export interface PlanningActivity {
	title: string;
	description: string;
	activity_type: string;
	planned_start: string;
	planned_end: string;
	estimated_hours: number;
	assigned_role: string;
}

export interface PlanningMilestone {
	milestone_type: string;
	title: string;
	target_date: string;
	is_critical: boolean;
}

export interface PlanningPhase {
	phase: string;
	start_date: string;
	end_date: string;
	activities: PlanningActivity[];
	milestones: PlanningMilestone[];
}

export interface GeneratedPlanningResponse {
	planning: {
		phases: PlanningPhase[];
		dependencies: {
			from_title: string;
			to_title: string;
			type: string;
			lag_days: number;
		}[];
		total_duration_days: number;
		total_estimated_hours: number;
	};
	rationale: string;
	warnings: string[];
}

export interface ApplyResult {
	total_activities: number;
	total_milestones: number;
	total_dependencies: number;
}

export const WIZARD_STEPS: WizardStep[] = ['parameters', 'preview', 'confirmation'];
export const WIZARD_STEP_LABELS = ['Parameters', 'Preview', 'Bevestiging'];

const ROLE_LABELS: Record<string, string> = {
	project_leader: 'Projectleider',
	procurement_advisor: 'Inkoopadviseur',
	legal_advisor: 'Jurist',
	budget_holder: 'Budgethouder',
	subject_expert: 'Vakinhoudelijk expert'
};

export function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

export function formatPhaseLabel(phase: string): string {
	return PROJECT_PHASE_LABELS[phase as keyof typeof PROJECT_PHASE_LABELS] ?? phase;
}

export function formatRoleLabel(role: string): string {
	return ROLE_LABELS[role] ?? role;
}
