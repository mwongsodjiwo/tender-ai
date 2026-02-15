// POST /api/projects/:id/market-research/deskresearch — Search knowledge base based on project profile

import type { RequestHandler } from './$types';
import { deskresearchSchema } from '$server/api/validation';
import { deskresearch } from '$server/ai/market-research';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request, locals }) => {
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
	const parsed = deskresearchSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	// Load project profile for CPV codes and scope
	const { data: profile } = await supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.maybeSingle();

	if (!profile) {
		return apiError(400, 'VALIDATION_ERROR', 'Projectprofiel niet gevonden. Vul eerst het projectprofiel in.');
	}

	// Override CPV codes if provided in request
	if (parsed.data.cpv_codes && parsed.data.cpv_codes.length > 0) {
		profile.cpv_codes = parsed.data.cpv_codes;
	}

	try {
		const result = await deskresearch(supabase, profile);

		await logAudit(supabase, {
			organizationId: project.organization_id,
			projectId: params.id,
			actorId: user.id,
			actorEmail: user.email ?? undefined,
			action: 'generate',
			entityType: 'market_research_deskresearch',
			changes: { results_count: result.total }
		});

		return apiSuccess(result);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Deskresearch mislukt';
		return apiError(500, 'INTERNAL_ERROR', message);
	}
};
