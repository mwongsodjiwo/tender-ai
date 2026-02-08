// GET /api/projects/:id/emvi/criteria/:criterionId — Get single criterion
// PATCH /api/projects/:id/emvi/criteria/:criterionId — Update criterion
// DELETE /api/projects/:id/emvi/criteria/:criterionId — Soft-delete criterion

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateEmviCriterionSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: criterion, error: dbError } = await supabase
		.from('emvi_criteria')
		.select('*')
		.eq('id', params.criterionId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !criterion) {
		return json({ message: 'Criterium niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	return json({ data: criterion });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = updateEmviCriterionSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json({ message: 'Criterium niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
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

	return json({ data: criterion });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	// Soft delete
	const { error: dbError } = await supabase
		.from('emvi_criteria')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.criterionId)
		.eq('project_id', params.id)
		.is('deleted_at', null);

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: { deleted: true } });
};
