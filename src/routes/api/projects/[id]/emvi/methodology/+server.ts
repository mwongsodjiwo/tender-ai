// PUT /api/projects/:id/emvi/methodology — Update scoring methodology

import type { RequestHandler } from './$types';
import { updateScoringMethodologySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateScoringMethodologySchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { scoring_methodology } = parsed.data;

	const { data: project, error: dbError } = await supabase
		.from('projects')
		.update({ scoring_methodology })
		.eq('id', params.id)
		.select('id, scoring_methodology, organization_id')
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: project?.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'project',
		entityId: params.id,
		changes: { scoring_methodology }
	});

	return apiSuccess({ scoring_methodology: project.scoring_methodology });
};
