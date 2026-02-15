// GET /api/projects/:id/milestones — List milestones (filter ?phase=)
// POST /api/projects/:id/milestones — Create milestone

import type { RequestHandler } from './$types';
import { createMilestoneSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	let query = supabase
		.from('milestones')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('target_date')
		.order('sort_order');

	const phase = url.searchParams.get('phase');
	if (phase) {
		query = query.eq('phase', phase);
	}

	const milestoneType = url.searchParams.get('milestone_type');
	if (milestoneType) {
		query = query.eq('milestone_type', milestoneType);
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data ?? []);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	const body = await request.json();
	const parsed = createMilestoneSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { data: milestone, error: dbError } = await supabase
		.from('milestones')
		.insert({ project_id: params.id, created_by: user.id, ...parsed.data })
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'milestone',
		entityId: milestone.id,
		changes: parsed.data
	});

	return apiSuccess(milestone, 201);
};
