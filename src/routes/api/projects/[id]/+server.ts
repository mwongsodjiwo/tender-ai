// GET /api/projects/:id — Get project details
// PATCH /api/projects/:id — Update project
// DELETE /api/projects/:id — Soft delete project

import type { RequestHandler } from './$types';
import { updateProjectSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('projects')
		.select('*')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	return apiSuccess(data);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateProjectSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const updateData: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(parsed.data)) {
		if (value !== undefined) {
			updateData[key] = value;
		}
	}

	const { data, error: dbError } = await supabase
		.from('projects')
		.update(updateData)
		.eq('id', params.id)
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: data.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'project',
		entityId: params.id,
		changes: updateData
	});

	return apiSuccess(data);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('projects')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.id)
		.select('organization_id')
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: data.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'delete',
		entityType: 'project',
		entityId: params.id
	});

	return apiSuccess({ message: 'Project verwijderd' });
};
