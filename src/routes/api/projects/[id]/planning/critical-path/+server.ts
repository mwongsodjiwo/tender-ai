// GET /api/projects/:id/planning/critical-path — Calculate critical path

import type { RequestHandler } from './$types';
import type { PhaseActivity, Milestone, ActivityDependency } from '$types';
import { calculateCriticalPath } from '$server/planning/critical-path';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	const [activitiesResult, milestonesResult, depsResult] = await Promise.all([
		supabase
			.from('phase_activities')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null),
		supabase
			.from('milestones')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null),
		supabase
			.from('activity_dependencies')
			.select('*')
			.eq('project_id', params.id)
	]);

	const activities = (activitiesResult.data ?? []) as PhaseActivity[];
	const milestones = (milestonesResult.data ?? []) as Milestone[];
	const dependencies = (depsResult.data ?? []) as ActivityDependency[];

	try {
		const result = calculateCriticalPath(activities, milestones, dependencies);

		const nodes = Array.from(result.nodes.values()).map((node) => ({
			id: node.id,
			type: node.type,
			title: node.title,
			duration: node.duration,
			earliest_start: node.earliest_start,
			earliest_finish: node.earliest_finish,
			latest_start: node.latest_start,
			latest_finish: node.latest_finish,
			total_float: node.total_float,
			is_critical: node.is_critical
		}));

		return apiSuccess({
			nodes,
			critical_path_ids: result.critical_path.map((n) => n.id),
			project_duration: result.project_duration
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Onbekende fout bij berekening kritiek pad';
		return apiError(422, 'INTERNAL_ERROR', message);
	}
};
