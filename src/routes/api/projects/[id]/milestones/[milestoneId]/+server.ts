// GET /api/projects/:id/milestones/:milestoneId — Get single milestone
// PATCH /api/projects/:id/milestones/:milestoneId — Update milestone
// DELETE /api/projects/:id/milestones/:milestoneId — Soft delete milestone

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateMilestoneSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: milestone, error: dbError } = await supabase
		.from('milestones')
		.select('*')
		.eq('id', params.milestoneId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !milestone) {
		return json({ message: 'Milestone niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	return json({ data: milestone });
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
	const parsed = updateMilestoneSchema.safeParse(body);

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

	const { data: milestone, error: dbError } = await supabase
		.from('milestones')
		.update(updateData)
		.eq('id', params.milestoneId)
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
		entityType: 'milestone',
		entityId: params.milestoneId,
		changes: updateData
	});

	return json({ data: milestone });
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
		.from('milestones')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.milestoneId)
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
		entityType: 'milestone',
		entityId: params.milestoneId,
		changes: {}
	});

	return json({ data: { success: true } });
};
