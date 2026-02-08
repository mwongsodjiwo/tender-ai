// POST /api/projects/:id/uea/toggle — Toggle a UEA question selection for a project

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { toggleUeaQuestionSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const parsed = toggleUeaQuestionSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { question_id, is_selected } = parsed.data;

	// Verify project exists
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	// Verify question exists and is not mandatory
	const { data: question, error: qError } = await supabase
		.from('uea_questions')
		.select('id, question_number, title, is_mandatory')
		.eq('id', question_id)
		.eq('is_active', true)
		.single();

	if (qError || !question) {
		return json({ message: 'UEA-vraag niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	if (question.is_mandatory && !is_selected) {
		return json(
			{ message: 'Verplichte vragen kunnen niet worden uitgeschakeld', code: 'MANDATORY_QUESTION', status: 400 },
			{ status: 400 }
		);
	}

	// Upsert the selection
	const { data: selection, error: upsertError } = await supabase
		.from('uea_project_selections')
		.upsert(
			{
				project_id: params.id,
				question_id,
				is_selected
			},
			{ onConflict: 'project_id,question_id' }
		)
		.select()
		.single();

	if (upsertError) {
		return json({ message: upsertError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'uea_selection',
		entityId: selection.id,
		changes: {
			question_id,
			question_number: question.question_number,
			is_selected
		}
	});

	return json({ data: selection });
};
