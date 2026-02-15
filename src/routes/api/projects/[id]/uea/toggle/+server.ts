// POST /api/projects/:id/uea/toggle — Toggle a UEA question selection for a project

import type { RequestHandler } from './$types';
import { toggleUeaQuestionSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json().catch(() => ({}));
	const parsed = toggleUeaQuestionSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { question_id, is_selected } = parsed.data;

	// Verify project exists
	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', params.id)
		.single();

	if (projError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	// Verify question exists and is not mandatory
	const { data: question, error: qError } = await supabase
		.from('uea_questions')
		.select('id, question_number, title, is_mandatory')
		.eq('id', question_id)
		.eq('is_active', true)
		.single();

	if (qError || !question) {
		return apiError(404, 'NOT_FOUND', 'UEA-vraag niet gevonden');
	}

	if (question.is_mandatory && !is_selected) {
		return apiError(400, 'VALIDATION_ERROR', 'Verplichte vragen kunnen niet worden uitgeschakeld');
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
		return apiError(500, 'DB_ERROR', upsertError.message);
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

	return apiSuccess(selection);
};
