// iCal export for planning milestones and activities

import type { Milestone, PhaseActivity } from '$types';

interface ICalEvent {
	uid: string;
	summary: string;
	description: string;
	date: string;
	categories: string[];
}

export function generateICalFeed(
	projectName: string,
	milestones: Milestone[],
	activities: PhaseActivity[]
): string {
	const events: ICalEvent[] = [];

	for (const m of milestones) {
		events.push({
			uid: `milestone-${m.id}@tendermanager`,
			summary: `[${projectName}] ${m.title}`,
			description: m.description || '',
			date: m.target_date,
			categories: ['Milestone', m.milestone_type]
		});
	}

	for (const a of activities) {
		if (!a.due_date && !a.planned_end) continue;
		const date = a.due_date ?? a.planned_end;
		if (!date) continue;

		events.push({
			uid: `activity-${a.id}@tendermanager`,
			summary: `[${projectName}] ${a.title}`,
			description: a.description || '',
			date,
			categories: ['Activiteit', a.phase]
		});
	}

	return buildICalString(events);
}

function buildICalString(events: ICalEvent[]): string {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//TenderManager//Planning//NL',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'X-WR-CALNAME:TenderManager Planning'
	];

	for (const event of events) {
		const dateFormatted = event.date.replace(/-/g, '');
		lines.push(
			'BEGIN:VEVENT',
			`UID:${event.uid}`,
			`DTSTART;VALUE=DATE:${dateFormatted}`,
			`DTEND;VALUE=DATE:${dateFormatted}`,
			`SUMMARY:${escapeICalText(event.summary)}`,
			`DESCRIPTION:${escapeICalText(event.description)}`,
			`CATEGORIES:${event.categories.join(',')}`,
			'END:VEVENT'
		);
	}

	lines.push('END:VCALENDAR');
	return lines.join('\r\n');
}

function escapeICalText(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n');
}
