<!-- Settings General tab — org details, KVK, NUTS, org type -->
<script lang="ts">
	import type { Organization } from '$types';
	import {
		ORGANIZATION_TYPES,
		ORGANIZATION_TYPE_LABELS,
		CONTRACTING_AUTHORITY_TYPES,
		CONTRACTING_AUTHORITY_TYPE_LABELS
	} from '$types';
	import KvkSearchDialog from '$lib/components/suppliers/KvkSearchDialog.svelte';
	import CodeLookup from '$lib/components/CodeLookup.svelte';

	export let organization: Organization;
	export let canEdit = false;
	export let onSave: (data: {
		organization_type: string;
		aanbestedende_dienst_type: string | null;
	}) => void = () => {};
	export let onSaveDetails: (data: Record<string, unknown>) => Promise<void> = async () => {};

	// Organisation details state
	let orgName = organization.name;
	let orgDescription = organization.description ?? '';
	let kvkNummer = organization.kvk_nummer ?? '';
	let handelsnaam = organization.handelsnaam ?? '';
	let rechtsvorm = organization.rechtsvorm ?? '';
	let straat = organization.straat ?? '';
	let postcode = organization.postcode ?? '';
	let plaats = organization.plaats ?? '';
	let nutsCodes: string[] = [...(organization.nuts_codes ?? [])];
	let savingDetails = false;
	let showKvkDialog = false;
	let resolvingNuts = false;

	// Org type state
	let orgType = organization.organization_type ?? 'client';
	let authorityType = organization.aanbestedende_dienst_type ?? '';
	let saving = false;

	async function resolveNutsFromPostcode(pc: string): Promise<void> {
		if (pc.length < 4) return;
		resolvingNuts = true;
		try {
			const params = new URLSearchParams({ postcode: pc });
			const res = await fetch(`/api/nuts/from-postcode?${params}`);
			if (!res.ok) return;
			const json = await res.json();
			const codes = json.data?.codes as string[] | undefined;
			if (codes && codes.length > 0) {
				nutsCodes = codes;
			}
		} finally {
			resolvingNuts = false;
		}
	}

	async function handleKvkSelect(result: {
		kvkNummer: string;
		handelsnaam: string;
		straatnaam: string | null;
		postcode: string | null;
		plaats: string | null;
	}): Promise<void> {
		kvkNummer = result.kvkNummer;
		handelsnaam = result.handelsnaam;
		if (result.straatnaam) straat = result.straatnaam;
		if (result.postcode) postcode = result.postcode;
		if (result.plaats) plaats = result.plaats;
		showKvkDialog = false;
		if (result.postcode) {
			await resolveNutsFromPostcode(result.postcode);
		}
	}

	async function handleSaveDetails(): Promise<void> {
		savingDetails = true;
		try {
			await onSaveDetails({
				name: orgName.trim(),
				description: orgDescription.trim() || undefined,
				kvk_nummer: kvkNummer.trim() || undefined,
				handelsnaam: handelsnaam.trim() || undefined,
				rechtsvorm: rechtsvorm.trim() || undefined,
				straat: straat.trim() || undefined,
				postcode: postcode.trim() || undefined,
				plaats: plaats.trim() || undefined,
				nuts_codes: nutsCodes.length > 0 ? nutsCodes : undefined
			});
		} finally {
			savingDetails = false;
		}
	}

	function handleSave(): void {
		saving = true;
		onSave({
			organization_type: orgType,
			aanbestedende_dienst_type: authorityType || null
		});
		saving = false;
	}
</script>

<div class="space-y-6">
	<!-- Organisation details -->
	<div>
		<h3 class="text-base font-medium text-gray-900">Organisatiegegevens</h3>
		<p class="mt-1 text-sm text-gray-500">Naam, beschrijving en adresgegevens van uw organisatie.</p>
	</div>

	<form
		on:submit|preventDefault={handleSaveDetails}
		class="rounded-card border border-gray-200 bg-white shadow-card"
	>
		<div class="space-y-4 p-6">
			<div>
				<label for="settings-org-name" class="block text-sm font-medium text-gray-700">Naam</label>
				<input
					id="settings-org-name"
					type="text"
					bind:value={orgName}
					disabled={!canEdit}
					required
					minlength={2}
					maxlength={200}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
				/>
			</div>

			<div>
				<label for="settings-org-description" class="block text-sm font-medium text-gray-700">Beschrijving</label>
				<textarea
					id="settings-org-description"
					bind:value={orgDescription}
					disabled={!canEdit}
					maxlength={1000}
					rows="3"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
				></textarea>
			</div>
		</div>

		<!-- KVK & Adresgegevens -->
		<div class="space-y-4 border-t border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<h4 class="text-sm font-medium text-gray-900">KVK & Adresgegevens</h4>
				{#if canEdit}
					<button
						type="button"
						on:click={() => { showKvkDialog = true; }}
						class="inline-flex items-center gap-1.5 rounded-card bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700"
					>
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
						</svg>
						KVK zoeken
					</button>
				{/if}
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="settings-kvk" class="block text-sm font-medium text-gray-700">KVK-nummer</label>
					<input
						id="settings-kvk"
						type="text"
						bind:value={kvkNummer}
						disabled={!canEdit}
						maxlength={8}
						placeholder="12345678"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
							{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
					/>
				</div>
				<div>
					<label for="settings-handelsnaam" class="block text-sm font-medium text-gray-700">Handelsnaam</label>
					<input
						id="settings-handelsnaam"
						type="text"
						bind:value={handelsnaam}
						disabled={!canEdit}
						maxlength={300}
						placeholder="Officiële handelsnaam"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
							{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
					/>
				</div>
			</div>

			<div>
				<label for="settings-rechtsvorm" class="block text-sm font-medium text-gray-700">Rechtsvorm</label>
				<input
					id="settings-rechtsvorm"
					type="text"
					bind:value={rechtsvorm}
					disabled={!canEdit}
					maxlength={100}
					placeholder="Bijv. Besloten Vennootschap"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
				/>
			</div>

			<div>
				<label for="settings-straat" class="block text-sm font-medium text-gray-700">Straat + huisnummer</label>
				<input
					id="settings-straat"
					type="text"
					bind:value={straat}
					disabled={!canEdit}
					maxlength={200}
					placeholder="Hoofdstraat 1"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
				/>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="settings-postcode" class="block text-sm font-medium text-gray-700">Postcode</label>
					<input
						id="settings-postcode"
						type="text"
						bind:value={postcode}
						disabled={!canEdit}
						maxlength={7}
						placeholder="1234 AB"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
							{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
					/>
				</div>
				<div>
					<label for="settings-plaats" class="block text-sm font-medium text-gray-700">Plaats</label>
					<input
						id="settings-plaats"
						type="text"
						bind:value={plaats}
						disabled={!canEdit}
						maxlength={100}
						placeholder="Amsterdam"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
							{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
					/>
				</div>
			</div>
		</div>

		<!-- NUTS-codes -->
		<div class="space-y-4 border-t border-gray-200 p-6">
			<div class="flex items-center gap-2">
				<h4 class="text-sm font-medium text-gray-900">NUTS-codes</h4>
				{#if resolvingNuts}
					<span class="text-xs text-gray-400">Bepalen op basis van postcode...</span>
				{/if}
			</div>
			{#if canEdit}
				<CodeLookup
					apiUrl="/api/nuts"
					selected={nutsCodes}
					placeholder="Zoek NUTS-code of regio..."
					on:change={(e) => { nutsCodes = e.detail; }}
				/>
			{:else}
				<p class="text-sm text-gray-500">
					{nutsCodes.length > 0 ? nutsCodes.join(', ') : 'Geen NUTS-codes ingesteld'}
				</p>
			{/if}
			<p class="text-xs text-gray-500">
				NUTS-codes worden automatisch ingevuld bij KVK-lookup op basis van de postcode.
			</p>
		</div>

		{#if canEdit}
			<div class="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-3">
				<button
					type="submit"
					disabled={savingDetails}
					class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{#if savingDetails}Opslaan...{:else}Organisatiegegevens opslaan{/if}
				</button>
			</div>
		{/if}
	</form>

	<!-- Organisation type settings -->
	<div>
		<h3 class="text-base font-medium text-gray-900">Type-instellingen</h3>
		<p class="mt-1 text-sm text-gray-500">Organisatietype en aanbestedende dienst configuratie.</p>
	</div>

	<div class="rounded-card border border-gray-200 bg-white p-6 shadow-card space-y-4">
		<div>
			<label for="org-type" class="block text-sm font-medium text-gray-700">
				Organisatietype
			</label>
			<select
				id="org-type"
				bind:value={orgType}
				disabled={!canEdit}
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
					{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
				aria-label="Organisatietype"
			>
				{#each ORGANIZATION_TYPES as t (t)}
					<option value={t}>{ORGANIZATION_TYPE_LABELS[t]}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="authority-type" class="block text-sm font-medium text-gray-700">
				Aanbestedende dienst type
			</label>
			<select
				id="authority-type"
				bind:value={authorityType}
				disabled={!canEdit}
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
					{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
				aria-label="Aanbestedende dienst type"
			>
				<option value="">Niet ingesteld</option>
				{#each CONTRACTING_AUTHORITY_TYPES as t (t)}
					<option value={t}>{CONTRACTING_AUTHORITY_TYPE_LABELS[t]}</option>
				{/each}
			</select>
		</div>

		{#if canEdit}
			<div class="flex justify-end pt-2">
				<button
					type="button"
					on:click={handleSave}
					disabled={saving}
					class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{#if saving}Opslaan...{:else}Opslaan{/if}
				</button>
			</div>
		{/if}
	</div>
</div>

<KvkSearchDialog
	open={showKvkDialog}
	onClose={() => { showKvkDialog = false; }}
	onSelect={handleKvkSelect}
/>
