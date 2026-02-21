// Gantt calculations — time scale, progress tracking, timeline bounds, phase grouping

import { scaleTime } from 'd3-scale';
import { timeDay } from 'd3-time';
import type { PhaseActivity, Milestone } from '$types';
import { PROJECT_PHASE_LABELS } from '$types';
import type { GanttTimeScale, ViewMode, PhaseGroup } from './gantt-types';
import { GANTT_CONSTANTS, PHASE_ORDER } from './gantt-types';

export function createTimeScale(
	startDate: Date,
	endDate: Date,
	viewMode: ViewMode
): GanttTimeScale {
	const paddedStart = timeDay.offset(startDate, -GANTT_CONSTANTS.PADDING_DAYS);
	const paddedEnd = timeDay.offset(endDate, GANTT_CONSTANTS.PADDING_DAYS);

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

	const overdueCritical = milestones.some((m) => {
		return m.is_critical
			&& m.status !== 'completed'
			&& new Date(m.target_date) < today;
	});

	if (overdueCritical) return false;

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
