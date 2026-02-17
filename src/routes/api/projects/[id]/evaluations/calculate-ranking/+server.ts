// POST /api/projects/:id/evaluations/calculate-ranking — Calculate total scores and rankings

import type { RequestHandler } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateRankingSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

type ScoredEval = { id: string; total_score: number };
type RankedEval = ScoredEval & { ranking: number };

async function loadProject(supabase: SupabaseClient, projectId: string) {
	return supabase
		.from('projects')
		.select('id, organization_id, scoring_methodology')
		.eq('id', projectId)
		.is('deleted_at', null)
		.single();
}

async function loadEvaluations(supabase: SupabaseClient, projectId: string, ids?: string[]) {
	let query = supabase
		.from('evaluations')
		.select('*')
		.eq('project_id', projectId)
		.is('deleted_at', null);
	if (ids && ids.length > 0) {
		query = query.in('id', ids);
	}
	return query;
}

async function loadCriteria(supabase: SupabaseClient, projectId: string) {
	return supabase
		.from('emvi_criteria')
		.select('*')
		.eq('project_id', projectId)
		.is('deleted_at', null)
		.order('sort_order', { ascending: true });
}

function calculateLowestPriceScore(
	scores: Record<string, { score: number }>,
	criteria: { id: string; criterion_type: string }[]
): number {
	const priceCriterion = criteria.find((c) => c.criterion_type === 'price');
	if (priceCriterion && scores[priceCriterion.id]) {
		return 10 - (scores[priceCriterion.id].score ?? 0);
	}
	return 0;
}

function calculateEmviScore(
	scores: Record<string, { score: number }>,
	criteria: { id: string; weight_percentage: number }[]
): number {
	let total = 0;
	for (const criterion of criteria) {
		const entry = scores[criterion.id];
		if (entry) {
			total += (entry.score ?? 0) * (Number(criterion.weight_percentage) / 100);
		}
	}
	return total;
}

function calculateScores(
	evaluations: { id: string; scores: Record<string, unknown> | null }[],
	criteria: { id: string; criterion_type: string; weight_percentage: number }[],
	methodology: string
): ScoredEval[] {
	return evaluations.map((ev) => {
		const scores = (ev.scores ?? {}) as Record<string, { score: number }>;
		const total = methodology === 'lowest_price'
			? calculateLowestPriceScore(scores, criteria)
			: calculateEmviScore(scores, criteria);
		return { id: ev.id, total_score: Math.round(total * 100) / 100 };
	});
}

function assignRankings(scoredEvals: ScoredEval[]): RankedEval[] {
	const sorted = [...scoredEvals].sort((a, b) => b.total_score - a.total_score);
	const ranked: RankedEval[] = [];
	let currentRank = 1;
	for (let i = 0; i < sorted.length; i++) {
		if (i > 0 && sorted[i].total_score < sorted[i - 1].total_score) {
			currentRank = i + 1;
		}
		ranked.push({ ...sorted[i], ranking: currentRank });
	}
	return ranked;
}

async function persistRankings(supabase: SupabaseClient, ranked: RankedEval[], projectId: string) {
	const updated: unknown[] = [];
	for (const entry of ranked) {
		const { data, error } = await supabase
			.from('evaluations')
			.update({ total_score: entry.total_score, ranking: entry.ranking })
			.eq('id', entry.id)
			.eq('project_id', projectId)
			.select()
			.single();
		if (error) return { error: error.message };
		updated.push(data);
	}
	return { data: updated };
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;
	if (!user) return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');

	const { data: project, error: projErr } = await loadProject(supabase, params.id);
	if (projErr || !project) return apiError(404, 'NOT_FOUND', 'Project niet gevonden');

	const body = await request.json().catch(() => ({}));
	const parsed = calculateRankingSchema.safeParse(body);
	if (!parsed.success) return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);

	const { data: evals, error: evalErr } = await loadEvaluations(supabase, params.id, parsed.data.evaluation_ids);
	if (evalErr) return apiError(500, 'DB_ERROR', evalErr.message);
	if (!evals?.length) return apiError(404, 'NOT_FOUND', 'Geen beoordelingen gevonden');

	const { data: criteria, error: critErr } = await loadCriteria(supabase, params.id);
	if (critErr) return apiError(500, 'DB_ERROR', critErr.message);

	const ranked = assignRankings(calculateScores(evals, criteria ?? [], project.scoring_methodology));
	const result = await persistRankings(supabase, ranked, params.id);
	if (result.error) return apiError(500, 'DB_ERROR', result.error);

	await logAudit(supabase, {
		organizationId: project.organization_id, projectId: params.id,
		actorId: user.id, actorEmail: user.email ?? undefined,
		action: 'update', entityType: 'evaluation',
		changes: { action: 'calculate_ranking', evaluations_ranked: ranked.length, methodology: project.scoring_methodology }
	});
	return apiSuccess(result.data);
};
