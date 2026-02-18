// POST /api/projects/:projectId/questions/:questionId/approve — Approve question

import type { RequestHandler } from './$types';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Verify question exists and has answer
	const { data: existing, error: fetchError } = await supabase
		.from('incoming_questions')
		.select('id, status, answer_text')
		.eq('id', params.questionId)
		.eq('project_id', params.id)
		.single();

	if (fetchError || !existing) {
		return apiError(404, 'NOT_FOUND', 'Vraag niet gevonden');
	}

	if (!existing.answer_text) {
		return apiError(400, 'VALIDATION_ERROR', 'Vraag moet eerst beantwoord zijn');
	}

	const { data, error: dbError } = await supabase
		.from('incoming_questions')
		.update({
			status: 'approved',
			approved_by: user.id
		})
		.eq('id', params.questionId)
		.eq('project_id', params.id)
		.select()
		.single();

	if (dbError || !data) {
		return apiError(500, 'DB_ERROR', 'Goedkeuring mislukt');
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
		action: 'approve',
		entityType: 'incoming_question',
		entityId: data.id,
		changes: { status: 'approved', approved_by: user.id }
	});

	return apiSuccess(data);
};
