// GET /api/projects/:id/activities/:activityId — Get single activity
// PATCH /api/projects/:id/activities/:activityId — Update activity
// DELETE /api/projects/:id/activities/:activityId — Soft-delete activity

import type { RequestHandler } from './$types';
import { updatePhaseActivitySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: activity, error: dbError } = await supabase
		.from('phase_activities')
		.select('*')
		.eq('id', params.activityId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !activity) {
		return apiError(404, 'NOT_FOUND', 'Activiteit niet gevonden');
	}

	return apiSuccess(activity);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
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
	const parsed = updatePhaseActivitySchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const updateData: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(parsed.data)) {
		if (value !== undefined) {
			updateData[key] = value;
		}
	}

	// Set completed_at when status changes to completed, clear when changing away
	if (updateData.status === 'completed') {
		updateData.completed_at = new Date().toISOString();
	} else if (updateData.status && updateData.status !== 'completed') {
		updateData.completed_at = null;
	}

	const { data: activity, error: dbError } = await supabase
		.from('phase_activities')
		.update(updateData)
		.eq('id', params.activityId)
		.eq('project_id', params.id)
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
		action: 'update',
		entityType: 'phase_activity',
		entityId: params.activityId,
		changes: updateData
	});

	return apiSuccess(activity);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
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

	const { error: dbError } = await supabase
		.from('phase_activities')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.activityId)
		.eq('project_id', params.id);

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'delete',
		entityType: 'phase_activity',
		entityId: params.activityId,
		changes: {}
	});

	return apiSuccess({ success: true });
};
