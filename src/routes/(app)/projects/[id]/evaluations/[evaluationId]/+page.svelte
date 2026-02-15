<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Evaluation, EmviCriterion } from '$types/database';
	import type { ScoringMethodology } from '$types/enums';
	import {
		EVALUATION_STATUS_LABELS,
		CRITERION_TYPE_LABELS
	} from '$types';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	export let data: PageData;

	$: project = data.project;
	$: evaluation = data.evaluation as Evaluation;
	$: criteria = (data.criteria ?? []) as EmviCriterion[];
	$: scoringMethodology = (data.scoringMethodology ?? null) as ScoringMethodology | null;

	// Editable score state per criterion
	let scores: Record<string, number> = {};
	let notes = '';
	let saving = false;
	let deleting = false;
	let errorMessage = '';

	// Initialize from evaluation data
	$: {
		const evalScores = (evaluation.scores ?? {}) as Record<string, { score: number; notes?: string }>;
		const newScores: Record<string, number> = {};
		for (const criterion of criteria) {
			newScores[criterion.id] = evalScores[criterion.id]?.score ?? 0;
		}
		scores = newScores;
		notes = evaluation.notes ?? '';
	}

	// Compute weighted score per criterion
	function weightedScore(criterionId: string, weight: number): number {
		return Math.round((scores[criterionId] ?? 0) * (weight / 100) * 100) / 100;
	}

	// Compute local total
	$: localTotal = criteria.reduce((sum, c) => sum + weightedScore(c.id, Number(c.weight_percentage)), 0);
	$: localTotalRounded = Math.round(localTotal * 100) / 100;

	async function saveEvaluation(): Promise<void> {
		saving = true;
		errorMessage = '';
		try {
			// Build scores JSONB
			const evalScores = (evaluation.scores ?? {}) as Record<string, { score: number; notes?: string }>;
			const updatedScores: Record<string, { score: number; notes?: string }> = {};
			for (const criterion of criteria) {
				updatedScores[criterion.id] = {
					...(evalScores[criterion.id] ?? {}),
					score: scores[criterion.id] ?? 0
				};
			}

			const response = await fetch(`/api/projects/${project.id}/evaluations/${evaluation.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					scores: updatedScores,
					notes
				})
			});

			if (response.ok) {
				await invalidateAll();
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon beoordeling niet opslaan.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
		saving = false;
	}

	async function deleteEvaluation(): Promise<void> {
		if (!confirm(`Weet u zeker dat u de beoordeling van "${evaluation.tenderer_name}" wilt verwijderen?`)) return;
		deleting = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/evaluations/${evaluation.id}`, {
				method: 'DELETE'
			});
			if (response.ok) {
				await goto(`/projects/${project.id}/evaluations`);
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon beoordeling niet verwijderen.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
		deleting = false;
	}
</script>

<svelte:head>
	<title>{evaluation.tenderer_name} — Beoordelingen — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<div class="flex items-center gap-3">
				<a href="/projects/{project.id}/evaluations" class="text-sm text-gray-500 hover:text-gray-700">&larr; Beoordelingen</a>
			</div>
			<div class="mt-1 flex items-center gap-3">
				<h1 class="text-2xl font-bold text-gray-900">{evaluation.tenderer_name}</h1>
				{#if evaluation.ranking}
					<span class="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
						{evaluation.ranking === 1 ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'}">
						#{evaluation.ranking}
					</span>
				{/if}
				<StatusBadge status={evaluation.status} />
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if evaluation.ranking && evaluation.ranking > 1}
				<a
					href="/projects/{project.id}/correspondence?evaluation_id={evaluation.id}"
					class="inline-flex items-center gap-1.5 rounded-card bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
					Genereer afwijzingsbrief
				</a>
			{/if}
			<button
				type="button"
				on:click={deleteEvaluation}
				disabled={deleting}
				class="inline-flex items-center gap-1.5 rounded-card bg-white px-3 py-2 text-sm font-medium text-error-600 shadow-sm ring-1 ring-inset ring-error-300 hover:bg-error-50 disabled:opacity-50"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
				{deleting ? 'Verwijderen...' : 'Verwijderen'}
			</button>
		</div>
	</div>

	{#if errorMessage}
		<div class="rounded-badge bg-error-50 p-4" role="alert">
			<div class="flex items-center gap-2">
				<svg class="h-5 w-5 text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<p class="text-sm text-error-700">{errorMessage}</p>
			</div>
		</div>
	{/if}

	<!-- Overview metric cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<MetricCard
			value={evaluation.total_score ?? localTotalRounded}
			label="Totaalscore"
		/>
		<MetricCard
			value={evaluation.ranking ?? '—'}
			label="Ranking"
		/>
		<MetricCard
			value={EVALUATION_STATUS_LABELS[evaluation.status] ?? evaluation.status}
			label="Status"
		/>
	</div>

	<!-- Scores per criterion -->
	<div class="rounded-card border border-gray-200 bg-white shadow-card">
		<div class="border-b border-gray-200 px-6 py-4">
			<h2 class="text-base font-semibold text-gray-900">Scores per criterium</h2>
		</div>
		<div class="divide-y divide-gray-100">
			{#each criteria as criterion (criterion.id)}
				<div class="flex items-center gap-4 px-6 py-4">
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<h3 class="text-sm font-medium text-gray-900">{criterion.name}</h3>
							<StatusBadge status={criterion.criterion_type} />
						</div>
						{#if criterion.description}
							<p class="mt-0.5 text-xs text-gray-500">{criterion.description}</p>
						{/if}
					</div>
					<div class="text-right text-xs text-gray-500 shrink-0">
						Weging: {Number(criterion.weight_percentage)}%
					</div>
					<div class="shrink-0 w-20">
						<input
							type="number"
							min="0"
							max="10"
							step="0.1"
							bind:value={scores[criterion.id]}
							class="w-full rounded-md border-gray-300 text-center text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
							aria-label="Score voor {criterion.name}"
						/>
					</div>
					<div class="shrink-0 w-20 text-right">
						<span class="text-sm font-semibold text-gray-900">
							{weightedScore(criterion.id, Number(criterion.weight_percentage))}
						</span>
						<span class="text-xs text-gray-500"> gew.</span>
					</div>
				</div>
			{/each}
			{#if criteria.length > 0}
				<div class="flex items-center justify-end gap-4 px-6 py-4 bg-gray-50">
					<span class="text-sm font-semibold text-gray-900">Totaal gewogen score:</span>
					<span class="text-lg font-bold text-primary-600 w-20 text-right">{localTotalRounded}</span>
				</div>
			{:else}
				<div class="px-6 py-8 text-center text-sm text-gray-500">
					Geen EMVI-criteria geconfigureerd. <a href="/projects/{project.id}/emvi" class="text-primary-600 hover:underline">Configureer criteria</a>
				</div>
			{/if}
		</div>
	</div>

	<!-- Notes -->
	<div class="rounded-card border border-gray-200 bg-white shadow-card">
		<div class="border-b border-gray-200 px-6 py-4">
			<h2 class="text-base font-semibold text-gray-900">Notities & motivatie</h2>
		</div>
		<div class="px-6 py-4">
			<textarea
				bind:value={notes}
				rows="5"
				placeholder="Toelichting bij de beoordeling, motivatie voor de scores..."
				class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
			></textarea>
		</div>
	</div>

	<!-- Save button -->
	<div class="flex justify-end">
		<button
			type="button"
			on:click={saveEvaluation}
			disabled={saving}
			class="inline-flex items-center gap-2 rounded-card bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
			</svg>
			{saving ? 'Opslaan...' : 'Opslaan'}
		</button>
	</div>
</div>
