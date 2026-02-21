// Gantt chart types — interfaces and constants

import type { ScaleTime } from 'd3-scale';
import type { PhaseActivity, Milestone, ProjectPhase } from '$types';

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

/** Ordered list of project phases */
export const PHASE_ORDER: ProjectPhase[] = [
	'preparing',
	'exploring',
	'specifying',
	'tendering',
	'contracting'
];
