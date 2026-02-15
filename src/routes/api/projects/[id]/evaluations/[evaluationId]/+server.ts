// GET /api/projects/:id/evaluations/:evaluationId — Get single evaluation
// PATCH /api/projects/:id/evaluations/:evaluationId — Update evaluation
// DELETE /api/projects/:id/evaluations/:evaluationId — Soft delete evaluation

import type { RequestHandler } from './$types';
import { updateEvaluationSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: evaluation, error: dbError } = await supabase
		.from('evaluations')
		.select('*')
		.eq('id', params.evaluationId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !evaluation) {
		return apiError(404, 'NOT_FOUND', 'Beoordeling niet gevonden');
	}

	return apiSuccess(evaluation);
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
	const parsed = updateEvaluationSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const updateData: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(parsed.data)) {
		if (value !== undefined) {
			updateData[key] = value;
		}
	}

	const { data: evaluation, error: dbError } = await supabase
		.from('evaluations')
		.update(updateData)
		.eq('id', params.evaluationId)
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
		entityType: 'evaluation',
		entityId: params.evaluationId,
		changes: updateData
	});

	return apiSuccess(evaluation);
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
		.from('evaluations')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.evaluationId)
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
		entityType: 'evaluation',
		entityId: params.evaluationId
	});

	return apiSuccess({ message: 'Beoordeling verwijderd' });
};
