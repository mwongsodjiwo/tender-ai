<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Evaluation, EmviCriterion } from '$types/database';
	import type { ScoringMethodology } from '$types/enums';
	import {
		SCORING_METHODOLOGY_LABELS,
		EVALUATION_STATUS_LABELS,
		CRITERION_TYPE_LABELS
	} from '$types';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';

	export let data: PageData;

	$: project = data.project;
	$: evaluations = (data.evaluations ?? []) as Evaluation[];
	$: criteria = (data.criteria ?? []) as EmviCriterion[];
	$: scoringMethodology = (data.scoringMethodology ?? null) as ScoringMethodology | null;

	// Metric calculations
	$: avgScore = evaluations.length > 0
		? Math.round((evaluations.reduce((sum, e) => sum + (e.total_score ?? 0), 0) / evaluations.length) * 100) / 100
		: 0;
	$: highestScore = evaluations.length > 0
		? Math.max(...evaluations.map((e) => e.total_score ?? 0))
		: 0;

	// Matrix state: scores[evalId][criterionId] = number
	let matrixScores: Record<string, Record<string, number>> = {};

	// Initialize matrix from evaluation data
	$: {
		const newMatrix: Record<string, Record<string, number>> = {};
		for (const evaluation of evaluations) {
			newMatrix[evaluation.id] = {};
			const scores = (evaluation.scores ?? {}) as Record<string, { score: number }>;
			for (const criterion of criteria) {
				newMatrix[evaluation.id][criterion.id] = scores[criterion.id]?.score ?? 0;
			}
		}
		matrixScores = newMatrix;
	}

	// Computed: find highest/lowest score per criterion for color coding
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

	// Compute local weighted total for display (before server calculation)
	function computeLocalTotal(evalId: string): number {
		let total = 0;
		for (const criterion of criteria) {
			const score = matrixScores[evalId]?.[criterion.id] ?? 0;
			total += score * (Number(criterion.weight_percentage) / 100);
		}
		return Math.round(total * 100) / 100;
	}

	// Form state
	let newTendererName = '';
	let saving = false;
	let calculating = false;
	let addingTenderer = false;
	let errorMessage = '';

	async function addTenderer(): Promise<void> {
		if (!newTendererName.trim()) return;
		addingTenderer = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/evaluations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tenderer_name: newTendererName.trim() })
			});
			if (response.ok) {
				newTendererName = '';
				await invalidateAll();
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon inschrijver niet toevoegen.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
		addingTenderer = false;
	}

	async function saveScores(): Promise<void> {
		saving = true;
		errorMessage = '';
		try {
			// Build batch scores array
			const scores: { evaluation_id: string; criterion_id: string; score: number }[] = [];
			for (const evaluation of evaluations) {
				for (const criterion of criteria) {
					scores.push({
						evaluation_id: evaluation.id,
						criterion_id: criterion.id,
						score: matrixScores[evaluation.id]?.[criterion.id] ?? 0
					});
				}
			}

			if (scores.length === 0) {
				saving = false;
				return;
			}

			const response = await fetch(`/api/projects/${project.id}/evaluations/batch-score`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scores })
			});

			if (response.ok) {
				await invalidateAll();
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon scores niet opslaan.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
		saving = false;
	}

	async function calculateRanking(): Promise<void> {
		calculating = true;
		errorMessage = '';
		try {
			// First save scores, then calculate
			await saveScores();
			if (errorMessage) {
				calculating = false;
				return;
			}

			const response = await fetch(`/api/projects/${project.id}/evaluations/calculate-ranking`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});

			if (response.ok) {
				await invalidateAll();
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon ranking niet berekenen.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
		calculating = false;
	}

	async function deleteTenderer(evalId: string): Promise<void> {
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/evaluations/${evalId}`, {
				method: 'DELETE'
			});
			if (response.ok) {
				await invalidateAll();
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon inschrijver niet verwijderen.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
	}
</script>

<svelte:head>
	<title>Beoordelingen — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<BackButton />

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Beoordelingen</h1>
			<p class="mt-1 text-sm text-gray-500">
				Beoordeel inschrijvingen en bereken de ranking voor {project.name}
				{#if scoringMethodology}
					<span class="ml-1">({SCORING_METHODOLOGY_LABELS[scoringMethodology]})</span>
				{/if}
			</p>
		</div>
	</div>

	{#if errorMessage}
		<ErrorAlert message={errorMessage} on:dismiss={() => { errorMessage = ''; }} />
	{/if}

	<!-- Metric cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<MetricCard
			value={evaluations.length}
			label="Inschrijvers"
		/>
		<MetricCard
			value={avgScore}
			label="Gemiddelde score"
		/>
		<MetricCard
			value={highestScore}
			label="Hoogste score"
		/>
	</div>

	<!-- Add tenderer form -->
	<form on:submit|preventDefault={addTenderer} class="flex items-end gap-3">
		<div class="flex-1">
			<label for="new-tenderer" class="block text-sm font-medium text-gray-700">Inschrijver toevoegen</label>
			<input
				id="new-tenderer"
				type="text"
				bind:value={newTendererName}
				placeholder="Naam van de inschrijver"
				class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
			/>
		</div>
		<button
			type="submit"
			disabled={addingTenderer || !newTendererName.trim()}
			class="inline-flex items-center gap-1.5 rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			{addingTenderer ? 'Toevoegen...' : 'Toevoegen'}
		</button>
	</form>

	{#if evaluations.length === 0}
		<!-- Empty state -->
		<EmptyState
			title="Nog geen inschrijvers"
			description="Voeg de eerste inschrijver toe om te beginnen met beoordelen."
		/>
	{:else}
		<!-- Scoring matrix -->
		<div class="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th scope="col" class="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
							Inschrijver
						</th>
						{#each criteria as criterion}
							<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500" title="{criterion.description}">
								<div>{criterion.name}</div>
								<div class="mt-0.5 font-normal normal-case">
									<StatusBadge status={criterion.criterion_type} />
									<span class="ml-1 text-gray-400">{Number(criterion.weight_percentage)}%</span>
								</div>
							</th>
						{/each}
						<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
							Totaal
						</th>
						<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
							Ranking
						</th>
						<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
							Status
						</th>
						<th scope="col" class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
							Acties
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each evaluations as evaluation (evaluation.id)}
						<tr class="hover:bg-gray-50">
							<td class="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-gray-900">
								<a
									href="/projects/{project.id}/evaluations/{evaluation.id}"
									class="hover:text-primary-600 hover:underline"
								>
									{evaluation.tenderer_name}
								</a>
							</td>
							{#each criteria as criterion}
								<td class="px-3 py-2 text-center {getScoreClass(evaluation.id, criterion.id)}">
									<input
										type="number"
										min="0"
										max="10"
										step="0.1"
										bind:value={matrixScores[evaluation.id][criterion.id]}
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
									<span class="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold
										{evaluation.ranking === 1 ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'}">
										{evaluation.ranking}
									</span>
								{:else}
									<span class="text-sm text-gray-400">—</span>
								{/if}
							</td>
							<td class="px-3 py-3 text-center">
								<StatusBadge status={evaluation.status} />
							</td>
							<td class="px-3 py-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<a
										href="/projects/{project.id}/evaluations/{evaluation.id}"
										class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
										aria-label="Bekijk {evaluation.tenderer_name}"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
									</a>
									<button
										type="button"
										on:click={() => deleteTenderer(evaluation.id)}
										class="rounded-md p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600"
										aria-label="Verwijder {evaluation.tenderer_name}"
									>
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

		<!-- Action buttons -->
		<div class="flex flex-wrap items-center gap-3">
			<button
				type="button"
				on:click={saveScores}
				disabled={saving}
				class="inline-flex items-center gap-2 rounded-card bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
				</svg>
				{saving ? 'Opslaan...' : 'Scores opslaan'}
			</button>

			<button
				type="button"
				on:click={calculateRanking}
				disabled={calculating}
				class="inline-flex items-center gap-2 rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
				{calculating ? 'Berekenen...' : 'Ranking berekenen'}
			</button>

			<a
				href="/projects/{project.id}/correspondence"
				class="inline-flex items-center gap-2 rounded-card bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
				Genereer afwijzingsbrieven
			</a>
		</div>
	{/if}
</div>
