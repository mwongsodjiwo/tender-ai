// POST /api/projects/:id/uea/initialize — Initialize UEA selections for a project
// Creates selection records for all questions (mandatory=selected, optional=based on param)

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeUeaSelectionsSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const parsed = initializeUeaSelectionsSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { select_all_optional } = parsed.data;

	// Verify project exists
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	// Load all active questions
	const { data: questions, error: qError } = await supabase
		.from('uea_questions')
		.select('id, is_mandatory')
		.eq('is_active', true);

	if (qError || !questions) {
		return json({ message: 'Kon UEA-vragen niet laden', code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	// Build selection records
	const selections = questions.map((q: { id: string; is_mandatory: boolean }) => ({
		project_id: params.id,
		question_id: q.id,
		is_selected: q.is_mandatory || select_all_optional
	}));

	// Upsert all selections
	const { error: upsertError } = await supabase
		.from('uea_project_selections')
		.upsert(selections, { onConflict: 'project_id,question_id' });

	if (upsertError) {
		return json({ message: upsertError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'uea_selections',
		changes: {
			total_questions: questions.length,
			select_all_optional
		}
	});

	return json({
		data: {
			initialized: true,
			total: questions.length,
			selected: selections.filter((s: { is_selected: boolean }) => s.is_selected).length
		}
	}, { status: 201 });
};
