// POST /api/projects/:id/market-research/deskresearch — Search knowledge base based on project profile

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deskresearchSchema } from '$server/api/validation';
import { deskresearch } from '$server/ai/market-research';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ params, request, locals }) => {
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
	const parsed = deskresearchSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	// Load project profile for CPV codes and scope
	const { data: profile } = await supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.maybeSingle();

	if (!profile) {
		return json(
			{ message: 'Projectprofiel niet gevonden. Vul eerst het projectprofiel in.', code: 'PROFILE_REQUIRED', status: 400 },
			{ status: 400 }
		);
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

		return json({ data: result });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Deskresearch mislukt';
		return json({ message, code: 'AI_ERROR', status: 500 }, { status: 500 });
	}
};
