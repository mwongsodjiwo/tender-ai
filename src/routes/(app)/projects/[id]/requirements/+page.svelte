<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import {
		REQUIREMENT_TYPE_LABELS,
		REQUIREMENT_CATEGORY_LABELS,
		REQUIREMENT_TYPES,
		REQUIREMENT_CATEGORIES
	} from '$types';
	import type { RequirementType, RequirementCategory } from '$types';

	export let data: PageData;

	$: project = data.project;
	$: pveDocType = data.pveDocType;
	$: requirements = data.requirements as Requirement[];

	// Local state
	let searchQuery = '';
	let typeFilter = '';
	let categoryFilter = '';
	let generating = false;
	let generateError = '';
	let expandedCategories: Set<string> = new Set(REQUIREMENT_CATEGORIES);
	let editingId: string | null = null;
	let editForm = { title: '', description: '', priority: 3 };
	let showNewForm = false;
	let newForm = {
		title: '',
		description: '',
		requirement_type: 'eis' as RequirementType,
		category: 'functional' as RequirementCategory,
		priority: 3
	};
	let saving = false;

	// Drag state
	let draggedId: string | null = null;
	let dragOverId: string | null = null;

	interface Requirement {
		id: string;
		requirement_number: string;
		title: string;
		description: string;
		requirement_type: RequirementType;
		category: RequirementCategory;
		priority: number;
		sort_order: number;
	}

	// Filtered requirements
	$: filteredRequirements = requirements.filter((r) => {
		if (typeFilter && r.requirement_type !== typeFilter) return false;
		if (categoryFilter && r.category !== categoryFilter) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.requirement_number.toLowerCase().includes(q);
		}
		return true;
	});

	// Grouped by category
	$: groupedRequirements = REQUIREMENT_CATEGORIES.reduce(
		(acc, cat) => {
			const items = filteredRequirements.filter((r) => r.category === cat);
			if (items.length > 0) {
				acc.push({ category: cat, label: REQUIREMENT_CATEGORY_LABELS[cat], items });
			}
			return acc;
		},
		[] as { category: RequirementCategory; label: string; items: Requirement[] }[]
	);

	// Metrics
	$: totalCount = requirements.length;
	$: eisCount = requirements.filter((r) => r.requirement_type === 'eis').length;
	$: wensCount = requirements.filter((r) => r.requirement_type === 'wens').length;

	// Filter config for FilterBar
	$: filterConfig = [
		{
			key: 'type',
			label: 'Type',
			options: REQUIREMENT_TYPES.map((t) => ({
				value: t,
				label: REQUIREMENT_TYPE_LABELS[t]
			}))
		},
		{
			key: 'category',
			label: 'Categorie',
			options: REQUIREMENT_CATEGORIES.map((c) => ({
				value: c,
				label: REQUIREMENT_CATEGORY_LABELS[c]
			}))
		}
	];

	function toggleCategory(cat: string) {
		if (expandedCategories.has(cat)) {
			expandedCategories.delete(cat);
		} else {
			expandedCategories.add(cat);
		}
		expandedCategories = new Set(expandedCategories);
	}

	function handleSearch(query: string) {
		searchQuery = query;
	}

	function handleFilter(key: string, value: string) {
		if (key === 'type') typeFilter = value;
		if (key === 'category') categoryFilter = value;
	}

	async function generateRequirements() {
		generating = true;
		generateError = '';

		const response = await fetch(`/api/projects/${project.id}/requirements/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ document_type_id: pveDocType.id })
		});

		if (!response.ok) {
			const result = await response.json();
			generateError = result.message ?? 'Er is een fout opgetreden bij het genereren.';
		} else {
			await invalidateAll();
		}

		generating = false;
	}

	async function deleteRequirement(id: string) {
		const response = await fetch(`/api/projects/${project.id}/requirements/${id}`, {
			method: 'DELETE'
		});

		if (response.ok) {
			await invalidateAll();
		}
	}

	async function duplicateRequirement(req: Requirement) {
		const response = await fetch(`/api/projects/${project.id}/requirements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				document_type_id: pveDocType.id,
				title: `${req.title} (kopie)`,
				description: req.description,
				requirement_type: req.requirement_type,
				category: req.category,
				priority: req.priority
			})
		});

		if (response.ok) {
			await invalidateAll();
		}
	}

	function startEdit(req: Requirement) {
		editingId = req.id;
		editForm = {
			title: req.title,
			description: req.description,
			priority: req.priority
		};
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(id: string) {
		saving = true;
		const response = await fetch(`/api/projects/${project.id}/requirements/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(editForm)
		});

		if (response.ok) {
			editingId = null;
			await invalidateAll();
		}
		saving = false;
	}

	async function createRequirement() {
		saving = true;
		const response = await fetch(`/api/projects/${project.id}/requirements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				document_type_id: pveDocType.id,
				...newForm
			})
		});

		if (response.ok) {
			showNewForm = false;
			newForm = { title: '', description: '', requirement_type: 'eis', category: 'functional', priority: 3 };
			await invalidateAll();
		}
		saving = false;
	}

	function renderStars(count: number): string {
		return '\u2605'.repeat(count) + '\u2606'.repeat(5 - count);
	}

	// Drag and drop handlers
	function handleDragStart(id: string) {
		draggedId = id;
	}

	function handleDragOver(id: string, event: DragEvent) {
		event.preventDefault();
		dragOverId = id;
	}

	function handleDragLeave() {
		dragOverId = null;
	}

	async function handleDrop(targetId: string, categoryItems: Requirement[]) {
		if (!draggedId || draggedId === targetId) {
			draggedId = null;
			dragOverId = null;
			return;
		}

		const ids = categoryItems.map((r) => r.id);
		const fromIndex = ids.indexOf(draggedId);
		const toIndex = ids.indexOf(targetId);

		if (fromIndex === -1 || toIndex === -1) {
			draggedId = null;
			dragOverId = null;
			return;
		}

		// Reorder array
		ids.splice(fromIndex, 1);
		ids.splice(toIndex, 0, draggedId);

		draggedId = null;
		dragOverId = null;

		await fetch(`/api/projects/${project.id}/requirements/reorder`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ordered_ids: ids })
		});

		await invalidateAll();
	}

	const TYPE_BADGE_MAP: Record<string, string> = {
		eis: 'verplicht',
		wens: 'concept'
	};
</script>

<svelte:head>
	<title>Programma van Eisen — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<BackButton />

	<!-- Page header -->
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Programma van Eisen</h1>
			<p class="mt-1 text-sm text-gray-500">Beheer de eisen voor dit aanbestedingsproject.</p>
		</div>
		<div class="flex items-center gap-2">
			{#if requirements.length > 0}
				<button
					type="button"
					class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Exporteren
				</button>
			{/if}
			<button
				type="button"
				on:click={() => { showNewForm = true; }}
				class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
			>
				+ Nieuwe eis
			</button>
		</div>
	</div>

	<!-- Metric cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<MetricCard value={totalCount} label="Totaal" />
		<MetricCard value={eisCount} label="Eisen (Knock-out)" />
		<MetricCard value={wensCount} label="Wensen" />
	</div>

	<!-- Generate AI requirements -->
	{#if requirements.length === 0}
		<div class="rounded-card bg-white p-8 text-center shadow-card">
			<div class="mx-auto max-w-md">
				<svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<h3 class="mt-4 text-lg font-semibold text-gray-900">Nog geen eisen</h3>
				<p class="mt-2 text-sm text-gray-500">
					Laat de AI concept-eisen genereren op basis van de briefing, of voeg handmatig eisen toe.
				</p>
				{#if generateError}
					<div class="mt-4">
						<ErrorAlert message={generateError} />
					</div>
				{/if}
				<div class="mt-6 flex items-center justify-center gap-3">
					<button
						type="button"
						on:click={generateRequirements}
						disabled={generating}
						class="inline-flex items-center gap-2 rounded-card bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
					>
						{#if generating}
							<LoadingSpinner />
							Eisen genereren...
						{:else}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							AI eisen genereren
						{/if}
					</button>
					<button
						type="button"
						on:click={() => { showNewForm = true; }}
						class="rounded-card border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Handmatig toevoegen
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Filters (only when there are requirements) -->
	{#if requirements.length > 0}
		<FilterBar
			placeholder="Zoeken in eisen..."
			filters={filterConfig}
			onSearch={handleSearch}
			onFilter={handleFilter}
		/>
	{/if}

	<!-- New requirement form -->
	{#if showNewForm}
		<div class="rounded-card bg-white p-6 shadow-card">
			<h3 class="text-base font-semibold text-gray-900">Nieuwe eis toevoegen</h3>
			<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="sm:col-span-2">
					<label for="new-title" class="block text-sm font-medium text-gray-700">Titel</label>
					<input
						id="new-title"
						type="text"
						bind:value={newForm.title}
						class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
						placeholder="Korte omschrijving van de eis"
					/>
				</div>
				<div class="sm:col-span-2">
					<label for="new-desc" class="block text-sm font-medium text-gray-700">Beschrijving</label>
					<textarea
						id="new-desc"
						bind:value={newForm.description}
						rows="3"
						class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
						placeholder="Uitgebreide beschrijving met toetsbare criteria..."
					></textarea>
				</div>
				<div>
					<label for="new-type" class="block text-sm font-medium text-gray-700">Type</label>
					<select
						id="new-type"
						bind:value={newForm.requirement_type}
						class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
					>
						{#each REQUIREMENT_TYPES as t}
							<option value={t}>{REQUIREMENT_TYPE_LABELS[t]}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="new-category" class="block text-sm font-medium text-gray-700">Categorie</label>
					<select
						id="new-category"
						bind:value={newForm.category}
						class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
					>
						{#each REQUIREMENT_CATEGORIES as c}
							<option value={c}>{REQUIREMENT_CATEGORY_LABELS[c]}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="new-priority" class="block text-sm font-medium text-gray-700">Prioriteit (1-5)</label>
					<input
						id="new-priority"
						type="number"
						bind:value={newForm.priority}
						min="1"
						max="5"
						class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
					/>
				</div>
			</div>
			<div class="mt-4 flex items-center justify-end gap-2">
				<button
					type="button"
					on:click={() => { showNewForm = false; }}
					class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Annuleren
				</button>
				<button
					type="button"
					on:click={createRequirement}
					disabled={saving || !newForm.title.trim()}
					class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{saving ? 'Opslaan...' : 'Eis toevoegen'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Requirements grouped by category -->
	{#if requirements.length > 0 && groupedRequirements.length === 0}
		<EmptyState title="Geen resultaten" description="Geen eisen gevonden die voldoen aan de filters." icon="search" />
	{/if}

	{#each groupedRequirements as group}
		<div class="rounded-card bg-white shadow-card">
			<!-- Category header (collapsible) -->
			<button
				type="button"
				on:click={() => toggleCategory(group.category)}
				class="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
				aria-expanded={expandedCategories.has(group.category)}
			>
				<div class="flex items-center gap-3">
					<svg
						class="h-5 w-5 text-gray-500 transition-transform {expandedCategories.has(group.category) ? 'rotate-90' : ''}"
						fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
					<h2 class="text-base font-semibold text-gray-900">{group.label}</h2>
					<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
						{group.items.length}
					</span>
				</div>
			</button>

			<!-- Expanded items -->
			{#if expandedCategories.has(group.category)}
				<div class="border-t border-gray-100">
					{#each group.items as req, i (req.id)}
						<div
							class="border-b border-gray-50 px-6 py-4 transition-colors last:border-b-0 {dragOverId === req.id ? 'bg-primary-50' : ''} {editingId === req.id ? 'bg-gray-50' : 'hover:bg-gray-50'}"
							draggable={editingId !== req.id}
							on:dragstart={() => handleDragStart(req.id)}
							on:dragover={(e) => handleDragOver(req.id, e)}
							on:dragleave={handleDragLeave}
							on:drop={() => handleDrop(req.id, group.items)}
							role="listitem"
						>
							{#if editingId === req.id}
								<!-- Edit mode -->
								<div class="space-y-3">
									<input
										type="text"
										bind:value={editForm.title}
										class="block w-full rounded-card border border-gray-300 px-3 py-2 text-sm font-medium focus:border-primary-500 focus:ring-primary-500"
									/>
									<textarea
										bind:value={editForm.description}
										rows="3"
										class="block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
									></textarea>
									<div class="flex items-center gap-4">
										<div class="flex items-center gap-2">
											<label for="edit-priority" class="text-xs text-gray-500">Prioriteit:</label>
											<input
												id="edit-priority"
												type="number"
												bind:value={editForm.priority}
												min="1"
												max="5"
												class="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:ring-primary-500"
											/>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<button
											type="button"
											on:click={() => saveEdit(req.id)}
											disabled={saving}
											class="rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
										>
											{saving ? 'Opslaan...' : 'Opslaan'}
										</button>
										<button
											type="button"
											on:click={cancelEdit}
											class="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
										>
											Annuleren
										</button>
									</div>
								</div>
							{:else}
								<!-- Display mode -->
								<div class="flex items-start justify-between gap-4">
									<div class="flex items-start gap-3 min-w-0">
										<!-- Drag handle -->
										<div class="mt-1 cursor-grab text-gray-300 hover:text-gray-500" aria-hidden="true">
											<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
												<circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
												<circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
												<circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
											</svg>
										</div>
										<div class="min-w-0">
											<div class="flex flex-wrap items-center gap-2">
												<span class="text-xs font-mono text-gray-500">{req.requirement_number}</span>
												<StatusBadge status={TYPE_BADGE_MAP[req.requirement_type] ?? 'concept'} />
											</div>
											<h3 class="mt-1 text-sm font-medium text-gray-900">{req.title}</h3>
											{#if req.description}
												<p class="mt-1 text-sm text-gray-500 line-clamp-2">{req.description}</p>
											{/if}
											<div class="mt-2 flex items-center gap-4 text-xs text-gray-500">
												<span class="text-warning-500" title="Prioriteit {req.priority}/5" aria-label="Prioriteit {req.priority} van 5">
													{renderStars(req.priority)}
												</span>
											</div>
										</div>
									</div>
									<!-- Action buttons -->
									<div class="flex shrink-0 items-center gap-1">
										<button
											type="button"
											on:click={() => startEdit(req)}
											class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
											title="Bewerken"
											aria-label="Eis bewerken"
										>
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											</svg>
										</button>
										<button
											type="button"
											on:click={() => duplicateRequirement(req)}
											class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
											title="Kopiëren"
											aria-label="Eis kopiëren"
										>
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
											</svg>
										</button>
										<button
											type="button"
											on:click={() => deleteRequirement(req.id)}
											class="rounded p-1.5 text-gray-500 hover:bg-error-50 hover:text-error-600"
											title="Verwijderen"
											aria-label="Eis verwijderen"
										>
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/each}

	<!-- AI generate button (when requirements already exist) -->
	{#if requirements.length > 0}
		<div class="flex items-center justify-center py-4">
			<button
				type="button"
				on:click={generateRequirements}
				disabled={generating}
				class="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
			>
				{#if generating}
					<LoadingSpinner />
					Aanvullende eisen genereren...
				{:else}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
					AI aanvullende eisen genereren
				{/if}
			</button>
		</div>
	{/if}
</div>
