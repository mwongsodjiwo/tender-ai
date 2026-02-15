// POST /api/projects/:id/evaluations/batch-score — Batch update scores for multiple evaluations

import type { RequestHandler } from './$types';
import { batchScoreSchema } from '$server/api/validation';
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
	const parsed = batchScoreSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	// Load all evaluations for this project
	const { data: evaluations, error: evalError } = await supabase
		.from('evaluations')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null);

	if (evalError) {
		return apiError(500, 'DB_ERROR', evalError.message);
	}

	const evalMap = new Map((evaluations ?? []).map((e) => [e.id, e]));

	// Validate all evaluation_ids belong to this project
	for (const scoreItem of parsed.data.scores) {
		if (!evalMap.has(scoreItem.evaluation_id)) {
			return apiError(400, 'VALIDATION_ERROR', `Beoordeling ${scoreItem.evaluation_id} niet gevonden in dit project`);
		}
	}

	// Group scores by evaluation_id
	const scoresByEval = new Map<string, Record<string, { score: number }>>();
	for (const scoreItem of parsed.data.scores) {
		if (!scoresByEval.has(scoreItem.evaluation_id)) {
			const existing = evalMap.get(scoreItem.evaluation_id);
			const existingScores = (existing?.scores ?? {}) as Record<string, { score: number; notes?: string }>;
			scoresByEval.set(scoreItem.evaluation_id, { ...existingScores });
		}
		const scores = scoresByEval.get(scoreItem.evaluation_id)!;
		scores[scoreItem.criterion_id] = {
			...((scores[scoreItem.criterion_id] as Record<string, unknown>) ?? {}),
			score: scoreItem.score
		};
	}

	// Update each evaluation with merged scores
	const updated: unknown[] = [];
	for (const [evalId, mergedScores] of scoresByEval.entries()) {
		const { data: evaluation, error: dbError } = await supabase
			.from('evaluations')
			.update({ scores: mergedScores })
			.eq('id', evalId)
			.eq('project_id', params.id)
			.select()
			.single();

		if (dbError) {
			return apiError(500, 'DB_ERROR', dbError.message);
		}

		updated.push(evaluation);
	}

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'evaluation',
		changes: { batch_scores: parsed.data.scores.length, evaluations_updated: updated.length }
	});

	return apiSuccess(updated);
};
