// GET /api/projects/:id/correspondence/:letterId — Get single letter
// PATCH /api/projects/:id/correspondence/:letterId — Update letter
// DELETE /api/projects/:id/correspondence/:letterId — Soft delete letter

import type { RequestHandler } from './$types';
import { updateCorrespondenceSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: letter, error: dbError } = await supabase
		.from('correspondence')
		.select('*')
		.eq('id', params.letterId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !letter) {
		return apiError(404, 'NOT_FOUND', 'Brief niet gevonden');
	}

	return apiSuccess(letter);
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
	const parsed = updateCorrespondenceSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const updateData: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(parsed.data)) {
		if (value !== undefined) {
			updateData[key] = value;
		}
	}

	const { data: letter, error: dbError } = await supabase
		.from('correspondence')
		.update(updateData)
		.eq('id', params.letterId)
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
		entityType: 'correspondence',
		entityId: params.letterId,
		changes: updateData
	});

	return apiSuccess(letter);
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
		.from('correspondence')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.letterId)
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
		entityType: 'correspondence',
		entityId: params.letterId
	});

	return apiSuccess({ message: 'Brief verwijderd' });
};
