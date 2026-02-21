<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Correspondence } from '$types';
	import DataTableCard from '$lib/components/DataTableCard.svelte';
	import DocumentsTable from '$lib/components/documents/DocumentsTable.svelte';
	import DocumentDrawer from '$lib/components/documents/DocumentDrawer.svelte';
	import DocumentCreateModal from '$lib/components/documents/DocumentCreateModal.svelte';
	import { toasts } from '$lib/stores/toast';
	import type { DocumentRow } from '$lib/components/documents/types.js';
	import {
		buildRows, filterRows, downloadExport, type ProductBlock, type TypeFilter
	} from '$lib/components/documents/build-rows.js';

	export let data: PageData;

	$: project = data.project;
	$: productBlocks = data.productBlocks as ProductBlock[];
	$: emviCount = (data.emviCount ?? 0) as number;
	$: letters = (data.letters ?? []) as Correspondence[];
	$: archivedProductBlocks = (data.archivedProductBlocks ?? []) as ProductBlock[];
	$: archivedLetters = (data.archivedLetters ?? []) as Correspondence[];

	let activeTab: 'documents' | 'archief' = 'documents';
	let exporting = '';
	let searchQuery = '';
	let showFilter = false;
	let typeFilter: TypeFilter = 'all';
	let selectedDocument: DocumentRow | null = null;
	let showCreateModal = false;

	$: allRows = buildRows(productBlocks, emviCount, letters, project.id, false);
	$: allArchivedRows = buildRows(archivedProductBlocks, 0, archivedLetters, project.id, true);
	$: filteredRows = filterRows(allRows, searchQuery, typeFilter);
	$: filteredArchivedRows = filterRows(allArchivedRows, searchQuery, typeFilter);

	function handleRowClick(row: DocumentRow): void { selectedDocument = row; }
	function handleCloseDrawer(): void { selectedDocument = null; }

	async function handleArchive(id: string): Promise<void> {
		const row = allRows.find((r) => r.id === id);
		if (!row) return;
		const base = row.type === 'brief' ? 'correspondence' : 'documents';
		const res = await fetch(`/api/projects/${project.id}/${base}/${id}/archive`, { method: 'POST' });
		if (!res.ok) throw new Error('Archivering mislukt');
		selectedDocument = null;
		toasts.add('Succesvol gearchiveerd');
		await invalidateAll();
	}

	async function handleUnarchive(id: string): Promise<void> {
		const row = allArchivedRows.find((r) => r.id === id);
		if (!row) return;
		const base = row.type === 'brief' ? 'correspondence' : 'documents';
		const res = await fetch(`/api/projects/${project.id}/${base}/${id}/unarchive`, { method: 'POST' });
		if (!res.ok) throw new Error('Terugzetten mislukt');
		selectedDocument = null;
		toasts.add('Succesvol teruggezet');
		await invalidateAll();
	}

	async function handleExport(id: string, format: 'docx' | 'pdf') {
		exporting = `${id}-${format}`;
		await downloadExport(project.id, id, format);
		exporting = '';
	}

	$: tabs = [
		{ key: 'documents' as const, label: 'Documenten', count: allRows.length },
		{ key: 'archief' as const, label: 'Archief', count: allArchivedRows.length }
	];
	$: filterOptions = [
		{ value: 'all' as const, label: 'Alles' },
		{ value: 'document' as const, label: 'Documenten' },
		{ value: 'brief' as const, label: 'Brieven' }
	];
</script>

<svelte:head>
	<title>Documenten — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-gray-900">Documenten</h1>
		<button type="button" on:click={() => (showCreateModal = true)}
			class="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors">
			Aanmaken
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M11.35 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5.35"/>
				<path d="M14 2v5a1 1 0 0 0 1 1h5"/>
				<path d="M14 19h6"/>
				<path d="M17 16v6"/>
			</svg>
		</button>
	</div>

	<nav class="-mb-px flex gap-6 border-b border-gray-200" aria-label="Documenten tabs">
		{#each tabs as tab (tab.key)}
			<button type="button" on:click={() => (activeTab = tab.key)} role="tab"
				aria-selected={activeTab === tab.key}
				class="whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors
					{activeTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}">
				{tab.label} ({tab.count})
			</button>
		{/each}
	</nav>

	<div class="documents-card">
		<DataTableCard bind:searchQuery bind:showFilter searchPlaceholder="Zoeken"
			searchLabel="Zoek documenten en brieven" showOptionsButton={false} scrollable>
			<svelte:fragment slot="filter">
				<div class="flex items-center gap-2">
					<span class="text-xs font-medium text-gray-500">Type:</span>
					{#each filterOptions as opt (opt.value)}
						<button type="button" on:click={() => (typeFilter = opt.value)}
							class="rounded-full px-3 py-1 text-xs font-medium transition-colors
								{typeFilter === opt.value ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-600 hover:bg-gray-100'}">
							{opt.label}
						</button>
					{/each}
					{#if typeFilter !== 'all'}
						<button type="button" on:click={() => (typeFilter = 'all')}
							class="ml-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">Wissen</button>
					{/if}
				</div>
			</svelte:fragment>
			{#if activeTab === 'documents'}
				<DocumentsTable rows={filteredRows} onRowClick={handleRowClick} onExport={handleExport} {exporting} />
			{:else if filteredArchivedRows.length > 0}
				<DocumentsTable rows={filteredArchivedRows} onRowClick={handleRowClick} onExport={null} exporting="" />
			{:else}
				<div class="px-5 py-12 text-center">
					<svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
					</svg>
					<p class="mt-2 text-sm text-gray-500">Geen gearchiveerde documenten.</p>
				</div>
			{/if}
		</DataTableCard>
	</div>
</div>

<DocumentDrawer document={selectedDocument} onClose={handleCloseDrawer}
	onArchive={handleArchive} onUnarchive={handleUnarchive} />

{#if showCreateModal}
	<DocumentCreateModal projectId={project.id}
		documentTypes={productBlocks.map((b) => ({ id: b.id, name: b.name, description: b.description }))}
		onClose={() => (showCreateModal = false)} />
{/if}

<style>
	.documents-card :global(.rounded-xl) { max-height: calc(100vh - 18rem); }
</style>
