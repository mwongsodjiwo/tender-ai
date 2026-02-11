<script lang="ts">
	import type { PageData } from './$types';
	import type { EmviCriterion } from '$types/database';
	import type { ScoringMethodology, CriterionType } from '$types/enums';
	import {
		SCORING_METHODOLOGIES,
		SCORING_METHODOLOGY_LABELS,
		SCORING_METHODOLOGY_DESCRIPTIONS,
		CRITERION_TYPE_LABELS
	} from '$types';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	export let data: PageData;

	$: project = data.project;
	$: scoringMethodology = (data.scoringMethodology ?? null) as ScoringMethodology | null;
	$: criteria = (data.criteria ?? []) as EmviCriterion[];

	// Computed metrics
	$: totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight_percentage), 0);
	$: weightValid = Math.abs(totalWeight - 100) < 0.01;
	$: priceWeight = criteria
		.filter((c) => c.criterion_type === 'price')
		.reduce((sum, c) => sum + Number(c.weight_percentage), 0);
	$: qualityWeight = criteria
		.filter((c) => c.criterion_type === 'quality')
		.reduce((sum, c) => sum + Number(c.weight_percentage), 0);
	$: qualityCriteriaCount = criteria.filter((c) => c.criterion_type === 'quality').length;

	// Form state
	let showNewForm = false;
	let newName = '';
	let newDescription = '';
	let newType: CriterionType = 'quality';
	let newWeight = 0;
	let saving = false;
	let editingId: string | null = null;
	let editName = '';
	let editDescription = '';
	let editType: CriterionType = 'quality';
	let editWeight = 0;
	let methodologySaving = false;
	let errorMessage = '';

	const METHODOLOGY_ICONS: Record<ScoringMethodology, string> = {
		lowest_price: 'tag',
		emvi: 'scale',
		best_price_quality: 'star'
	};

	async function selectMethodology(methodology: ScoringMethodology): Promise<void> {
		methodologySaving = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/emvi/methodology`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scoring_methodology: methodology })
			});
			if (response.ok) {
				scoringMethodology = methodology;
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon de gunningssystematiek niet opslaan.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
		methodologySaving = false;
	}

	async function createCriterion(): Promise<void> {
		if (!newName.trim()) return;
		saving = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/emvi`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newName.trim(),
					description: newDescription.trim(),
					criterion_type: newType,
					weight_percentage: newWeight
				})
			});
			if (response.ok) {
				const { data: criterion } = await response.json();
				criteria = [...criteria, criterion];
				resetNewForm();
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon het criterium niet toevoegen.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
		saving = false;
	}

	function resetNewForm(): void {
		showNewForm = false;
		newName = '';
		newDescription = '';
		newType = 'quality';
		newWeight = 0;
	}

	function startEdit(criterion: EmviCriterion): void {
		editingId = criterion.id;
		editName = criterion.name;
		editDescription = criterion.description;
		editType = criterion.criterion_type;
		editWeight = Number(criterion.weight_percentage);
	}

	function cancelEdit(): void {
		editingId = null;
	}

	async function saveEdit(id: string): Promise<void> {
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/emvi/criteria/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: editName.trim(),
					description: editDescription.trim(),
					criterion_type: editType,
					weight_percentage: editWeight
				})
			});
			if (response.ok) {
				const { data: updated } = await response.json();
				criteria = criteria.map((c) => (c.id === id ? updated : c));
				editingId = null;
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon het criterium niet bijwerken.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
	}

	async function deleteCriterion(id: string): Promise<void> {
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/emvi/criteria/${id}`, {
				method: 'DELETE'
			});
			if (response.ok) {
				criteria = criteria.filter((c) => c.id !== id);
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon het criterium niet verwijderen.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
	}
</script>

<svelte:head>
	<title>EMVI-criteria — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-8">
	<!-- Breadcrumbs -->
	<Breadcrumbs items={[
		{ label: project.name, href: `/projects/${project.id}` },
		{ label: 'Gunningscriteria' }
	]} />

	<div>
		<h1 class="text-2xl font-bold text-gray-900">Gunningscriteria</h1>
		<p class="mt-1 text-sm text-gray-500">
			Kies de gunningssystematiek en beheer de criteria met weging voor {project.name}
		</p>
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

	<!-- Gunningssystematiek choice — 3 clickable cards -->
	<section aria-labelledby="methodology-heading">
		<h2 id="methodology-heading" class="text-base font-semibold text-gray-900">Gunningssystematiek</h2>
		<div class="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each SCORING_METHODOLOGIES as methodology}
				<button
					type="button"
					disabled={methodologySaving}
					on:click={() => selectMethodology(methodology)}
					class="relative rounded-card border-2 p-5 text-left transition-all
						{scoringMethodology === methodology
							? 'border-primary-500 bg-primary-50 shadow-card'
							: 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-card'}
						disabled:opacity-50"
					aria-pressed={scoringMethodology === methodology}
				>
					{#if scoringMethodology === methodology}
						<div class="absolute right-3 top-3">
							<svg class="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
							</svg>
						</div>
					{/if}
					<div class="mb-2">
						{#if METHODOLOGY_ICONS[methodology] === 'tag'}
							<svg class="h-8 w-8 {scoringMethodology === methodology ? 'text-primary-600' : 'text-gray-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						{:else if METHODOLOGY_ICONS[methodology] === 'scale'}
							<svg class="h-8 w-8 {scoringMethodology === methodology ? 'text-primary-600' : 'text-gray-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
							</svg>
						{:else}
							<svg class="h-8 w-8 {scoringMethodology === methodology ? 'text-primary-600' : 'text-gray-400'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
							</svg>
						{/if}
					</div>
					<h3 class="text-sm font-semibold {scoringMethodology === methodology ? 'text-primary-900' : 'text-gray-900'}">
						{SCORING_METHODOLOGY_LABELS[methodology]}
					</h3>
					<p class="mt-1 text-xs {scoringMethodology === methodology ? 'text-primary-700' : 'text-gray-500'}">
						{SCORING_METHODOLOGY_DESCRIPTIONS[methodology]}
					</p>
				</button>
			{/each}
		</div>
	</section>

	<!-- Only show criteria management for EMVI and best_price_quality -->
	{#if scoringMethodology === 'emvi' || scoringMethodology === 'best_price_quality'}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Left: Criteria list (2 cols) -->
			<div class="space-y-4 lg:col-span-2">
				<!-- Metric cards -->
				<div class="grid grid-cols-3 gap-4">
					<MetricCard
						value={criteria.length}
						label="Totaal criteria"
					/>
					<MetricCard
						value="{priceWeight}%"
						label="Prijsweging"
					/>
					<MetricCard
						value="{qualityWeight}%"
						label="Kwaliteitsweging"
					/>
				</div>

				<!-- Weight validation warning -->
				{#if criteria.length > 0 && !weightValid}
					<InfoBanner
						type="warning"
						title="Weging klopt niet"
						message="De totale weging is {totalWeight}%. Dit moet optellen tot exact 100%."
					/>
				{/if}

				{#if criteria.length > 0 && weightValid}
					<InfoBanner
						type="success"
						title="Weging correct"
						message="De totale weging is 100%. De criteria zijn geldig."
					/>
				{/if}

				<!-- Criteria list -->
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-gray-900">Criteria</h2>
						<button
							type="button"
							on:click={() => { showNewForm = true; }}
							class="inline-flex items-center gap-1.5 rounded-card bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							Criterium toevoegen
						</button>
					</div>

					{#if criteria.length === 0 && !showNewForm}
						<div class="rounded-card border-2 border-dashed border-gray-300 p-8 text-center">
							<svg class="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
							</svg>
							<h3 class="mt-3 text-sm font-semibold text-gray-900">Nog geen criteria</h3>
							<p class="mt-1 text-sm text-gray-500">Voeg het eerste gunningscriterium toe.</p>
							<button
								type="button"
								on:click={() => { showNewForm = true; }}
								class="mt-4 inline-flex items-center gap-1.5 rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
							>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
								Criterium toevoegen
							</button>
						</div>
					{/if}

					<!-- New criterion form -->
					{#if showNewForm}
						<form
							on:submit|preventDefault={createCriterion}
							class="rounded-card border border-primary-200 bg-primary-50 p-4 space-y-3"
						>
							<h3 class="text-sm font-semibold text-gray-900">Nieuw criterium</h3>
							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<div>
									<label for="new-name" class="block text-xs font-medium text-gray-700">Naam</label>
									<input
										id="new-name"
										type="text"
										bind:value={newName}
										placeholder="Bijv. Prijs, Plan van Aanpak"
										class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
										required
									/>
								</div>
								<div class="grid grid-cols-2 gap-3">
									<div>
										<label for="new-type" class="block text-xs font-medium text-gray-700">Type</label>
										<select
											id="new-type"
											bind:value={newType}
											class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
										>
											<option value="price">Prijs</option>
											<option value="quality">Kwaliteit</option>
										</select>
									</div>
									<div>
										<label for="new-weight" class="block text-xs font-medium text-gray-700">Weging %</label>
										<input
											id="new-weight"
											type="number"
											bind:value={newWeight}
											min="0"
											max="100"
											step="0.01"
											class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
										/>
									</div>
								</div>
							</div>
							<div>
								<label for="new-description" class="block text-xs font-medium text-gray-700">Beschrijving</label>
								<textarea
									id="new-description"
									bind:value={newDescription}
									rows="2"
									placeholder="Toelichting op het criterium..."
									class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
								></textarea>
							</div>
							<div class="flex gap-2">
								<button
									type="submit"
									disabled={saving || !newName.trim()}
									class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
								>
									{saving ? 'Opslaan...' : 'Toevoegen'}
								</button>
								<button
									type="button"
									on:click={resetNewForm}
									class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
								>
									Annuleren
								</button>
							</div>
						</form>
					{/if}

					<!-- Criteria items -->
					{#each criteria as criterion (criterion.id)}
						{#if editingId === criterion.id}
							<!-- Edit mode -->
							<form
								on:submit|preventDefault={() => saveEdit(criterion.id)}
								class="rounded-card border border-primary-200 bg-white p-4 shadow-card space-y-3"
							>
								<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
									<div>
										<label for="edit-name-{criterion.id}" class="block text-xs font-medium text-gray-700">Naam</label>
										<input
											id="edit-name-{criterion.id}"
											type="text"
											bind:value={editName}
											class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
											required
										/>
									</div>
									<div class="grid grid-cols-2 gap-3">
										<div>
											<label for="edit-type-{criterion.id}" class="block text-xs font-medium text-gray-700">Type</label>
											<select
												id="edit-type-{criterion.id}"
												bind:value={editType}
												class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
											>
												<option value="price">Prijs</option>
												<option value="quality">Kwaliteit</option>
											</select>
										</div>
										<div>
											<label for="edit-weight-{criterion.id}" class="block text-xs font-medium text-gray-700">Weging %</label>
											<input
												id="edit-weight-{criterion.id}"
												type="number"
												bind:value={editWeight}
												min="0"
												max="100"
												step="0.01"
												class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
											/>
										</div>
									</div>
								</div>
								<div>
									<label for="edit-description-{criterion.id}" class="block text-xs font-medium text-gray-700">Beschrijving</label>
									<textarea
										id="edit-description-{criterion.id}"
										bind:value={editDescription}
										rows="2"
										class="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
									></textarea>
								</div>
								<div class="flex gap-2">
									<button
										type="submit"
										class="rounded-card bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
									>
										Opslaan
									</button>
									<button
										type="button"
										on:click={cancelEdit}
										class="rounded-card border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
									>
										Annuleren
									</button>
								</div>
							</form>
						{:else}
							<!-- View mode -->
							<div class="rounded-card border border-gray-200 bg-white p-4 shadow-card transition-all hover:shadow-card-hover">
								<div class="flex items-start justify-between">
									<div class="flex items-start gap-3 min-w-0">
										<div class="shrink-0 mt-0.5">
											<StatusBadge status={criterion.criterion_type} />
										</div>
										<div class="min-w-0">
											<h3 class="text-sm font-semibold text-gray-900">{criterion.name}</h3>
											{#if criterion.description}
												<p class="mt-1 text-xs text-gray-500 line-clamp-2">{criterion.description}</p>
											{/if}
										</div>
									</div>
									<div class="flex items-center gap-3 shrink-0 ml-4">
										<span class="text-lg font-bold {criterion.criterion_type === 'price' ? 'text-primary-600' : 'text-success-600'}">
											{Number(criterion.weight_percentage)}%
										</span>
										<div class="flex gap-1">
											<button
												type="button"
												on:click={() => startEdit(criterion)}
												class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
												aria-label="Bewerk {criterion.name}"
											>
												<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
											</button>
											<button
												type="button"
												on:click={() => deleteCriterion(criterion.id)}
												class="rounded-md p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600"
												aria-label="Verwijder {criterion.name}"
											>
												<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										</div>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Right sidebar -->
			<div class="space-y-4">
				<!-- Weight overview card -->
				<div class="rounded-card bg-white p-5 shadow-card">
					<h3 class="text-sm font-semibold text-gray-900">Weging overzicht</h3>
					<div class="mt-4 space-y-3">
						{#each criteria as criterion}
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-600 truncate mr-2">{criterion.name}</span>
								<span class="font-medium text-gray-900 shrink-0">{Number(criterion.weight_percentage)}%</span>
							</div>
						{/each}
						{#if criteria.length > 0}
							<hr class="border-gray-200" />
							<div class="flex items-center justify-between text-sm font-bold">
								<span class="text-gray-900">Totaal</span>
								<span class="{weightValid ? 'text-success-600' : 'text-error-600'}">
									{totalWeight}%
								</span>
							</div>
						{/if}
					</div>

					<!-- Visual weight bar -->
					{#if criteria.length > 0}
						<div class="mt-4">
							<div class="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
								{#if priceWeight > 0}
									<div
										class="bg-primary-500 transition-all"
										style="width: {Math.min(priceWeight, 100)}%"
										title="Prijs: {priceWeight}%"
									></div>
								{/if}
								{#if qualityWeight > 0}
									<div
										class="bg-success-500 transition-all"
										style="width: {Math.min(qualityWeight, 100)}%"
										title="Kwaliteit: {qualityWeight}%"
									></div>
								{/if}
							</div>
							<div class="mt-2 flex gap-4 text-xs text-gray-500">
								<span class="flex items-center gap-1">
									<span class="inline-block h-2 w-2 rounded-full bg-primary-500"></span>
									Prijs ({priceWeight}%)
								</span>
								<span class="flex items-center gap-1">
									<span class="inline-block h-2 w-2 rounded-full bg-success-500"></span>
									Kwaliteit ({qualityWeight}%)
								</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- EMVI guidelines info block -->
				<div class="rounded-card bg-white p-5 shadow-card">
					<h3 class="text-sm font-semibold text-gray-900">EMVI-richtlijnen</h3>
					<ul class="mt-3 space-y-2 text-xs text-gray-600">
						<li class="flex items-start gap-2">
							<svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
							</svg>
							Prijs mag maximaal 40-50% wegen
						</li>
						<li class="flex items-start gap-2">
							<svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
							</svg>
							Minimaal 2 kwaliteitscriteria
						</li>
						<li class="flex items-start gap-2">
							<svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
							</svg>
							Totaalweging moet optellen tot 100%
						</li>
						<li class="flex items-start gap-2">
							<svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
							</svg>
							Elk criterium moet objectief meetbaar zijn
						</li>
						<li class="flex items-start gap-2">
							<svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
							</svg>
							Conform art. 2.114 Aanbestedingswet 2012
						</li>
					</ul>

					<!-- Warnings based on current state -->
					{#if priceWeight > 50}
						<div class="mt-3 rounded-md bg-warning-50 p-2 text-xs text-warning-700">
							Prijsweging is hoger dan 50%. Overweeg meer gewicht aan kwaliteit te geven.
						</div>
					{/if}
					{#if qualityCriteriaCount < 2 && criteria.length > 0}
						<div class="mt-3 rounded-md bg-warning-50 p-2 text-xs text-warning-700">
							Minder dan 2 kwaliteitscriteria. Voeg meer kwaliteitscriteria toe.
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else if scoringMethodology === 'lowest_price'}
		<!-- Lowest price: no criteria needed -->
		<InfoBanner
			type="info"
			title="Laagste prijs geselecteerd"
			message="Bij de laagste prijs systematiek worden geen kwaliteitscriteria beoordeeld. Alleen de prijs is bepalend voor de gunning."
		/>
	{:else}
		<!-- No methodology selected yet -->
		<div class="rounded-card border-2 border-dashed border-gray-300 p-12 text-center">
			<svg class="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
			</svg>
			<h3 class="mt-3 text-sm font-semibold text-gray-900">Kies een gunningssystematiek</h3>
			<p class="mt-1 text-sm text-gray-500">Selecteer hierboven hoe inschrijvingen beoordeeld worden.</p>
		</div>
	{/if}
</div>
