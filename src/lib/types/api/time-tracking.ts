// Time Entry API types

import type { TimeEntry, TimeEntryWithProject } from '../database.js';
import type { TimeEntryActivityType } from '../enums.js';

export interface CreateTimeEntryRequest {
	project_id: string;
	date: string;
	hours: number;
	activity_type: TimeEntryActivityType;
	notes?: string;
}

export interface UpdateTimeEntryRequest {
	project_id?: string;
	date?: string;
	hours?: number;
	activity_type?: TimeEntryActivityType;
	notes?: string;
}

export interface TimeEntryQuery {
	week?: string;
	from?: string;
	to?: string;
	project_id?: string;
}

export type TimeEntryResponse = TimeEntry;
export type TimeEntryListResponse = TimeEntryWithProject[];

export interface TimeEntryWeekSummary {
	entries: TimeEntryWithProject[];
	week_total: number;
	day_totals: Record<string, number>;
}

export interface TimeEntryReportData {
	entries: TimeEntryWithProject[];
	total_hours: number;
	by_project: { project_id: string; project_name: string; hours: number; percentage: number }[];
	by_activity: { activity_type: TimeEntryActivityType; label: string; hours: number; percentage: number }[];
	by_week: { week: string; label: string; hours: number }[];
}
