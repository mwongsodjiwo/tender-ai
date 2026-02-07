<script lang="ts">
	import type { PageData } from './$types';
	import TenderNedSearch from '$components/TenderNedSearch.svelte';
	import DocumentList from '$components/DocumentList.svelte';
	import DocumentUpload from '$components/DocumentUpload.svelte';
	import type { Document } from '$types';

	export let data: PageData;

	$: organizations = data.organizations as { id: string; name: string; slug: string }[];
	$: selectedOrgId = data.selectedOrgId as string | null;
	$: documents = data.documents as Document[];
	$: tenderNedCount = data.tenderNedCount as number;

	let activeTab: 'documents' | 'tenderned' = 'documents';

	function reloadDocuments(): void {
		// Trigger SvelteKit invalidation to reload data
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Kennisbank — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Kennisbank</h1>
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
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
			<p class="text-sm font-medium text-gray-500">Documenten</p>
			<p class="mt-1 text-2xl font-semibold text-gray-900">{documents.length}</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
			<p class="text-sm font-medium text-gray-500">TenderNed aanbestedingen</p>
			<p class="mt-1 text-2xl font-semibold text-gray-900">{tenderNedCount}</p>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
			<p class="text-sm font-medium text-gray-500">Organisaties</p>
			<p class="mt-1 text-2xl font-semibold text-gray-900">{organizations.length}</p>
		</div>
	</div>

	<!-- Tab navigation (scrollable on mobile) -->
	<div class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
		<div class="inline-flex min-w-full border-b border-gray-200" role="tablist" aria-label="Kennisbank onderdelen">
			{#each [
				{ id: 'documents', label: 'Documenten' },
				{ id: 'tenderned', label: 'TenderNed' }
			] as tab}
				<button
					role="tab"
					aria-selected={activeTab === tab.id}
					on:click={() => (activeTab = tab.id)}
					class="inline-flex shrink-0 items-center border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap {activeTab === tab.id
						? 'border-primary-500 text-primary-600'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
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
			<div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
				<p class="text-sm text-gray-500">Selecteer een organisatie om documenten te bekijken.</p>
			</div>
		{/if}
	{/if}

	<!-- TenderNed tab -->
	{#if activeTab === 'tenderned'}
		<TenderNedSearch />
	{/if}
</div>
