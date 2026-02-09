// POST /api/projects/:id/market-research/rfi/generate — Generate RFI questionnaire with AI

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateRfiSchema } from '$server/api/validation';
import { generateRfi } from '$server/ai/market-research';
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
	const parsed = generateRfiSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	// Load project profile
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

		return json({ data: result });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'RFI-generatie mislukt';
		return json({ message, code: 'AI_ERROR', status: 500 }, { status: 500 });
	}
};
