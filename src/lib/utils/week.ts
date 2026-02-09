// Week calculation utilities for time tracking

const DAYS_IN_WEEK = 7;
const THURSDAY_INDEX = 4;

/** Get the ISO week number for a given date */
export function getISOWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || DAYS_IN_WEEK;
	d.setUTCDate(d.getUTCDate() + THURSDAY_INDEX - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / DAYS_IN_WEEK);
}

/** Get ISO week year (may differ from calendar year for dates near year boundaries) */
export function getISOWeekYear(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || DAYS_IN_WEEK;
	d.setUTCDate(d.getUTCDate() + THURSDAY_INDEX - dayNum);
	return d.getUTCFullYear();
}

/** Format a date as ISO week string (e.g. "2026-W07") */
export function toISOWeekString(date: Date): string {
	const year = getISOWeekYear(date);
	const week = getISOWeekNumber(date);
	return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Get the Monday date for a given ISO week string */
export function getWeekMonday(weekStr: string): Date {
	const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
	if (!match) {
		throw new Error('Invalid week format. Expected YYYY-Wnn');
	}

	const year = parseInt(match[1], 10);
	const week = parseInt(match[2], 10);

	const jan4 = new Date(year, 0, 4);
	const dayOfWeek = jan4.getDay() || DAYS_IN_WEEK;
	const monday = new Date(jan4);
	monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * DAYS_IN_WEEK);

	return monday;
}

/** Get all dates (Mon-Sun) in a given ISO week */
export function getWeekDates(weekStr: string): Date[] {
	const monday = getWeekMonday(weekStr);
	const dates: Date[] = [];

	for (let i = 0; i < DAYS_IN_WEEK; i++) {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		dates.push(d);
	}

	return dates;
}

/** Format date as YYYY-MM-DD */
export function formatDateISO(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Format date as human-readable Dutch string (e.g. "Maandag 9 feb") */
export function formatDateDutch(date: Date): string {
	const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
	const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

	return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

/** Format week range as human-readable string (e.g. "9 feb – 15 feb 2026") */
export function formatWeekRange(weekStr: string): string {
	const dates = getWeekDates(weekStr);
	const monday = dates[0];
	const sunday = dates[6];

	const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

	const startStr = `${monday.getDate()} ${months[monday.getMonth()]}`;
	const endStr = `${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`;

	return `${startStr} – ${endStr}`;
}

/** Navigate to previous week */
export function previousWeek(weekStr: string): string {
	const monday = getWeekMonday(weekStr);
	monday.setDate(monday.getDate() - DAYS_IN_WEEK);
	return toISOWeekString(monday);
}

/** Navigate to next week */
export function nextWeek(weekStr: string): string {
	const monday = getWeekMonday(weekStr);
	monday.setDate(monday.getDate() + DAYS_IN_WEEK);
	return toISOWeekString(monday);
}
