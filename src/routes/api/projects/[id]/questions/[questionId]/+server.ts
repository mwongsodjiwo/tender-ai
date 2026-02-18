// GET /api/projects/:projectId/questions/:questionId — Get question
// PATCH /api/projects/:projectId/questions/:questionId — Update/answer

import type { RequestHandler } from './$types';
import { updateQuestionSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('incoming_questions')
		.select('*')
		.eq('id', params.questionId)
		.eq('project_id', params.id)
		.single();

	if (dbError || !data) {
		return apiError(404, 'NOT_FOUND', 'Vraag niet gevonden');
	}

	return apiSuccess(data);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateQuestionSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const updateData: Record<string, unknown> = { ...parsed.data };

	// Set answered_at when answer_text is provided
	if (parsed.data.answer_text) {
		updateData.answered_at = new Date().toISOString();
	}

	const { data, error: dbError } = await supabase
		.from('incoming_questions')
		.update(updateData)
		.eq('id', params.questionId)
		.eq('project_id', params.id)
		.select()
		.single();

	if (dbError || !data) {
		return apiError(404, 'NOT_FOUND', 'Vraag niet gevonden');
	}

	const { data: project } = await supabase
		.from('projects')
		.select('organization_id')
		.eq('id', params.id)
		.single();

	await logAudit(supabase, {
		organizationId: project?.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'incoming_question',
		entityId: data.id,
		changes: parsed.data
	});

	return apiSuccess(data);
};
