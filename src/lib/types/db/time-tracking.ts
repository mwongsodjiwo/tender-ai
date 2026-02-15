import type { TimeEntryActivityType } from '../enums.js';

// =============================================================================
// TIME ENTRIES — Urenregistratie module
// =============================================================================

export interface TimeEntry {
	id: string;
	user_id: string;
	organization_id: string;
	project_id: string;
	date: string;
	hours: number;
	activity_type: TimeEntryActivityType;
	notes: string;
	created_at: string;
	updated_at: string;
}

export interface TimeEntryWithProject extends TimeEntry {
	project: {
		id: string;
		name: string;
	};
}
