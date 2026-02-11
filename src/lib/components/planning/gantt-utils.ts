// Gantt chart utility functions — scale calculations, date helpers, progress

import { scaleTime, type ScaleTime } from 'd3-scale';
import { timeDay, timeWeek, timeMonth } from 'd3-time';
import { timeFormat } from 'd3-time-format';
import type { PhaseActivity, Milestone, ActivityDependency, ProjectPhase } from '$types';
import { PROJECT_PHASE_LABELS } from '$types';

// =============================================================================
// TYPES
// =============================================================================

export type ViewMode = 'day' | 'week' | 'month';

export interface GanttTimeScale {
	scale: ScaleTime<number, number>;
	startDate: Date;
	endDate: Date;
	totalWidth: number;
}

export interface PhaseGroup {
	phase: ProjectPhase;
	label: string;
	startDate: Date | null;
	endDate: Date | null;
	progress: number;
	activities: PhaseActivity[];
	milestones: Milestone[];
	collapsed: boolean;
}

export interface GanttBarPosition {
	x: number;
	width: number;
	progressWidth: number;
}

export interface TimeMarker {
	date: Date;
	label: string;
	x: number;
	isMonth: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ROW_HEIGHT = 36;
const PHASE_ROW_HEIGHT = 40;
const HEADER_HEIGHT = 50;
const LEFT_PANEL_WIDTH = 240;
const MIN_BAR_WIDTH = 4;
const PADDING_DAYS = 14;

export const GANTT_CONSTANTS = {
	ROW_HEIGHT,
	PHASE_ROW_HEIGHT,
	HEADER_HEIGHT,
	LEFT_PANEL_WIDTH,
	MIN_BAR_WIDTH,
	PADDING_DAYS
} as const;

/** Phase colors (background / bar fill) */
export const PHASE_COLORS: Record<ProjectPhase, string> = {
	preparing: '#3b82f6',
	exploring: '#10b981',
	specifying: '#f59e0b',
	tendering: '#ef4444',
	contracting: '#8b5cf6'
};

/** Phase colors lighter variant for phase row background */
export const PHASE_BG_COLORS: Record<ProjectPhase, string> = {
	preparing: '#dbeafe',
	exploring: '#d1fae5',
	specifying: '#fef3c7',
	tendering: '#fee2e2',
	contracting: '#ede9fe'
};

// =============================================================================
// TIME SCALE
// =============================================================================

export function createTimeScale(
	startDate: Date,
	endDate: Date,
	viewMode: ViewMode
): GanttTimeScale {
	const paddedStart = timeDay.offset(startDate, -PADDING_DAYS);
	const paddedEnd = timeDay.offset(endDate, PADDING_DAYS);

	const dayCount = timeDay.count(paddedStart, paddedEnd);
	const dayWidth = getColumnWidth(viewMode);
	const totalWidth = dayCount * dayWidth;

	const scale = scaleTime()
		.domain([paddedStart, paddedEnd])
		.range([0, totalWidth]);

	return { scale, startDate: paddedStart, endDate: paddedEnd, totalWidth };
}

function getColumnWidth(viewMode: ViewMode): number {
	switch (viewMode) {
		case 'day':
			return 32;
		case 'week':
			return 8;
		case 'month':
			return 2.5;
	}
}

// =============================================================================
// POSITION CALCULATIONS
// =============================================================================

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
	const width = Math.max(scale(end) - x, MIN_BAR_WIDTH);
	const progressWidth = width * (progressPercentage / 100);

	return { x, width, progressWidth };
}

export function calculateMilestoneX(
	scale: ScaleTime<number, number>,
	targetDate: string
): number {
	return scale(new Date(targetDate));
}

// =============================================================================
// TIME AXIS MARKERS
// =============================================================================

export function generateTimeMarkers(
	timeScale: GanttTimeScale,
	viewMode: ViewMode
): TimeMarker[] {
	const { scale, startDate, endDate } = timeScale;
	const markers: TimeMarker[] = [];

	if (viewMode === 'day') {
		const days = timeDay.range(startDate, endDate);
		const dayFormat = timeFormat('%d');
		const monthFormat = timeFormat('%b %Y');

		let lastMonth = -1;
		for (const day of days) {
			const isMonth = day.getMonth() !== lastMonth;
			markers.push({
				date: day,
				label: isMonth ? monthFormat(day) : dayFormat(day),
				x: scale(day),
				isMonth
			});
			lastMonth = day.getMonth();
		}
	} else if (viewMode === 'week') {
		const weeks = timeWeek.range(startDate, endDate);
		const weekFormat = timeFormat('%d %b');
		const monthFormat = timeFormat('%b %Y');

		let lastMonth = -1;
		for (const week of weeks) {
			const isMonth = week.getMonth() !== lastMonth;
			markers.push({
				date: week,
				label: isMonth ? monthFormat(week) : weekFormat(week),
				x: scale(week),
				isMonth
			});
			lastMonth = week.getMonth();
		}
	} else {
		const months = timeMonth.range(startDate, endDate);
		const monthFormat = timeFormat('%b %Y');

		for (const month of months) {
			markers.push({
				date: month,
				label: monthFormat(month),
				x: scale(month),
				isMonth: true
			});
		}
	}

	return markers;
}

// =============================================================================
// PHASE GROUPING
// =============================================================================

const PHASE_ORDER: ProjectPhase[] = [
	'preparing',
	'exploring',
	'specifying',
	'tendering',
	'contracting'
];

export function groupByPhase(
	activities: PhaseActivity[],
	milestones: Milestone[]
): PhaseGroup[] {
	return PHASE_ORDER.map((phase) => {
		const phaseActivities = activities.filter((a) => a.phase === phase);
		const phaseMilestones = milestones.filter((m) => m.phase === phase);

		const dates = collectDates(phaseActivities, phaseMilestones);

		return {
			phase,
			label: PROJECT_PHASE_LABELS[phase],
			startDate: dates.length > 0 ? new Date(Math.min(...dates)) : null,
			endDate: dates.length > 0 ? new Date(Math.max(...dates)) : null,
			progress: calculatePhaseProgress(phaseActivities),
			activities: phaseActivities,
			milestones: phaseMilestones,
			collapsed: false
		};
	}).filter((g) => g.activities.length > 0 || g.milestones.length > 0);
}

function collectDates(
	activities: PhaseActivity[],
	milestones: Milestone[]
): number[] {
	const dates: number[] = [];

	for (const a of activities) {
		if (a.planned_start) dates.push(new Date(a.planned_start).getTime());
		if (a.planned_end) dates.push(new Date(a.planned_end).getTime());
		if (a.due_date) dates.push(new Date(a.due_date).getTime());
	}

	for (const m of milestones) {
		dates.push(new Date(m.target_date).getTime());
	}

	return dates;
}

// =============================================================================
// PROGRESS CALCULATIONS
// =============================================================================

export function calculatePhaseProgress(activities: PhaseActivity[]): number {
	if (activities.length === 0) return 0;

	const totalWeight = activities.reduce((sum, a) => {
		return sum + (a.estimated_hours ?? 1);
	}, 0);

	const completedWeight = activities.reduce((sum, a) => {
		const weight = a.estimated_hours ?? 1;
		return sum + (weight * a.progress_percentage / 100);
	}, 0);

	return Math.round(completedWeight / totalWeight * 100);
}

export function calculateOverallProgress(
	activities: PhaseActivity[],
	milestones: Milestone[]
): number {
	const totalActivities = activities.length;
	const completedActivities = activities.filter((a) => a.status === 'completed').length;
	const totalMilestones = milestones.length;
	const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
	const total = totalActivities + totalMilestones;
	if (total === 0) return 0;
	return Math.round(((completedActivities + completedMilestones) / total) * 100);
}

export function isOnTrack(
	activities: PhaseActivity[],
	milestones: Milestone[]
): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Check if any critical milestones are overdue
	const overdueCritical = milestones.some((m) => {
		return m.is_critical
			&& m.status !== 'completed'
			&& new Date(m.target_date) < today;
	});

	if (overdueCritical) return false;

	// Check if active activities are on track
	return activities
		.filter((a) => a.planned_start && new Date(a.planned_start) <= today && a.status !== 'completed')
		.every((a) => {
			const expected = calculateExpectedProgress(a, today);
			return a.progress_percentage >= expected * 0.8;
		});
}

function calculateExpectedProgress(activity: PhaseActivity, today: Date): number {
	if (!activity.planned_start || !activity.planned_end) return 0;

	const start = new Date(activity.planned_start).getTime();
	const end = new Date(activity.planned_end).getTime();
	const now = today.getTime();

	if (now <= start) return 0;
	if (now >= end) return 100;

	return Math.round(((now - start) / (end - start)) * 100);
}

// =============================================================================
// TIMELINE BOUNDS
// =============================================================================

export function calculateTimelineBounds(
	activities: PhaseActivity[],
	milestones: Milestone[],
	timelineStart: string | null,
	timelineEnd: string | null
): { start: Date; end: Date } {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let earliest = timelineStart ? new Date(timelineStart) : today;
	let latest = timelineEnd ? new Date(timelineEnd) : timeDay.offset(today, 90);

	for (const a of activities) {
		if (a.planned_start) {
			const d = new Date(a.planned_start);
			if (d < earliest) earliest = d;
		}
		if (a.planned_end) {
			const d = new Date(a.planned_end);
			if (d > latest) latest = d;
		}
		if (a.due_date) {
			const d = new Date(a.due_date);
			if (d > latest) latest = d;
		}
	}

	for (const m of milestones) {
		const d = new Date(m.target_date);
		if (d < earliest) earliest = d;
		if (d > latest) latest = d;
	}

	return { start: earliest, end: latest };
}

// =============================================================================
// DEPENDENCY PATH CALCULATION
// =============================================================================

export function calculateDependencyPath(
	sourceX: number,
	sourceY: number,
	targetX: number,
	targetY: number
): string {
	const midX = sourceX + (targetX - sourceX) / 2;

	// If target is to the right of source, use simple routing
	if (targetX > sourceX + 20) {
		return `M ${sourceX} ${sourceY} H ${midX} V ${targetY} H ${targetX}`;
	}

	// If target is to the left, route around
	const offset = 20;
	return `M ${sourceX} ${sourceY} H ${sourceX + offset} V ${sourceY > targetY ? targetY - offset : targetY + offset} H ${targetX - offset} V ${targetY} H ${targetX}`;
}

// =============================================================================
// FORMATTING
// =============================================================================

export function formatDateShort(date: Date): string {
	return date.toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'short'
	});
}

export function formatDateFull(date: Date): string {
	return date.toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
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

// =============================================================================
// SNAP TO GRID
// =============================================================================

export function snapToDay(date: Date): Date {
	const snapped = new Date(date);
	snapped.setHours(0, 0, 0, 0);
	return snapped;
}

export function daysBetween(date1: Date, date2: Date): number {
	return timeDay.count(date1, date2);
}

// =============================================================================
// TOTAL HEIGHT CALCULATION
// =============================================================================

export function calculateTotalHeight(phaseGroups: PhaseGroup[]): number {
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
