// Shared helpers for cross-project planning overview (Sprint 5)
// Used by both the API endpoint and the page server load

import type {
	OrganizationProjectPlanning,
	CapacityMonth,
	DeadlineItem
} from '$types';
import type { Milestone, PhaseActivity } from '$types';
import { PROJECT_PHASES } from '$types';
import type { ProjectPhase, ProjectStatus } from '$types';

const DAYS_MS = 1000 * 60 * 60 * 24;
const WORKDAYS_PER_MONTH = 21;
const HOURS_PER_DAY = 8;

export function getEarliestDate(acts: PhaseActivity[], ms: Milestone[]): string | null {
	const dates: number[] = [];
	for (const a of acts) { if (a.planned_start) dates.push(new Date(a.planned_start).getTime()); }
	for (const m of ms) { dates.push(new Date(m.target_date).getTime()); }
	return dates.length > 0 ? new Date(Math.min(...dates)).toISOString().split('T')[0] : null;
}

export function getLatestDate(acts: PhaseActivity[], ms: Milestone[]): string | null {
	const dates: number[] = [];
	for (const a of acts) {
		if (a.planned_end) dates.push(new Date(a.planned_end).getTime());
		if (a.due_date) dates.push(new Date(a.due_date).getTime());
	}
	for (const m of ms) { dates.push(new Date(m.target_date).getTime()); }
	return dates.length > 0 ? new Date(Math.max(...dates)).toISOString().split('T')[0] : null;
}

export function buildPhaseTimeline(acts: PhaseActivity[], ms: Milestone[]) {
	return PROJECT_PHASES.map((phase: ProjectPhase) => {
		const pa = acts.filter((a) => a.phase === phase);
		const pm = ms.filter((m) => m.phase === phase);
		return { phase, start_date: getEarliestDate(pa, pm), end_date: getLatestDate(pa, pm) };
	}).filter((p) => p.start_date || p.end_date);
}

export function calculateProgress(acts: PhaseActivity[], ms: Milestone[]): number {
	const total = acts.length + ms.length;
	if (total === 0) return 0;
	const done = acts.filter((a) => a.status === 'completed').length
		+ ms.filter((m) => m.status === 'completed').length;
	return Math.round((done / total) * 100);
}

export function checkOnTrack(acts: PhaseActivity[], ms: Milestone[], today: Date): boolean {
	if (ms.some((m) => m.is_critical && m.status !== 'completed' && new Date(m.target_date) < today)) {
		return false;
	}
	return acts
		.filter((a) => a.planned_start && new Date(a.planned_start) <= today && a.status !== 'completed')
		.every((a) => {
			if (!a.planned_start || !a.planned_end) return true;
			const s = new Date(a.planned_start).getTime();
			const e = new Date(a.planned_end).getTime();
			const n = today.getTime();
			const exp = n >= e ? 100 : n <= s ? 0 : Math.round(((n - s) / (e - s)) * 100);
			return a.progress_percentage >= exp * 0.8;
		});
}

export function buildProjectPlanning(
	proj: { id: string; name: string; status: ProjectStatus; current_phase: ProjectPhase },
	profile: { timeline_start: string | null; timeline_end: string | null } | undefined,
	milestones: Milestone[],
	activities: PhaseActivity[],
	today: Date
): OrganizationProjectPlanning {
	const todayMs = today.getTime();
	const phases = buildPhaseTimeline(activities, milestones);
	const progress = calculateProgress(activities, milestones);
	const isOnTrack = checkOnTrack(activities, milestones, today);

	const upcoming = milestones.filter((m) => {
		const days = Math.ceil((new Date(m.target_date).getTime() - todayMs) / DAYS_MS);
		return m.status !== 'completed' && days >= 0 && days <= 30;
	});

	return {
		id: proj.id,
		name: proj.name,
		current_phase: proj.current_phase,
		timeline_start: profile?.timeline_start ?? getEarliestDate(activities, milestones),
		timeline_end: profile?.timeline_end ?? getLatestDate(activities, milestones),
		progress,
		status: proj.status,
		is_on_track: isOnTrack,
		phases,
		upcoming_milestones: upcoming
	};
}

function isActiveInRange(p: OrganizationProjectPlanning, start: Date, end: Date): boolean {
	if (!p.timeline_start || !p.timeline_end) return false;
	return new Date(p.timeline_start) <= end && new Date(p.timeline_end) >= start;
}

function isPhaseInRange(p: OrganizationProjectPlanning, phase: ProjectPhase, start: Date, end: Date): boolean {
	const ph = p.phases.find((x) => x.phase === phase);
	if (!ph?.start_date || !ph?.end_date) return false;
	return new Date(ph.start_date) <= end && new Date(ph.end_date) >= start;
}

export function buildCapacity(
	projects: OrganizationProjectPlanning[],
	activities: PhaseActivity[],
	year: number,
	teamSize: number
): CapacityMonth[] {
	const result: CapacityMonth[] = [];
	for (let m = 0; m < 12; m++) {
		const mStart = new Date(year, m, 1);
		const mEnd = new Date(year, m + 1, 0);
		const label = mStart.toLocaleDateString('nl-NL', { month: 'short' });
		const key = `${year}-${String(m + 1).padStart(2, '0')}`;

		const active = projects.filter((p) => isActiveInRange(p, mStart, mEnd)).length;
		const spec = projects.filter((p) => isPhaseInRange(p, 'specifying', mStart, mEnd)).length;
		const hours = activities
			.filter((a) => a.planned_start && a.planned_end
				&& new Date(a.planned_start) <= mEnd && new Date(a.planned_end) >= mStart)
			.reduce((sum, a) => sum + (a.estimated_hours ?? 0), 0);

		result.push({
			month: key, label, active_projects: active, projects_in_specification: spec,
			total_estimated_hours: Math.round(hours),
			available_hours: teamSize * WORKDAYS_PER_MONTH * HOURS_PER_DAY
		});
	}
	return result;
}

export function buildWarnings(cap: CapacityMonth[], projects: OrganizationProjectPlanning[]): string[] {
	const warnings: string[] = [];
	for (const m of cap) {
		const label = m.label.charAt(0).toUpperCase() + m.label.slice(1);
		if (m.projects_in_specification >= 3) {
			warnings.push(`${label}: ${m.projects_in_specification} projecten in specificatiefase`);
		}
		if (m.available_hours > 0 && m.total_estimated_hours > m.available_hours * 0.9) {
			const pct = Math.round((m.total_estimated_hours / m.available_hours) * 100);
			warnings.push(`${label}: capaciteit bijna vol (${pct}%)`);
		}
	}
	const offTrack = projects.filter((p) => !p.is_on_track).length;
	if (offTrack > 0) warnings.push(`${offTrack} project(en) lopen achter op schema`);
	return warnings;
}

export function buildDeadlineItems(
	milestones: Milestone[],
	activities: PhaseActivity[],
	projects: { id: string; name: string }[],
	today: Date
): DeadlineItem[] {
	const todayMs = today.getTime();
	const thirtyDaysMs = 30 * DAYS_MS;
	const nameMap = new Map(projects.map((p) => [p.id, p.name]));

	const msItems: DeadlineItem[] = milestones
		.filter((m) => m.status !== 'completed' && Math.abs(new Date(m.target_date).getTime() - todayMs) <= thirtyDaysMs)
		.map((m) => mapMilestoneToDeadline(m, todayMs, nameMap));

	const actItems: DeadlineItem[] = activities
		.filter((a) => a.due_date && a.status !== 'completed' && a.status !== 'skipped'
			&& Math.abs(new Date(a.due_date).getTime() - todayMs) <= thirtyDaysMs)
		.map((a) => mapActivityToDeadline(a, todayMs, nameMap));

	return [...msItems, ...actItems].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function mapMilestoneToDeadline(m: Milestone, todayMs: number, nameMap: Map<string, string>): DeadlineItem {
	const days = Math.ceil((new Date(m.target_date).getTime() - todayMs) / DAYS_MS);
	return {
		id: m.id, type: 'milestone', title: m.title, date: m.target_date,
		project_id: m.project_id, project_name: nameMap.get(m.project_id) ?? '',
		phase: m.phase ?? ('preparing' as const), status: m.status, is_critical: m.is_critical,
		assigned_to: null, assigned_to_name: null, days_remaining: days, is_overdue: days < 0
	};
}

function mapActivityToDeadline(a: PhaseActivity, todayMs: number, nameMap: Map<string, string>): DeadlineItem {
	const days = Math.ceil((new Date(a.due_date!).getTime() - todayMs) / DAYS_MS);
	return {
		id: a.id, type: 'activity', title: a.title, date: a.due_date!,
		project_id: a.project_id, project_name: nameMap.get(a.project_id) ?? '',
		phase: a.phase, status: a.status, is_critical: false,
		assigned_to: a.assigned_to ?? null, assigned_to_name: null,
		days_remaining: days, is_overdue: days < 0
	};
}
