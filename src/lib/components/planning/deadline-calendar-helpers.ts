// Deadline calendar helpers — date formatting, grid building, dot colors

import type { DeadlineItem } from '$types';

export interface CalendarDay {
	date: Date;
	dateStr: string;
	isCurrentMonth: boolean;
	isToday: boolean;
}

export function formatDateKey(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function buildCalendarGrid(year: number, month: number): CalendarDay[] {
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);

	let startOffset = firstDay.getDay() - 1;
	if (startOffset < 0) startOffset = 6;

	const days: CalendarDay[] = [];
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	for (let i = startOffset - 1; i >= 0; i--) {
		const d = new Date(year, month, -i);
		days.push({ date: d, dateStr: formatDateKey(d), isCurrentMonth: false, isToday: d.getTime() === today.getTime() });
	}

	for (let i = 1; i <= lastDay.getDate(); i++) {
		const d = new Date(year, month, i);
		days.push({ date: d, dateStr: formatDateKey(d), isCurrentMonth: true, isToday: d.getTime() === today.getTime() });
	}

	const remaining = 42 - days.length;
	for (let i = 1; i <= remaining; i++) {
		const d = new Date(year, month + 1, i);
		days.push({ date: d, dateStr: formatDateKey(d), isCurrentMonth: false, isToday: d.getTime() === today.getTime() });
	}

	return days;
}

export function getDotColor(item: DeadlineItem): string {
	if (item.days_remaining < 0) return 'bg-red-500';
	if (item.days_remaining <= 7) return 'bg-orange-500';
	if (item.days_remaining <= 14) return 'bg-yellow-500';
	return 'bg-green-500';
}

export function formatPopoverDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('nl-NL', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

export function formatDaysLabel(days: number): string {
	if (days === 0) return 'Vandaag';
	if (days === 1) return 'Morgen';
	if (days === -1) return 'Gisteren';
	if (days < 0) return `${Math.abs(days)}d verlopen`;
	return `${days}d`;
}

export function groupItemsByDate(items: DeadlineItem[]): Record<string, DeadlineItem[]> {
	return items.reduce(
		(acc, item) => {
			const dateKey = item.date.split('T')[0];
			if (!acc[dateKey]) acc[dateKey] = [];
			acc[dateKey].push(item);
			return acc;
		},
		{} as Record<string, DeadlineItem[]>
	);
}
