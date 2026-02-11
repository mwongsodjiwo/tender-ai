// GET /api/projects/:id/planning — Combined timeline data (milestones + activities + dependencies)
// Enhanced for Sprint 3 Gantt chart with phase grouping, progress, and on-track status

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PhaseActivity, Milestone } from '$types';
import { PROJECT_PHASES, PROJECT_PHASE_LABELS } from '$types';
import type { ProjectPhase } from '$types';

const DAYS_MS = 1000 * 60 * 60 * 24;

function calculatePhaseProgress(activities: PhaseActivity[]): number {
	if (activities.length === 0) return 0;
	const totalWeight = activities.reduce((sum, a) => sum + (a.estimated_hours ?? 1), 0);
	const completedWeight = activities.reduce((sum, a) => {
		const weight = a.estimated_hours ?? 1;
		return sum + (weight * a.progress_percentage / 100);
	}, 0);
	return Math.round(completedWeight / totalWeight * 100);
}

function getEarliestDate(activities: PhaseActivity[], milestones: Milestone[]): string | null {
	const dates: number[] = [];
	for (const a of activities) {
		if (a.planned_start) dates.push(new Date(a.planned_start).getTime());
	}
	for (const m of milestones) {
		dates.push(new Date(m.target_date).getTime());
	}
	return dates.length > 0 ? new Date(Math.min(...dates)).toISOString().split('T')[0] : null;
}

function getLatestDate(activities: PhaseActivity[], milestones: Milestone[]): string | null {
	const dates: number[] = [];
	for (const a of activities) {
		if (a.planned_end) dates.push(new Date(a.planned_end).getTime());
		if (a.due_date) dates.push(new Date(a.due_date).getTime());
	}
	for (const m of milestones) {
		dates.push(new Date(m.target_date).getTime());
	}
	return dates.length > 0 ? new Date(Math.max(...dates)).toISOString().split('T')[0] : null;
}

function checkOnTrack(activities: PhaseActivity[], milestones: Milestone[]): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const overdueCritical = milestones.some((m) =>
		m.is_critical && m.status !== 'completed' && new Date(m.target_date) < today
	);
	if (overdueCritical) return false;

	return activities
		.filter((a) => a.planned_start && new Date(a.planned_start) <= today && a.status !== 'completed')
		.every((a) => {
			if (!a.planned_start || !a.planned_end) return true;
			const start = new Date(a.planned_start).getTime();
			const end = new Date(a.planned_end).getTime();
			const now = today.getTime();
			const expected = now >= end ? 100 : now <= start ? 0 : Math.round(((now - start) / (end - start)) * 100);
			return a.progress_percentage >= expected * 0.8;
		});
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, name, organization_id, current_phase, procedure_type')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const { data: profile } = await supabase
		.from('project_profiles')
		.select('timeline_start, timeline_end')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	const [milestonesResult, activitiesResult, dependenciesResult] = await Promise.all([
		supabase
			.from('milestones')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.order('target_date'),
		supabase
			.from('phase_activities')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.order('phase')
			.order('sort_order'),
		supabase
			.from('activity_dependencies')
			.select('*')
			.eq('project_id', params.id)
	]);

	if (milestonesResult.error || activitiesResult.error || dependenciesResult.error) {
		const errorMsg = milestonesResult.error?.message
			?? activitiesResult.error?.message
			?? dependenciesResult.error?.message
			?? 'Database fout';
		return json({ message: errorMsg, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	const milestones: Milestone[] = (milestonesResult.data ?? []) as Milestone[];
	const activities: PhaseActivity[] = (activitiesResult.data ?? []) as PhaseActivity[];
	const dependencies = dependenciesResult.data ?? [];

	const completedActivities = activities.filter((a) => a.status === 'completed').length;
	const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
	const totalItems = activities.length + milestones.length;
	const completedItems = completedActivities + completedMilestones;

	// Build phase-grouped data for Gantt chart
	const phases = PROJECT_PHASES.map((phase: ProjectPhase) => {
		const phaseActivities = activities.filter((a) => a.phase === phase);
		const phaseMilestones = milestones.filter((m) => m.phase === phase);

		return {
			phase,
			label: PROJECT_PHASE_LABELS[phase],
			start_date: getEarliestDate(phaseActivities, phaseMilestones),
			end_date: getLatestDate(phaseActivities, phaseMilestones),
			progress: calculatePhaseProgress(phaseActivities),
			activities: phaseActivities,
			milestones: phaseMilestones
		};
	}).filter((p) => p.activities.length > 0 || p.milestones.length > 0);

	// Calculate overall timeline bounds
	const allStartDate = getEarliestDate(activities, milestones);
	const allEndDate = getLatestDate(activities, milestones);

	// Calculate days remaining
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const projectEnd = allEndDate ? new Date(allEndDate) : null;
	const daysRemaining = projectEnd
		? Math.ceil((projectEnd.getTime() - today.getTime()) / DAYS_MS)
		: 0;

	return json({
		data: {
			project: {
				id: project.id,
				name: project.name,
				current_phase: project.current_phase,
				procedure_type: project.procedure_type,
				timeline_start: profile?.timeline_start ?? allStartDate,
				timeline_end: profile?.timeline_end ?? allEndDate
			},
			phases,
			milestones,
			activities,
			dependencies,
			summary: {
				total_activities: activities.length,
				completed_activities: completedActivities,
				total_milestones: milestones.length,
				completed_milestones: completedMilestones,
				overall_progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
				days_remaining: daysRemaining,
				is_on_track: checkOnTrack(activities, milestones)
			}
		}
	});
};
