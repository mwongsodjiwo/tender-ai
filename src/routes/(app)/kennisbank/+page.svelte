<script lang="ts">
	import { navigating } from '$app/stores';
	import type { PageData } from './$types';
	import TenderNedSearch from '$components/TenderNedSearch.svelte';
	import DocumentList from '$components/DocumentList.svelte';
	import DocumentUpload from '$components/DocumentUpload.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import PageSkeleton from '$lib/components/PageSkeleton.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { Document } from '$types';

	export let data: PageData;

	$: organizations = data.organizations as { id: string; name: string; slug: string }[];
	$: selectedOrgId = data.selectedOrgId as string | null;
	$: documents = data.documents as Document[];
	$: tenderNedCount = data.tenderNedCount as number;
	$: isLoading = $navigating?.to?.url.pathname === '/kennisbank';

	let activeTab: 'documents' | 'tenderned' = 'documents';

	function reloadDocuments(): void {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Kennisbank — Tendermanager</title>
</svelte:head>

{#if isLoading}
	<PageSkeleton showHeader showCards />
{:else if organizations.length === 0}
	<div class="space-y-6">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Kennisbank</h1>
			<p class="mt-1 text-gray-600">
				Beheer organisatiedocumenten en doorzoek TenderNed-data.
			</p>
		</div>
		<EmptyState
			title="Geen organisaties"
			description="Je bent nog niet gekoppeld aan een organisatie. Neem contact op met de beheerder."
			icon="folder"
		/>
	</div>
{:else}
<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold text-gray-900">Kennisbank</h1>
		<p class="mt-1 text-gray-600">
			Beheer organisatiedocumenten en doorzoek TenderNed-data.
		</p>
	</div>

	<!-- Organization selector -->
	{#if organizations.length > 1}
		<div>
			<label for="org-select" class="block text-sm font-medium text-gray-700">Organisatie</label>
			<select
				id="org-select"
				value={selectedOrgId}
				on:change={(e) => {
					const orgId = e.currentTarget.value;
					window.location.href = `/kennisbank?organization_id=${orgId}`;
				}}
				class="mt-1 block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			>
				{#each organizations as org}
					<option value={org.id}>{org.name}</option>
				{/each}
			</select>
		</div>
	{/if}

	<!-- Stats -->
	<CardGrid columns={3}>
		<MetricCard value={documents.length} label="Documenten" />
		<MetricCard value={tenderNedCount} label="TenderNed aanbestedingen" />
		<MetricCard value={organizations.length} label="Organisaties" />
	</CardGrid>

	<!-- Tab navigation (scrollable on mobile) -->
	<div class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
		<div class="inline-flex items-center gap-1 border-b border-gray-200 pb-3" role="tablist" aria-label="Kennisbank onderdelen">
			{#each [
				{ id: 'documents', label: 'Documenten' },
				{ id: 'tenderned', label: 'TenderNed' }
			] as tab}
				<button
					role="tab"
					aria-selected={activeTab === tab.id}
					on:click={() => (activeTab = tab.id as typeof activeTab)}
					class="shrink-0 px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors {activeTab === tab.id
						? 'rounded-full bg-gray-800 text-white'
						: 'text-gray-500 hover:text-gray-600'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Documents tab -->
	{#if activeTab === 'documents'}
		{#if selectedOrgId}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div class="lg:col-span-2">
					<DocumentList
						{documents}
						projectId=""
						onDelete={reloadDocuments}
					/>
				</div>
				<div>
					<DocumentUpload
						projectId=""
						organizationId={selectedOrgId}
						onUploadComplete={reloadDocuments}
					/>
				</div>
			</div>
		{:else}
			<div class="rounded-card border-2 border-dashed border-gray-300 p-8 text-center">
				<p class="text-sm text-gray-500">Selecteer een organisatie om documenten te bekijken.</p>
			</div>
		{/if}
	{/if}

	<!-- TenderNed tab -->
	{#if activeTab === 'tenderned'}
		<TenderNedSearch />
	{/if}
</div>
{/if}
