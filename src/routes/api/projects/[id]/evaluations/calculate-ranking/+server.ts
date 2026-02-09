// POST /api/projects/:id/evaluations/calculate-ranking — Calculate total scores and rankings

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { calculateRankingSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const { data: project, error: projError } = await supabase
		.from('projects')
		.select('id, organization_id, scoring_methodology')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (projError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	const body = await request.json().catch(() => ({}));
	const parsed = calculateRankingSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	// Load evaluations (optionally filtered)
	let evalQuery = supabase
		.from('evaluations')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null);

	if (parsed.data.evaluation_ids && parsed.data.evaluation_ids.length > 0) {
		evalQuery = evalQuery.in('id', parsed.data.evaluation_ids);
	}

	const { data: evaluations, error: evalError } = await evalQuery;

	if (evalError) {
		return json({ message: evalError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	if (!evaluations || evaluations.length === 0) {
		return json({ message: 'Geen beoordelingen gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	// Load EMVI criteria
	const { data: criteria, error: critError } = await supabase
		.from('emvi_criteria')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('sort_order', { ascending: true });

	if (critError) {
		return json({ message: critError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	const allCriteria = criteria ?? [];

	// Calculate total_score per evaluation
	type ScoredEval = { id: string; total_score: number };
	const scoredEvals: ScoredEval[] = evaluations.map((evaluation) => {
		const scores = (evaluation.scores ?? {}) as Record<string, { score: number }>;
		let totalScore = 0;

		if (project.scoring_methodology === 'lowest_price') {
			// For lowest_price: use price criterion score directly (lower is better)
			const priceCriterion = allCriteria.find((c) => c.criterion_type === 'price');
			if (priceCriterion && scores[priceCriterion.id]) {
				// Invert: 10 - score so lower price gets higher total
				totalScore = 10 - (scores[priceCriterion.id].score ?? 0);
			}
		} else {
			// EMVI / best_price_quality: score × (weight / 100) per criterion
			for (const criterion of allCriteria) {
				const scoreEntry = scores[criterion.id];
				if (scoreEntry) {
					totalScore += (scoreEntry.score ?? 0) * (Number(criterion.weight_percentage) / 100);
				}
			}
		}

		// Round to 2 decimals
		totalScore = Math.round(totalScore * 100) / 100;

		return { id: evaluation.id, total_score: totalScore };
	});

	// Sort by total_score descending (highest = best)
	scoredEvals.sort((a, b) => b.total_score - a.total_score);

	// Assign rankings (handle ties: same score = same ranking)
	const ranked: { id: string; total_score: number; ranking: number }[] = [];
	let currentRank = 1;
	for (let i = 0; i < scoredEvals.length; i++) {
		if (i > 0 && scoredEvals[i].total_score < scoredEvals[i - 1].total_score) {
			currentRank = i + 1;
		}
		ranked.push({ ...scoredEvals[i], ranking: currentRank });
	}

	// Update evaluations in database
	const updated: unknown[] = [];
	for (const entry of ranked) {
		const { data: evaluation, error: dbError } = await supabase
			.from('evaluations')
			.update({ total_score: entry.total_score, ranking: entry.ranking })
			.eq('id', entry.id)
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
		changes: { action: 'calculate_ranking', evaluations_ranked: ranked.length, methodology: project.scoring_methodology }
	});

	return json({ data: updated });
};
