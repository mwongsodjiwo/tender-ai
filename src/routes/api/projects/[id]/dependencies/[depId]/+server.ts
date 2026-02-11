// DELETE /api/projects/:id/dependencies/:depId — Remove dependency

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logAudit } from '$server/db/audit';

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
		.from('activity_dependencies')
		.delete()
		.eq('id', params.depId)
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
		entityType: 'activity_dependency',
		entityId: params.depId,
		changes: {}
	});

	return json({ data: { success: true } });
};
