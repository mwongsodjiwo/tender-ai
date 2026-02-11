// CSV export for planning milestones and activities

import type { Milestone, PhaseActivity } from '$types';
import { MILESTONE_TYPE_LABELS, ACTIVITY_STATUS_LABELS, PROJECT_PHASE_LABELS } from '$types';

interface CsvRow {
	type: string;
	title: string;
	phase: string;
	status: string;
	target_date: string;
	planned_start: string;
	planned_end: string;
	is_critical: string;
	progress: string;
	assigned_to: string;
}

export function generateCsvExport(
	milestones: Milestone[],
	activities: PhaseActivity[]
): string {
	const rows: CsvRow[] = [];

	for (const m of milestones) {
		rows.push({
			type: 'Milestone',
			title: m.title,
			phase: m.phase ? PROJECT_PHASE_LABELS[m.phase] : '',
			status: ACTIVITY_STATUS_LABELS[m.status],
			target_date: m.target_date,
			planned_start: '',
			planned_end: '',
			is_critical: m.is_critical ? 'Ja' : 'Nee',
			progress: '',
			assigned_to: ''
		});
	}

	for (const a of activities) {
		rows.push({
			type: 'Activiteit',
			title: a.title,
			phase: PROJECT_PHASE_LABELS[a.phase],
			status: ACTIVITY_STATUS_LABELS[a.status],
			target_date: a.due_date ?? '',
			planned_start: a.planned_start ?? '',
			planned_end: a.planned_end ?? '',
			is_critical: '',
			progress: `${a.progress_percentage}%`,
			assigned_to: a.assigned_to ?? ''
		});
	}

	return buildCsvString(rows);
}

function buildCsvString(rows: CsvRow[]): string {
	const headers = [
		'Type', 'Titel', 'Fase', 'Status', 'Deadline',
		'Geplande start', 'Gepland einde', 'Kritiek', 'Voortgang', 'Toegewezen aan'
	];

	const lines = [headers.join(';')];

	for (const row of rows) {
		lines.push([
			escapeCsvField(row.type),
			escapeCsvField(row.title),
			escapeCsvField(row.phase),
			escapeCsvField(row.status),
			escapeCsvField(row.target_date),
			escapeCsvField(row.planned_start),
			escapeCsvField(row.planned_end),
			escapeCsvField(row.is_critical),
			escapeCsvField(row.progress),
			escapeCsvField(row.assigned_to)
		].join(';'));
	}

	return '\uFEFF' + lines.join('\r\n');
}

function escapeCsvField(value: string): string {
	if (value.includes(';') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}
