<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Evaluation, EmviCriterion } from '$types/database';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	export let evaluations: Evaluation[];
	export let criteria: EmviCriterion[];
	export let matrixScores: Record<string, Record<string, number>>;
	export let projectId: string;

	const dispatch = createEventDispatcher<{
		scoreChange: { evalId: string; critId: string; value: number };
		delete: string;
	}>();

	function getScoreClass(evalId: string, critId: string): string {
		if (evaluations.length < 2) return '';
		const allScoresForCrit = evaluations.map((e) => matrixScores[e.id]?.[critId] ?? 0);
		const max = Math.max(...allScoresForCrit);
		const min = Math.min(...allScoresForCrit);
		const val = matrixScores[evalId]?.[critId] ?? 0;
		if (max === min) return '';
		if (val === max) return 'bg-success-50';
		if (val === min) return 'bg-error-50';
		return '';
	}

	function computeLocalTotal(evalId: string): number {
		let total = 0;
		for (const criterion of criteria) {
			const score = matrixScores[evalId]?.[criterion.id] ?? 0;
			total += score * (Number(criterion.weight_percentage) / 100);
		}
		return Math.round(total * 100) / 100;
	}

	function handleScoreInput(evalId: string, critId: string, event: Event) {
		const value = Number((event.target as HTMLInputElement).value);
		dispatch('scoreChange', { evalId, critId, value });
	}
</script>

<div class="w-full overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card">
	<table class="min-w-full divide-y divide-gray-200">
		<thead class="bg-gray-50">
			<tr>
				<th scope="col" class="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
					Inschrijver
				</th>
				{#each criteria as criterion}
					<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500" title={criterion.description}>
						<div>{criterion.name}</div>
						<div class="mt-0.5 font-normal normal-case">
							<StatusBadge status={criterion.criterion_type} />
							<span class="ml-1 text-gray-500">{Number(criterion.weight_percentage)}%</span>
						</div>
					</th>
				{/each}
				<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Totaal</th>
				<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Ranking</th>
				<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
				<th scope="col" class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Acties</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-100">
			{#each evaluations as evaluation (evaluation.id)}
				<tr class="hover:bg-gray-50">
					<td class="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-gray-900">
						<a href="/projects/{projectId}/evaluations/{evaluation.id}" class="hover:text-primary-600 hover:underline">
							{evaluation.tenderer_name}
						</a>
					</td>
					{#each criteria as criterion}
						<td class="px-3 py-2 text-center {getScoreClass(evaluation.id, criterion.id)}">
							<input
								type="number" min="0" max="10" step="0.1"
								value={matrixScores[evaluation.id]?.[criterion.id] ?? 0}
								on:input={(e) => handleScoreInput(evaluation.id, criterion.id, e)}
								class="w-16 rounded-md border-gray-300 text-center text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
								aria-label="Score {evaluation.tenderer_name} voor {criterion.name}"
							/>
						</td>
					{/each}
					<td class="px-3 py-3 text-center text-sm font-semibold text-gray-900">
						{evaluation.total_score ?? computeLocalTotal(evaluation.id)}
					</td>
					<td class="px-3 py-3 text-center">
						{#if evaluation.ranking}
							<span class="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold {evaluation.ranking === 1 ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'}">
								{evaluation.ranking}
							</span>
						{:else}
							<span class="text-sm text-gray-500">—</span>
						{/if}
					</td>
					<td class="px-3 py-3 text-center">
						<StatusBadge status={evaluation.status} />
					</td>
					<td class="px-3 py-3 text-right">
						<div class="flex items-center justify-end gap-1">
							<a href="/projects/{projectId}/evaluations/{evaluation.id}" class="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-600" aria-label="Bekijk {evaluation.tenderer_name}">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
								</svg>
							</a>
							<button type="button" on:click={() => dispatch('delete', evaluation.id)} class="rounded-md p-1.5 text-gray-500 hover:bg-error-50 hover:text-error-600" aria-label="Verwijder {evaluation.tenderer_name}">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
