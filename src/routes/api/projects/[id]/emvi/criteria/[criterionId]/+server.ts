// GET /api/projects/:id/emvi/criteria/:criterionId — Get single criterion
// PATCH /api/projects/:id/emvi/criteria/:criterionId — Update criterion
// DELETE /api/projects/:id/emvi/criteria/:criterionId — Soft-delete criterion

import type { RequestHandler } from './$types';
import { updateEmviCriterionSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: criterion, error: dbError } = await supabase
		.from('emvi_criteria')
		.select('*')
		.eq('id', params.criterionId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !criterion) {
		return apiError(404, 'NOT_FOUND', 'Criterium niet gevonden');
	}

	return apiSuccess(criterion);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateEmviCriterionSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const updates = parsed.data;

	const { data: criterion, error: dbError } = await supabase
		.from('emvi_criteria')
		.update(updates)
		.eq('id', params.criterionId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.select()
		.single();

	if (dbError || !criterion) {
		return apiError(404, 'NOT_FOUND', 'Criterium niet gevonden');
	}

	const { data: project } = await supabase
		.from('projects')
		.select('organization_id')
		.eq('id', params.id)
		.single();

	await logAudit(supabase, {
		organizationId: project?.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'emvi_criterion',
		entityId: params.criterionId,
		changes: updates
	});

	return apiSuccess(criterion);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Soft delete
	const { error: dbError } = await supabase
		.from('emvi_criteria')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.criterionId)
		.eq('project_id', params.id)
		.is('deleted_at', null);

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	const { data: project } = await supabase
		.from('projects')
		.select('organization_id')
		.eq('id', params.id)
		.single();

	await logAudit(supabase, {
		organizationId: project?.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'delete',
		entityType: 'emvi_criterion',
		entityId: params.criterionId,
		changes: {}
	});

	return apiSuccess({ deleted: true });
};
