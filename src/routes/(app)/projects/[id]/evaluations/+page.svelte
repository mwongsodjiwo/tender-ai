<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Evaluation, EmviCriterion } from '$types/database';
	import type { ScoringMethodology } from '$types/enums';
	import { SCORING_METHODOLOGY_LABELS } from '$types';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import EvaluationForm from '$lib/components/evaluations/EvaluationForm.svelte';
	import EvaluationTable from '$lib/components/evaluations/EvaluationTable.svelte';
	import EvaluationScoring from '$lib/components/evaluations/EvaluationScoring.svelte';

	export let data: PageData;

	$: project = data.project;
	$: evaluations = (data.evaluations ?? []) as Evaluation[];
	$: criteria = (data.criteria ?? []) as EmviCriterion[];
	$: scoringMethodology = (data.scoringMethodology ?? null) as ScoringMethodology | null;

	$: avgScore = evaluations.length > 0
		? Math.round((evaluations.reduce((sum, e) => sum + (e.total_score ?? 0), 0) / evaluations.length) * 100) / 100
		: 0;
	$: highestScore = evaluations.length > 0
		? Math.max(...evaluations.map((e) => e.total_score ?? 0))
		: 0;

	let matrixScores: Record<string, Record<string, number>> = {};
	let saving = false;
	let calculating = false;
	let addingTenderer = false;
	let errorMessage = '';

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

	async function addTenderer(event: CustomEvent<string>): Promise<void> {
		addingTenderer = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/evaluations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tenderer_name: event.detail })
			});
			if (response.ok) { await invalidateAll(); }
			else { errorMessage = (await response.json()).message ?? 'Kon inschrijver niet toevoegen.'; }
		} catch { errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.'; }
		addingTenderer = false;
	}

	function handleScoreChange(event: CustomEvent<{ evalId: string; critId: string; value: number }>) {
		const { evalId, critId, value } = event.detail;
		if (matrixScores[evalId]) matrixScores[evalId][critId] = value;
	}

	async function saveScores(): Promise<void> {
		saving = true;
		errorMessage = '';
		try {
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
			if (scores.length === 0) { saving = false; return; }
			const response = await fetch(`/api/projects/${project.id}/evaluations/batch-score`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scores })
			});
			if (response.ok) { await invalidateAll(); }
			else { errorMessage = (await response.json()).message ?? 'Kon scores niet opslaan.'; }
		} catch { errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.'; }
		saving = false;
	}

	async function calculateRanking(): Promise<void> {
		calculating = true;
		errorMessage = '';
		try {
			await saveScores();
			if (errorMessage) { calculating = false; return; }
			const response = await fetch(`/api/projects/${project.id}/evaluations/calculate-ranking`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			if (response.ok) { await invalidateAll(); }
			else { errorMessage = (await response.json()).message ?? 'Kon ranking niet berekenen.'; }
		} catch { errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.'; }
		calculating = false;
	}

	async function deleteTenderer(event: CustomEvent<string>): Promise<void> {
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/evaluations/${event.detail}`, { method: 'DELETE' });
			if (response.ok) { await invalidateAll(); }
			else { errorMessage = (await response.json()).message ?? 'Kon inschrijver niet verwijderen.'; }
		} catch { errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.'; }
	}
</script>

<svelte:head>
	<title>Beoordelingen — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<BackButton />

	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Beoordelingen</h1>
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

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<MetricCard value={evaluations.length} label="Inschrijvers" />
		<MetricCard value={avgScore} label="Gemiddelde score" />
		<MetricCard value={highestScore} label="Hoogste score" />
	</div>

	<EvaluationForm adding={addingTenderer} on:add={addTenderer} />

	{#if evaluations.length === 0}
		<EmptyState title="Nog geen inschrijvers" description="Voeg de eerste inschrijver toe om te beginnen met beoordelen." />
	{:else}
		<EvaluationTable {evaluations} {criteria} {matrixScores} projectId={project.id} on:scoreChange={handleScoreChange} on:delete={deleteTenderer} />
		<EvaluationScoring projectId={project.id} {saving} {calculating} on:save={saveScores} on:calculate={calculateRanking} />
	{/if}
</div>
