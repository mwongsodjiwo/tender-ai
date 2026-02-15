// Planning API types

import type { Milestone, PhaseActivity } from '../database.js';
import type { ProjectPhase, ActivityStatus, ProjectStatus } from '../enums.js';

export interface CreatePhaseActivityRequest {
	phase: ProjectPhase;
	activity_type: string;
	title: string;
	description?: string;
	status?: ActivityStatus;
	sort_order?: number;
	assigned_to?: string;
	due_date?: string;
}

export interface UpdatePhaseActivityRequest {
	title?: string;
	description?: string;
	status?: ActivityStatus;
	sort_order?: number;
	assigned_to?: string;
	due_date?: string;
}

export type PhaseActivityResponse = PhaseActivity;
export type PhaseActivityListResponse = PhaseActivity[];

export interface DeadlineItem {
	id: string;
	type: 'milestone' | 'activity';
	title: string;
	date: string;
	project_id: string;
	project_name: string;
	phase: ProjectPhase;
	status: ActivityStatus;
	is_critical: boolean;
	assigned_to: string | null;
	assigned_to_name: string | null;
	days_remaining: number;
	is_overdue: boolean;
}

export interface DeadlineSummary {
	total: number;
	overdue: number;
	this_week: number;
	critical: number;
}

export interface DeadlineResponse {
	items: DeadlineItem[];
	summary: DeadlineSummary;
}

export interface OrganizationProjectPlanning {
	id: string;
	name: string;
	current_phase: ProjectPhase;
	timeline_start: string | null;
	timeline_end: string | null;
	progress: number;
	status: ProjectStatus;
	is_on_track: boolean;
	phases: {
		phase: ProjectPhase;
		start_date: string | null;
		end_date: string | null;
	}[];
	upcoming_milestones: Milestone[];
}

export interface CapacityMonth {
	month: string;
	label: string;
	active_projects: number;
	projects_in_specification: number;
	total_estimated_hours: number;
	available_hours: number;
}

export interface OrganizationPlanningOverview {
	projects: OrganizationProjectPlanning[];
	capacity: CapacityMonth[];
	warnings: string[];
	summary: {
		total_active: number;
		on_track: number;
		critical_deadlines: number;
	};
}

export interface WorkloadAssignment {
	project_id: string;
	project_name: string;
	activity_id: string;
	activity_title: string;
	phase: ProjectPhase;
	planned_start: string | null;
	planned_end: string | null;
	estimated_hours: number | null;
	status: ActivityStatus;
}

export interface MemberTimeLogged {
	week: string;
	hours: number;
	by_project: Record<string, number>;
}

export interface MemberWorkloadSummary {
	total_assigned_hours: number;
	total_logged_hours: number;
	utilization_percentage: number;
	overloaded_weeks: string[];
}

export interface MemberWorkload {
	profile_id: string;
	name: string;
	avatar_url: string | null;
	roles: string[];
	assignments: WorkloadAssignment[];
	time_logged: MemberTimeLogged[];
	summary: MemberWorkloadSummary;
}

export interface OverloadWarning {
	member_name: string;
	profile_id: string;
	weeks: string[];
	suggestion: string | null;
}

export interface TeamWorkloadResponse {
	members: MemberWorkload[];
	warnings: OverloadWarning[];
}

export interface PlanningExportQuery {
	phase?: string;
	include_activities?: boolean;
	include_milestones?: boolean;
}

export interface WeeklySummaryResponse {
	summary: string;
	generated_at: string;
	project_count: number;
	warnings: string[];
}
