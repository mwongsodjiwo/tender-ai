// Sprint R12 — Ranking calculation tests
// Tests the core ranking algorithm: scores × weights = total, sorting, ranking assignment, edge cases

import { describe, it, expect } from 'vitest';

// Replicate the ranking calculation logic from calculate-ranking endpoint
interface CriterionDef {
	id: string;
	criterion_type: 'price' | 'quality';
	weight_percentage: number;
}

interface EvalDef {
	id: string;
	scores: Record<string, { score: number }>;
}

interface RankedResult {
	id: string;
	total_score: number;
	ranking: number;
}

function calculateRankings(
	evaluations: EvalDef[],
	criteria: CriterionDef[],
	methodology: 'lowest_price' | 'emvi' | 'best_price_quality'
): RankedResult[] {
	const scored = evaluations.map((evaluation) => {
		let totalScore = 0;

		if (methodology === 'lowest_price') {
			const priceCriterion = criteria.find((c) => c.criterion_type === 'price');
			if (priceCriterion && evaluation.scores[priceCriterion.id]) {
				totalScore = 10 - (evaluation.scores[priceCriterion.id].score ?? 0);
			}
		} else {
			for (const criterion of criteria) {
				const scoreEntry = evaluation.scores[criterion.id];
				if (scoreEntry) {
					totalScore += (scoreEntry.score ?? 0) * (criterion.weight_percentage / 100);
				}
			}
		}

		totalScore = Math.round(totalScore * 100) / 100;
		return { id: evaluation.id, total_score: totalScore };
	});

	scored.sort((a, b) => b.total_score - a.total_score);

	const ranked: RankedResult[] = [];
	let currentRank = 1;
	for (let i = 0; i < scored.length; i++) {
		if (i > 0 && scored[i].total_score < scored[i - 1].total_score) {
			currentRank = i + 1;
		}
		ranked.push({ ...scored[i], ranking: currentRank });
	}

	return ranked;
}

describe('Ranking Calculation', () => {
	const criteria: CriterionDef[] = [
		{ id: 'c1', criterion_type: 'price', weight_percentage: 40 },
		{ id: 'c2', criterion_type: 'quality', weight_percentage: 35 },
		{ id: 'c3', criterion_type: 'quality', weight_percentage: 25 }
	];

	describe('EMVI methodology', () => {
		it('should calculate weighted total scores correctly', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 8 }, c2: { score: 7 }, c3: { score: 9 } } },
				{ id: 'e2', scores: { c1: { score: 6 }, c2: { score: 9 }, c3: { score: 5 } } }
			];

			const result = calculateRankings(evaluations, criteria, 'emvi');

			// e1: 8*0.40 + 7*0.35 + 9*0.25 = 3.20 + 2.45 + 2.25 = 7.90
			// e2: 6*0.40 + 9*0.35 + 5*0.25 = 2.40 + 3.15 + 1.25 = 6.80
			expect(result[0].id).toBe('e1');
			expect(result[0].total_score).toBe(7.9);
			expect(result[0].ranking).toBe(1);
			expect(result[1].id).toBe('e2');
			expect(result[1].total_score).toBe(6.8);
			expect(result[1].ranking).toBe(2);
		});

		it('should assign same ranking for tied scores', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 8 }, c2: { score: 8 }, c3: { score: 8 } } },
				{ id: 'e2', scores: { c1: { score: 8 }, c2: { score: 8 }, c3: { score: 8 } } },
				{ id: 'e3', scores: { c1: { score: 5 }, c2: { score: 5 }, c3: { score: 5 } } }
			];

			const result = calculateRankings(evaluations, criteria, 'emvi');

			// e1 and e2 both score 8.0, e3 scores 5.0
			expect(result[0].ranking).toBe(1);
			expect(result[1].ranking).toBe(1);
			expect(result[2].ranking).toBe(3); // Skips rank 2
		});

		it('should handle missing scores as 0', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 10 } } }, // only price score
				{ id: 'e2', scores: {} } // no scores
			];

			const result = calculateRankings(evaluations, criteria, 'emvi');

			// e1: 10*0.40 + 0*0.35 + 0*0.25 = 4.0
			// e2: 0
			expect(result[0].id).toBe('e1');
			expect(result[0].total_score).toBe(4);
			expect(result[1].id).toBe('e2');
			expect(result[1].total_score).toBe(0);
		});

		it('should handle single evaluation', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 7 }, c2: { score: 8 }, c3: { score: 6 } } }
			];

			const result = calculateRankings(evaluations, criteria, 'emvi');

			expect(result).toHaveLength(1);
			expect(result[0].ranking).toBe(1);
			// 7*0.40 + 8*0.35 + 6*0.25 = 2.80 + 2.80 + 1.50 = 7.10
			expect(result[0].total_score).toBe(7.1);
		});

		it('should rank correctly with many evaluations', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 5 }, c2: { score: 5 }, c3: { score: 5 } } },
				{ id: 'e2', scores: { c1: { score: 10 }, c2: { score: 10 }, c3: { score: 10 } } },
				{ id: 'e3', scores: { c1: { score: 7 }, c2: { score: 7 }, c3: { score: 7 } } },
				{ id: 'e4', scores: { c1: { score: 3 }, c2: { score: 3 }, c3: { score: 3 } } }
			];

			const result = calculateRankings(evaluations, criteria, 'emvi');

			expect(result[0].id).toBe('e2');
			expect(result[0].ranking).toBe(1);
			expect(result[1].id).toBe('e3');
			expect(result[1].ranking).toBe(2);
			expect(result[2].id).toBe('e1');
			expect(result[2].ranking).toBe(3);
			expect(result[3].id).toBe('e4');
			expect(result[3].ranking).toBe(4);
		});

		it('should round to 2 decimal places', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 7.3 }, c2: { score: 8.7 }, c3: { score: 6.1 } } }
			];

			const result = calculateRankings(evaluations, criteria, 'emvi');

			// 7.3*0.40 + 8.7*0.35 + 6.1*0.25 = 2.92 + 3.045 + 1.525 = 7.49
			expect(result[0].total_score).toBe(7.49);
		});
	});

	describe('best_price_quality methodology', () => {
		it('should use same calculation as EMVI', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 9 }, c2: { score: 6 }, c3: { score: 7 } } }
			];

			const result = calculateRankings(evaluations, criteria, 'best_price_quality');

			// 9*0.40 + 6*0.35 + 7*0.25 = 3.60 + 2.10 + 1.75 = 7.45
			expect(result[0].total_score).toBe(7.45);
		});
	});

	describe('lowest_price methodology', () => {
		it('should invert price score (lower price = higher total)', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 3 } } }, // low price → 10-3=7
				{ id: 'e2', scores: { c1: { score: 8 } } } // high price → 10-8=2
			];

			const result = calculateRankings(evaluations, criteria, 'lowest_price');

			expect(result[0].id).toBe('e1');
			expect(result[0].total_score).toBe(7);
			expect(result[0].ranking).toBe(1);
			expect(result[1].id).toBe('e2');
			expect(result[1].total_score).toBe(2);
			expect(result[1].ranking).toBe(2);
		});

		it('should handle no price criterion', () => {
			const qualityOnly: CriterionDef[] = [
				{ id: 'c2', criterion_type: 'quality', weight_percentage: 100 }
			];

			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c2: { score: 8 } } }
			];

			const result = calculateRankings(evaluations, qualityOnly, 'lowest_price');

			// No price criterion → total stays 0
			expect(result[0].total_score).toBe(0);
		});
	});

	describe('edge cases', () => {
		it('should handle empty evaluations array', () => {
			const result = calculateRankings([], criteria, 'emvi');
			expect(result).toHaveLength(0);
		});

		it('should handle empty criteria array', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 8 } } }
			];

			const result = calculateRankings(evaluations, [], 'emvi');

			expect(result[0].total_score).toBe(0);
			expect(result[0].ranking).toBe(1);
		});

		it('should handle all zero scores', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 0 }, c2: { score: 0 }, c3: { score: 0 } } },
				{ id: 'e2', scores: { c1: { score: 0 }, c2: { score: 0 }, c3: { score: 0 } } }
			];

			const result = calculateRankings(evaluations, criteria, 'emvi');

			expect(result[0].total_score).toBe(0);
			expect(result[1].total_score).toBe(0);
			// Both tied at rank 1
			expect(result[0].ranking).toBe(1);
			expect(result[1].ranking).toBe(1);
		});

		it('should handle maximum scores (10)', () => {
			const evaluations: EvalDef[] = [
				{ id: 'e1', scores: { c1: { score: 10 }, c2: { score: 10 }, c3: { score: 10 } } }
			];

			const result = calculateRankings(evaluations, criteria, 'emvi');

			// 10*0.40 + 10*0.35 + 10*0.25 = 4.0 + 3.5 + 2.5 = 10.0
			expect(result[0].total_score).toBe(10);
		});
	});
});
