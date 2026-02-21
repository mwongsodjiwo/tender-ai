// Gantt layout — positioning, bar placement, dependency paths, time markers, date formatting

import { timeDay, timeWeek, timeMonth } from 'd3-time';
import { timeFormat } from 'd3-time-format';
import type { ScaleTime } from 'd3-scale';
import type { PhaseActivity } from '$types';
import type { GanttTimeScale, GanttBarPosition, TimeMarker, ViewMode, PhaseGroup } from './gantt-types';
import { GANTT_CONSTANTS } from './gantt-types';

export function dateToX(scale: ScaleTime<number, number>, date: Date): number {
	return scale(date);
}

export function xToDate(scale: ScaleTime<number, number>, x: number): Date {
	return scale.invert(x);
}

export function calculateBarPosition(
	scale: ScaleTime<number, number>,
	startDate: string | null,
	endDate: string | null,
	progressPercentage: number
): GanttBarPosition | null {
	if (!startDate || !endDate) return null;

	const start = new Date(startDate);
	const end = new Date(endDate);

	const x = scale(start);
	const width = Math.max(scale(end) - x, GANTT_CONSTANTS.MIN_BAR_WIDTH);
	const progressWidth = width * (progressPercentage / 100);

	return { x, width, progressWidth };
}

export function calculateMilestoneX(
	scale: ScaleTime<number, number>,
	targetDate: string
): number {
	return scale(new Date(targetDate));
}

export function generateTimeMarkers(
	timeScale: GanttTimeScale,
	viewMode: ViewMode
): TimeMarker[] {
	const { scale, startDate, endDate } = timeScale;
	const markers: TimeMarker[] = [];

	if (viewMode === 'day') {
		generateDayMarkers(markers, scale, startDate, endDate);
	} else if (viewMode === 'week') {
		generateWeekMarkers(markers, scale, startDate, endDate);
	} else {
		generateMonthMarkers(markers, scale, startDate, endDate);
	}

	return markers;
}

function generateDayMarkers(
	markers: TimeMarker[],
	scale: ScaleTime<number, number>,
	startDate: Date,
	endDate: Date
): void {
	const days = timeDay.range(startDate, endDate);
	const dayFmt = timeFormat('%d');
	const monthFmt = timeFormat('%b %Y');
	let lastMonth = -1;

	for (const day of days) {
		const isMonth = day.getMonth() !== lastMonth;
		markers.push({ date: day, label: isMonth ? monthFmt(day) : dayFmt(day), x: scale(day), isMonth });
		lastMonth = day.getMonth();
	}
}

function generateWeekMarkers(
	markers: TimeMarker[],
	scale: ScaleTime<number, number>,
	startDate: Date,
	endDate: Date
): void {
	const weeks = timeWeek.range(startDate, endDate);
	const weekFmt = timeFormat('%d %b');
	const monthFmt = timeFormat('%b %Y');
	let lastMonth = -1;

	for (const week of weeks) {
		const isMonth = week.getMonth() !== lastMonth;
		markers.push({ date: week, label: isMonth ? monthFmt(week) : weekFmt(week), x: scale(week), isMonth });
		lastMonth = week.getMonth();
	}
}

function generateMonthMarkers(
	markers: TimeMarker[],
	scale: ScaleTime<number, number>,
	startDate: Date,
	endDate: Date
): void {
	const months = timeMonth.range(startDate, endDate);
	const monthFmt = timeFormat('%b %Y');

	for (const month of months) {
		markers.push({ date: month, label: monthFmt(month), x: scale(month), isMonth: true });
	}
}

export function calculateDependencyPath(
	sourceX: number,
	sourceY: number,
	targetX: number,
	targetY: number
): string {
	const midX = sourceX + (targetX - sourceX) / 2;

	if (targetX > sourceX + 20) {
		return `M ${sourceX} ${sourceY} H ${midX} V ${targetY} H ${targetX}`;
	}

	const offset = 20;
	return `M ${sourceX} ${sourceY} H ${sourceX + offset} V ${sourceY > targetY ? targetY - offset : targetY + offset} H ${targetX - offset} V ${targetY} H ${targetX}`;
}

export function calculateTotalHeight(phaseGroups: PhaseGroup[]): number {
	const { HEADER_HEIGHT, PHASE_ROW_HEIGHT, ROW_HEIGHT } = GANTT_CONSTANTS;
	let height = HEADER_HEIGHT;

	for (const group of phaseGroups) {
		height += PHASE_ROW_HEIGHT;
		if (!group.collapsed) {
			height += group.activities.length * ROW_HEIGHT;
			height += group.milestones.length * ROW_HEIGHT;
		}
	}

	return height;
}

export function formatDateShort(date: Date): string {
	return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

export function formatDateFull(date: Date): string {
	return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function getDaysRemaining(targetDate: string): number {
	const target = new Date(targetDate);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	target.setHours(0, 0, 0, 0);
	return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getActivityDuration(activity: PhaseActivity): number {
	if (!activity.planned_start || !activity.planned_end) return 0;
	return timeDay.count(new Date(activity.planned_start), new Date(activity.planned_end));
}

export function snapToDay(date: Date): Date {
	const snapped = new Date(date);
	snapped.setHours(0, 0, 0, 0);
	return snapped;
}

export function daysBetween(date1: Date, date2: Date): number {
	return timeDay.count(date1, date2);
}
