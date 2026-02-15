// POST /api/projects/:id/market-research/rfi/generate — Generate RFI questionnaire with AI

import type { RequestHandler } from './$types';
import { generateRfiSchema } from '$server/api/validation';
import { generateRfi } from '$server/ai/market-research';
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
	const parsed = generateRfiSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	// Load project profile
	const { data: profile } = await supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.maybeSingle();

	if (!profile) {
		return apiError(400, 'VALIDATION_ERROR', 'Projectprofiel niet gevonden. Vul eerst het projectprofiel in.');
	}

	try {
		const result = await generateRfi(profile, parsed.data.additional_context);

		await logAudit(supabase, {
			organizationId: project.organization_id,
			projectId: params.id,
			actorId: user.id,
			actorEmail: user.email ?? undefined,
			action: 'generate',
			entityType: 'market_research_rfi',
			changes: { questions_count: result.questions.length }
		});

		return apiSuccess(result);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'RFI-generatie mislukt';
		return apiError(500, 'INTERNAL_ERROR', message);
	}
};
