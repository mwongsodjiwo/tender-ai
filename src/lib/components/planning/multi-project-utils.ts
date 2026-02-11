// Utility functions for MultiProjectTimeline component (Sprint 5)

import type { OrganizationProjectPlanning } from '$types';
import type { ProjectPhase } from '$types';

export type ViewRange = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'year';

export interface MonthEntry {
	index: number;
	label: string;
}

export interface PhaseSegment {
	phase: ProjectPhase;
	x: number;
	width: number;
}

export interface ProjectBar {
	x: number;
	width: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export const PHASE_ABBREVIATIONS: Record<ProjectPhase, string> = {
	preparing: 'VB',
	exploring: 'VK',
	specifying: 'SPEC',
	tendering: 'AANB',
	contracting: 'CONTR'
};

export const RANGE_OPTIONS: { value: ViewRange; label: string }[] = [
	{ value: 'Q1', label: 'Q1' },
	{ value: 'Q2', label: 'Q2' },
	{ value: 'Q3', label: 'Q3' },
	{ value: 'Q4', label: 'Q4' },
	{ value: 'year', label: 'Jaar' }
];

export function getVisibleMonths(range: ViewRange): MonthEntry[] {
	const all = MONTH_LABELS.map((label, index) => ({ index, label }));
	switch (range) {
		case 'Q1': return all.slice(0, 3);
		case 'Q2': return all.slice(3, 6);
		case 'Q3': return all.slice(6, 9);
		case 'Q4': return all.slice(9, 12);
		default: return all;
	}
}

function daysInMonth(month: number, year: number): number {
	return new Date(year, month + 1, 0).getDate();
}

export function getTodayX(months: MonthEntry[], year: number, colWidth: number): number | null {
	const today = new Date();
	if (today.getFullYear() !== year) return null;
	const visIdx = months.findIndex((m) => m.index === today.getMonth());
	if (visIdx === -1) return null;
	const fraction = today.getDate() / daysInMonth(today.getMonth(), year);
	return visIdx * colWidth + fraction * colWidth;
}

export function dateToX(dateStr: string, months: MonthEntry[], year: number, chartWidth: number, colWidth: number): number | null {
	const d = new Date(dateStr);
	if (d.getFullYear() < year) return 0;
	if (d.getFullYear() > year) return chartWidth;
	const visIdx = months.findIndex((m) => m.index === d.getMonth());
	if (visIdx === -1) return null;
	const fraction = d.getDate() / daysInMonth(d.getMonth(), year);
	return visIdx * colWidth + fraction * colWidth;
}

export function getPhaseSegments(
	project: OrganizationProjectPlanning,
	months: MonthEntry[],
	year: number,
	chartWidth: number,
	colWidth: number
): PhaseSegment[] {
	return project.phases
		.filter((p) => p.start_date && p.end_date)
		.map((p) => {
			const startX = dateToX(p.start_date!, months, year, chartWidth, colWidth);
			const endX = dateToX(p.end_date!, months, year, chartWidth, colWidth);
			if (startX === null || endX === null) return null;
			const x = Math.max(0, startX);
			const w = Math.min(chartWidth, endX) - x;
			return { phase: p.phase, x, width: Math.max(w, 4) };
		})
		.filter((s): s is PhaseSegment => s !== null);
}

export function getProjectBar(
	project: OrganizationProjectPlanning,
	months: MonthEntry[],
	year: number,
	chartWidth: number,
	colWidth: number
): ProjectBar | null {
	if (!project.timeline_start || !project.timeline_end) return null;
	const startX = dateToX(project.timeline_start, months, year, chartWidth, colWidth);
	const endX = dateToX(project.timeline_end, months, year, chartWidth, colWidth);
	if (startX === null || endX === null) return null;
	const x = Math.max(0, startX);
	const w = Math.min(chartWidth, endX) - x;
	return { x, width: Math.max(w, 4) };
}
