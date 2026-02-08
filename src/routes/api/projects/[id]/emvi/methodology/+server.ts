// PUT /api/projects/:id/emvi/methodology — Update scoring methodology

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateScoringMethodologySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = updateScoringMethodologySchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { scoring_methodology } = parsed.data;

	const { data: project, error: dbError } = await supabase
		.from('projects')
		.update({ scoring_methodology })
		.eq('id', params.id)
		.select('id, scoring_methodology, organization_id')
		.single();

	if (dbError) {
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: { scoring_methodology: project.scoring_methodology } });
};
