// Dashboard API types

import type { ProjectPhase } from '../enums.js';

export interface MonthlyProjectData {
	month: string;
	label: string;
	started: number;
	completed: number;
}

export interface DashboardRecentProject {
	id: string;
	name: string;
	current_phase: ProjectPhase;
	deadline_date: string | null;
	progress: number;
	updated_at: string;
}

export interface DashboardMetrics {
	total_projects: number;
	active_projects: number;
	completed_projects: number;
	in_review_count: number;
	in_review_trend: number;
	average_progress: number;
	sections_by_status: Record<string, number>;
	total_sections: number;
}

export interface DashboardResponse {
	metrics: DashboardMetrics;
	recent_projects: DashboardRecentProject[];
	upcoming_deadlines: DashboardRecentProject[];
	monthly_data: MonthlyProjectData[];
}
