// Gantt chart utilities — re-exports from split modules
// See gantt-types.ts, gantt-calculations.ts, gantt-layout.ts

export type { ViewMode, GanttTimeScale, PhaseGroup, GanttBarPosition, TimeMarker } from './gantt-types';
export { GANTT_CONSTANTS, PHASE_COLORS, PHASE_BG_COLORS, PHASE_ORDER } from './gantt-types';

export {
	createTimeScale,
	calculatePhaseProgress,
	calculateOverallProgress,
	isOnTrack,
	calculateTimelineBounds,
	groupByPhase
} from './gantt-calculations';

export {
	dateToX,
	xToDate,
	calculateBarPosition,
	calculateMilestoneX,
	generateTimeMarkers,
	calculateDependencyPath,
	calculateTotalHeight,
	formatDateShort,
	formatDateFull,
	getDaysRemaining,
	getActivityDuration,
	snapToDay,
	daysBetween
} from './gantt-layout';
