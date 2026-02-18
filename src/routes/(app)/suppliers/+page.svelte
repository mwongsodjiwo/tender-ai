<!-- Suppliers list page — search, filter, table, KVK dialog, drawer -->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Supplier, SupplierContact } from '$types';
	import { activeOrganizationId } from '$stores/organization-context';
	import FilterBar from '$components/FilterBar.svelte';
	import EmptyState from '$components/EmptyState.svelte';
	import SupplierTable from '$components/suppliers/SupplierTable.svelte';
	import SupplierDrawer from '$components/suppliers/SupplierDrawer.svelte';
	import KvkSearchDialog from '$components/suppliers/KvkSearchDialog.svelte';

	export let data: PageData;

	let searchQuery = '';
	let tagFilter = '';
	let showKvkDialog = false;
	let selectedSupplier: Supplier | null = null;
	let selectedContacts: SupplierContact[] = [];
	let creating = false;
	let errorMessage = '';

	$: suppliers = (data.suppliers ?? []) as Supplier[];
	$: allTags = [...new Set(suppliers.flatMap((s) => s.tags ?? []))].sort();

	$: filterConfig = allTags.length > 0
		? [{ key: 'tag', label: 'Tags', options: allTags.map((t) => ({ value: t, label: t })) }]
		: [];

	$: filtered = suppliers.filter((s) => {
		if (tagFilter && !(s.tags ?? []).includes(tagFilter)) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			return s.company_name.toLowerCase().includes(q)
				|| (s.kvk_nummer ?? '').includes(q)
				|| (s.city ?? '').toLowerCase().includes(q);
		}
		return true;
	});

	function handleSearch(query: string): void { searchQuery = query; }
	function handleFilter(key: string, value: string): void {
		if (key === 'tag') tagFilter = value;
	}

	async function openDrawer(supplier: Supplier): Promise<void> {
		selectedSupplier = supplier;
		try {
			const res = await fetch(`/api/suppliers/${supplier.id}`);
			const json = await res.json();
			if (res.ok) { selectedContacts = json.data.contacts ?? []; }
		} catch { selectedContacts = []; }
	}

	function closeDrawer(): void {
		selectedSupplier = null;
		selectedContacts = [];
	}

	async function handleKvkSelect(result: {
		kvkNummer: string; handelsnaam: string;
		straatnaam: string | null; postcode: string | null; plaats: string | null;
	}): Promise<void> {
		creating = true;
		errorMessage = '';
		showKvkDialog = false;
		try {
			if (!data.organizationId) {
				errorMessage = 'Geen actieve organisatie gevonden.';
				return;
			}
			const payload: Record<string, unknown> = {
				organization_id: data.organizationId,
				company_name: result.handelsnaam,
				kvk_nummer: result.kvkNummer
			};
			if (result.straatnaam) payload.street = result.straatnaam;
			if (result.postcode) payload.postal_code = result.postcode;
			if (result.plaats) payload.city = result.plaats;

			const res = await fetch('/api/suppliers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Leverancier aanmaken mislukt';
				return;
			}
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
		finally { creating = false; }
	}

	async function handleSaveNotes(notes: string): Promise<void> {
		if (!selectedSupplier) return;
		await fetch(`/api/suppliers/${selectedSupplier.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ notes })
		});
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Leveranciers — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-lg font-semibold text-gray-900">Leveranciers</h1>
			<p class="mt-1 text-sm text-gray-500">Beheer leveranciers van uw organisatie</p>
		</div>
		<button
			type="button"
			on:click={() => { showKvkDialog = true; }}
			disabled={creating}
			class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
		>
			{#if creating}Aanmaken...{:else}+ Nieuwe leverancier{/if}
		</button>
	</div>

	{#if errorMessage}
		<div class="rounded-card bg-error-50 p-4" role="alert">
			<p class="text-sm text-error-700">{errorMessage}</p>
		</div>
	{/if}

	{#if data.loadError}
		<div class="rounded-card bg-error-50 p-4" role="alert">
			<p class="text-sm text-error-700">{data.loadError}</p>
		</div>
	{/if}

	{#if suppliers.length > 0}
		<FilterBar
			placeholder="Zoeken op naam, KVK of stad..."
			filters={filterConfig}
			onSearch={handleSearch}
			onFilter={handleFilter}
		/>
	{/if}

	{#if suppliers.length === 0 && !data.loadError}
		<EmptyState
			title="Nog geen leveranciers"
			description="Voeg een leverancier toe via KVK zoeken."
			icon="users"
		/>
	{/if}

	{#if suppliers.length > 0 && filtered.length === 0}
		<EmptyState
			title="Geen resultaten"
			description="Geen leveranciers gevonden met deze zoekcriteria."
			icon="search"
		/>
	{/if}

	{#if filtered.length > 0}
		<SupplierTable suppliers={filtered} onSelect={openDrawer} />
	{/if}
</div>

<KvkSearchDialog
	open={showKvkDialog}
	onClose={() => { showKvkDialog = false; }}
	onSelect={handleKvkSelect}
/>

<SupplierDrawer
	supplier={selectedSupplier}
	contacts={selectedContacts}
	projectLinks={[]}
	onClose={closeDrawer}
	onSaveNotes={handleSaveNotes}
/>
