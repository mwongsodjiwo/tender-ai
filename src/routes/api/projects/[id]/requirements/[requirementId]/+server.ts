// GET /api/projects/:id/requirements/:requirementId — Get single requirement
// PATCH /api/projects/:id/requirements/:requirementId — Update requirement
// DELETE /api/projects/:id/requirements/:requirementId — Soft-delete requirement

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateRequirementSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data, error: dbError } = await supabase
		.from('requirements')
		.select('*')
		.eq('id', params.requirementId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError) {
		return json({ message: 'Eis niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	return json({ data });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = updateRequirementSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		action: 'update',
		entityType: 'requirement',
		entityId: params.requirementId,
		changes: updates
	});

	return json({ data: requirement });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	// Soft delete
	const { error: dbError } = await supabase
		.from('requirements')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.requirementId)
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
		entityType: 'requirement',
		entityId: params.requirementId
	});

	return json({ message: 'Eis verwijderd' });
};
