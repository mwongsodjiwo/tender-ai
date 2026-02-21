<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import RequirementsTable from '$lib/components/requirements/RequirementsTable.svelte';
	import RequirementsForm from '$lib/components/requirements/RequirementsForm.svelte';
	import RequirementsActions from '$lib/components/requirements/RequirementsActions.svelte';
	import {
		REQUIREMENT_TYPE_LABELS,
		REQUIREMENT_CATEGORY_LABELS,
		REQUIREMENT_TYPES,
		REQUIREMENT_CATEGORIES
	} from '$types';
	import type { RequirementType, RequirementCategory } from '$types';
	import type { Requirement } from '$types/database';

	export let data: PageData;

	$: project = data.project;
	$: pveDocType = data.pveDocType;
	$: requirements = data.requirements as Requirement[];

	let searchQuery = ''; let typeFilter = ''; let categoryFilter = '';
	let generating = false; let generateError = '';
	let editingId: string | null = null; let showNewForm = false; let saving = false;
	let editForm = { title: '', description: '', priority: 3 };

	$: filteredRequirements = requirements.filter((r) => {
		if (typeFilter && r.requirement_type !== typeFilter) return false;
		if (categoryFilter && r.category !== categoryFilter) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.requirement_number.toLowerCase().includes(q);
		}
		return true;
	});

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

	$: totalCount = requirements.length;
	$: eisCount = requirements.filter((r) => r.requirement_type === 'eis').length;
	$: wensCount = requirements.filter((r) => r.requirement_type === 'wens').length;

	$: filterConfig = [
		{ key: 'type', label: 'Type', options: REQUIREMENT_TYPES.map((t) => ({ value: t, label: REQUIREMENT_TYPE_LABELS[t] })) },
		{ key: 'category', label: 'Categorie', options: REQUIREMENT_CATEGORIES.map((c) => ({ value: c, label: REQUIREMENT_CATEGORY_LABELS[c] })) }
	];

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
		const response = await fetch(`/api/projects/${project.id}/requirements/${id}`, { method: 'DELETE' });
		if (response.ok) await invalidateAll();
	}

	async function duplicateRequirement(req: Requirement) {
		const body = { document_type_id: pveDocType.id, title: `${req.title} (kopie)`, description: req.description, requirement_type: req.requirement_type, category: req.category, priority: req.priority };
		const response = await fetch(`/api/projects/${project.id}/requirements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
		if (response.ok) await invalidateAll();
	}

	function startEdit(req: Requirement) {
		editingId = req.id;
		editForm = { title: req.title, description: req.description, priority: req.priority };
	}

	async function saveEdit(id: string) {
		saving = true;
		const response = await fetch(`/api/projects/${project.id}/requirements/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(editForm)
		});
		if (response.ok) { editingId = null; await invalidateAll(); }
		saving = false;
	}

	async function createRequirement(form: { title: string; description: string; requirement_type: RequirementType; category: RequirementCategory; priority: number }) {
		saving = true;
		const response = await fetch(`/api/projects/${project.id}/requirements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ document_type_id: pveDocType.id, ...form })
		});
		if (response.ok) { showNewForm = false; await invalidateAll(); }
		saving = false;
	}

	async function handleReorder(orderedIds: string[]) {
		await fetch(`/api/projects/${project.id}/requirements/reorder`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ordered_ids: orderedIds })
		});
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Programma van Eisen — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<BackButton />

	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Programma van Eisen</h1>
			<p class="mt-1 text-sm text-gray-500">Beheer de eisen voor dit aanbestedingsproject.</p>
		</div>
		<div class="flex items-center gap-2">
			{#if requirements.length > 0}
				<button type="button" class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
					Exporteren
				</button>
			{/if}
			<button type="button" on:click={() => { showNewForm = true; }} class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
				+ Nieuwe eis
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<MetricCard value={totalCount} label="Totaal" />
		<MetricCard value={eisCount} label="Eisen (Knock-out)" />
		<MetricCard value={wensCount} label="Wensen" />
	</div>

	<RequirementsActions requirementsCount={requirements.length} {generating} {generateError} onGenerate={generateRequirements} onShowNewForm={() => { showNewForm = true; }} />

	{#if requirements.length > 0}
		<FilterBar
			placeholder="Zoeken in eisen..."
			filters={filterConfig}
			onSearch={(q) => { searchQuery = q; }}
			onFilter={(key, value) => { if (key === 'type') typeFilter = value; if (key === 'category') categoryFilter = value; }}
		/>
	{/if}

	{#if showNewForm}
		<RequirementsForm {saving} onCreate={createRequirement} onCancel={() => { showNewForm = false; }} />
	{/if}

	{#if requirements.length > 0 && groupedRequirements.length === 0}
		<EmptyState title="Geen resultaten" description="Geen eisen gevonden die voldoen aan de filters." icon="search" />
	{/if}

	<RequirementsTable {groupedRequirements} {editingId} {editForm} {saving} onStartEdit={startEdit} onCancelEdit={() => { editingId = null; }} onSaveEdit={saveEdit} onDelete={deleteRequirement} onDuplicate={duplicateRequirement} onReorder={handleReorder} />
</div>
