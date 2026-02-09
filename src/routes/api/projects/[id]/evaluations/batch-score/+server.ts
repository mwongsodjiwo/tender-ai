// POST /api/projects/:id/evaluations/batch-score — Batch update scores for multiple evaluations

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { batchScoreSchema } from '$server/api/validation';
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
	const parsed = batchScoreSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	// Load all evaluations for this project
	const { data: evaluations, error: evalError } = await supabase
		.from('evaluations')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null);

	if (evalError) {
		return json({ message: evalError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	const evalMap = new Map((evaluations ?? []).map((e) => [e.id, e]));

	// Validate all evaluation_ids belong to this project
	for (const scoreItem of parsed.data.scores) {
		if (!evalMap.has(scoreItem.evaluation_id)) {
			return json(
				{ message: `Beoordeling ${scoreItem.evaluation_id} niet gevonden in dit project`, code: 'VALIDATION_ERROR', status: 400 },
				{ status: 400 }
			);
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
			return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: updated });
};
