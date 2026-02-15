// GET /api/projects/:id/requirements/:requirementId — Get single requirement
// PATCH /api/projects/:id/requirements/:requirementId — Update requirement
// DELETE /api/projects/:id/requirements/:requirementId — Soft-delete requirement

import type { RequestHandler } from './$types';
import { updateRequirementSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('requirements')
		.select('*')
		.eq('id', params.requirementId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError) {
		return apiError(404, 'NOT_FOUND', 'Eis niet gevonden');
	}

	return apiSuccess(data);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateRequirementSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const updates = parsed.data;

	const { data: requirement, error: dbError } = await supabase
		.from('requirements')
		.update(updates)
		.eq('id', params.requirementId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.select()
		.single();

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
		action: 'update',
		entityType: 'requirement',
		entityId: params.requirementId,
		changes: updates
	});

	return apiSuccess(requirement);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Soft delete
	const { error: dbError } = await supabase
		.from('requirements')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.requirementId)
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
		entityType: 'requirement',
		entityId: params.requirementId
	});

	return apiSuccess({ message: 'Eis verwijderd' });
};
