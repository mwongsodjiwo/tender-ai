// GET /api/projects/:id/activities/:activityId — Get single activity
// PATCH /api/projects/:id/activities/:activityId — Update activity
// DELETE /api/projects/:id/activities/:activityId — Soft-delete activity

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updatePhaseActivitySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: activity, error: dbError } = await supabase
		.from('phase_activities')
		.select('*')
		.eq('id', params.activityId)
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !activity) {
		return json({ message: 'Activiteit niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	return json({ data: activity });
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
	const parsed = updatePhaseActivitySchema.safeParse(body);

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

	// Set completed_at when status changes to completed, clear when changing away
	if (updateData.status === 'completed') {
		updateData.completed_at = new Date().toISOString();
	} else if (updateData.status && updateData.status !== 'completed') {
		updateData.completed_at = null;
	}

	const { data: activity, error: dbError } = await supabase
		.from('phase_activities')
		.update(updateData)
		.eq('id', params.activityId)
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
		entityType: 'phase_activity',
		entityId: params.activityId,
		changes: updateData
	});

	return json({ data: activity });
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
		.from('phase_activities')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.activityId)
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
		entityType: 'phase_activity',
		entityId: params.activityId,
		changes: {}
	});

	return json({ success: true });
};
