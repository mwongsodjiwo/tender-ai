// GET /api/projects/:id/milestones/:milestoneId — Get single milestone
// PATCH /api/projects/:id/milestones/:milestoneId — Update milestone
// DELETE /api/projects/:id/milestones/:milestoneId — Soft delete milestone

import type { RequestHandler } from './$types';
import { updateMilestoneSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: milestone, error: dbError } = await supabase
		.from('milestones')
		.select('*')
		.eq('id', params.milestoneId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !milestone) {
		return apiError(404, 'NOT_FOUND', 'Milestone niet gevonden');
	}

	return apiSuccess(milestone);
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
	const parsed = updateMilestoneSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const updateData: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(parsed.data)) {
		if (value !== undefined) {
			updateData[key] = value;
		}
	}

	const { data: milestone, error: dbError } = await supabase
		.from('milestones')
		.update(updateData)
		.eq('id', params.milestoneId)
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
		entityType: 'milestone',
		entityId: params.milestoneId,
		changes: updateData
	});

	return apiSuccess(milestone);
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
		.from('milestones')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.milestoneId)
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
		entityType: 'milestone',
		entityId: params.milestoneId,
		changes: {}
	});

	return apiSuccess({ success: true });
};
