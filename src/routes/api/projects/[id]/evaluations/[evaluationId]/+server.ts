// GET /api/projects/:id/evaluations/:evaluationId — Get single evaluation
// PATCH /api/projects/:id/evaluations/:evaluationId — Update evaluation
// DELETE /api/projects/:id/evaluations/:evaluationId — Soft delete evaluation

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateEvaluationSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: evaluation, error: dbError } = await supabase
		.from('evaluations')
		.select('*')
		.eq('id', params.evaluationId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !evaluation) {
		return json({ message: 'Beoordeling niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	return json({ data: evaluation });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const body = await request.json();
	const parsed = updateEvaluationSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: evaluation });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const { error: dbError } = await supabase
		.from('evaluations')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.evaluationId)
		.eq('project_id', params.id);

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: { message: 'Beoordeling verwijderd' } });
};
