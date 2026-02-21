<script lang="ts">
	import type { PageData } from './$types';
	import type { EmviCriterion } from '$types/database';
	import type { ScoringMethodology, CriterionType } from '$types/enums';
	import { SCORING_METHODOLOGIES, SCORING_METHODOLOGY_LABELS, SCORING_METHODOLOGY_DESCRIPTIONS } from '$types';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import EmviCriteriaList from '$lib/components/emvi/EmviCriteriaList.svelte';
	import EmviWeightForm from '$lib/components/emvi/EmviWeightForm.svelte';
	import EmviScoring from '$lib/components/emvi/EmviScoring.svelte';

	export let data: PageData;

	$: project = data.project;
	$: scoringMethodology = (data.scoringMethodology ?? null) as ScoringMethodology | null;
	$: criteria = (data.criteria ?? []) as EmviCriterion[];

	$: totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight_percentage), 0);
	$: weightValid = Math.abs(totalWeight - 100) < 0.01;
	$: priceWeight = criteria.filter((c) => c.criterion_type === 'price').reduce((sum, c) => sum + Number(c.weight_percentage), 0);
	$: qualityWeight = criteria.filter((c) => c.criterion_type === 'quality').reduce((sum, c) => sum + Number(c.weight_percentage), 0);
	$: qualityCriteriaCount = criteria.filter((c) => c.criterion_type === 'quality').length;

	let showNewForm = false; let saving = false; let methodologySaving = false; let errorMessage = '';
	let editingId: string | null = null; let editName = ''; let editDescription = '';
	let editType: CriterionType = 'quality'; let editWeight = 0;

	async function selectMethodology(methodology: ScoringMethodology): Promise<void> {
		methodologySaving = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/emvi/methodology`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scoring_methodology: methodology })
			});
			if (response.ok) { scoringMethodology = methodology; }
			else { errorMessage = (await response.json()).message ?? 'Kon de gunningssystematiek niet opslaan.'; }
		} catch { errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.'; }
		methodologySaving = false;
	}

	async function createCriterion(form: { name: string; description: string; criterion_type: CriterionType; weight_percentage: number }): Promise<void> {
		saving = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/emvi`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			if (response.ok) { criteria = [...criteria, (await response.json()).data]; showNewForm = false; }
			else { errorMessage = (await response.json()).message ?? 'Kon het criterium niet toevoegen.'; }
		} catch { errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.'; }
		saving = false;
	}

	function startEdit(criterion: EmviCriterion): void {
		editingId = criterion.id; editName = criterion.name; editDescription = criterion.description;
		editType = criterion.criterion_type; editWeight = Number(criterion.weight_percentage);
	}

	async function saveEdit(id: string): Promise<void> {
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/emvi/criteria/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: editName.trim(), description: editDescription.trim(), criterion_type: editType, weight_percentage: editWeight })
			});
			if (response.ok) { const updated = (await response.json()).data; criteria = criteria.map((c) => (c.id === id ? updated : c)); editingId = null; }
			else { errorMessage = (await response.json()).message ?? 'Kon het criterium niet bijwerken.'; }
		} catch { errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.'; }
	}

	async function deleteCriterion(id: string): Promise<void> {
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/emvi/criteria/${id}`, { method: 'DELETE' });
			if (response.ok) { criteria = criteria.filter((c) => c.id !== id); }
			else { errorMessage = (await response.json()).message ?? 'Kon het criterium niet verwijderen.'; }
		} catch { errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.'; }
	}

	const METHODOLOGY_ICON_PATHS: Record<ScoringMethodology, string> = {
		lowest_price: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
		emvi: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z',
		best_price_quality: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z'
	};
</script>

<svelte:head>
	<title>EMVI-criteria — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-8">
	<BackButton />

	<div>
		<h1 class="text-2xl font-semibold text-gray-900">Gunningscriteria</h1>
		<p class="mt-1 text-sm text-gray-500">Kies de gunningssystematiek en beheer de criteria met weging voor {project.name}</p>
	</div>

	{#if errorMessage}
		<div class="rounded-badge bg-error-50 p-4" role="alert">
			<p class="text-sm text-error-700">{errorMessage}</p>
		</div>
	{/if}

	<section aria-labelledby="methodology-heading">
		<h2 id="methodology-heading" class="text-base font-semibold text-gray-900">Gunningssystematiek</h2>
		<div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each SCORING_METHODOLOGIES as methodology}
				<button
					type="button"
					disabled={methodologySaving}
					on:click={() => selectMethodology(methodology)}
					class="relative rounded-card border-2 p-5 text-left transition-all {scoringMethodology === methodology ? 'border-primary-500 bg-primary-50 shadow-card' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-card'} disabled:opacity-50"
					aria-pressed={scoringMethodology === methodology}
				>
					{#if scoringMethodology === methodology}
						<svg class="absolute right-3 top-3 h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
						</svg>
					{/if}
					<svg class="mb-2 h-8 w-8 {scoringMethodology === methodology ? 'text-primary-600' : 'text-gray-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={METHODOLOGY_ICON_PATHS[methodology]} />
					</svg>
					<h3 class="text-sm font-semibold {scoringMethodology === methodology ? 'text-primary-900' : 'text-gray-900'}">{SCORING_METHODOLOGY_LABELS[methodology]}</h3>
					<p class="mt-1 text-xs {scoringMethodology === methodology ? 'text-primary-700' : 'text-gray-500'}">{SCORING_METHODOLOGY_DESCRIPTIONS[methodology]}</p>
				</button>
			{/each}
		</div>
	</section>

	{#if scoringMethodology === 'emvi' || scoringMethodology === 'best_price_quality'}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="space-y-4 lg:col-span-2">
				<div class="grid grid-cols-3 gap-4">
					<MetricCard value={criteria.length} label="Totaal criteria" />
					<MetricCard value="{priceWeight}%" label="Prijsweging" />
					<MetricCard value="{qualityWeight}%" label="Kwaliteitsweging" />
				</div>

				{#if criteria.length > 0 && !weightValid}
					<InfoBanner type="warning" title="Weging klopt niet" message="De totale weging is {totalWeight}%. Dit moet optellen tot exact 100%." />
				{/if}
				{#if criteria.length > 0 && weightValid}
					<InfoBanner type="success" title="Weging correct" message="De totale weging is 100%. De criteria zijn geldig." />
				{/if}

				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-gray-900">Criteria</h2>
						<button type="button" on:click={() => { showNewForm = true; }} class="inline-flex items-center gap-1.5 rounded-card bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
							Criterium toevoegen
						</button>
					</div>

					{#if criteria.length === 0 && !showNewForm}
						<div class="rounded-card border-2 border-dashed border-gray-300 p-8 text-center">
							<svg class="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={METHODOLOGY_ICON_PATHS['emvi']} />
							</svg>
							<h3 class="mt-3 text-sm font-semibold text-gray-900">Nog geen criteria</h3>
							<p class="mt-1 text-sm text-gray-500">Voeg het eerste gunningscriterium toe.</p>
							<button type="button" on:click={() => { showNewForm = true; }} class="mt-4 inline-flex items-center gap-1.5 rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
								Criterium toevoegen
							</button>
						</div>
					{/if}

					{#if showNewForm}
						<EmviWeightForm {saving} onCreate={createCriterion} onCancel={() => { showNewForm = false; }} />
					{/if}

					<EmviCriteriaList {criteria} {editingId} {editName} {editDescription} {editType} {editWeight} onStartEdit={startEdit} onCancelEdit={() => { editingId = null; }} onSaveEdit={saveEdit} onDelete={deleteCriterion} />
				</div>
			</div>

			<EmviScoring {criteria} {totalWeight} {weightValid} {priceWeight} {qualityWeight} {qualityCriteriaCount} />
		</div>
	{:else if scoringMethodology === 'lowest_price'}
		<InfoBanner type="info" title="Laagste prijs geselecteerd" message="Bij de laagste prijs systematiek worden geen kwaliteitscriteria beoordeeld. Alleen de prijs is bepalend voor de gunning." />
	{:else}
		<div class="rounded-card border-2 border-dashed border-gray-300 p-12 text-center">
			<svg class="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={METHODOLOGY_ICON_PATHS['emvi']} />
			</svg>
			<h3 class="mt-3 text-sm font-semibold text-gray-900">Kies een gunningssystematiek</h3>
			<p class="mt-1 text-sm text-gray-500">Selecteer hierboven hoe inschrijvingen beoordeeld worden.</p>
		</div>
	{/if}
</div>
