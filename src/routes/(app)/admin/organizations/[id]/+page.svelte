<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { OrganizationRole } from '$types';
	import KvkSearchDialog from '$lib/components/suppliers/KvkSearchDialog.svelte';
	import CodeLookup from '$lib/components/CodeLookup.svelte';

	export let data: PageData;

	const ROLE_LABELS: Record<OrganizationRole, string> = {
		owner: 'Eigenaar',
		admin: 'Beheerder',
		member: 'Lid'
	};

	const ROLE_COLORS: Record<OrganizationRole, string> = {
		owner: 'bg-yellow-100 text-yellow-800',
		admin: 'bg-primary-100 text-primary-800',
		member: 'bg-gray-100 text-gray-800'
	};

	// Organization edit state
	let orgName = data.organization.name;
	let orgDescription = data.organization.description ?? '';
	let kvkNummer = data.organization.kvk_nummer ?? '';
	let handelsnaam = data.organization.handelsnaam ?? '';
	let rechtsvorm = data.organization.rechtsvorm ?? '';
	let straat = data.organization.straat ?? '';
	let postcode = data.organization.postcode ?? '';
	let plaats = data.organization.plaats ?? '';
	let nutsCodes: string[] = [...(data.organization.nuts_codes ?? [])];

	let savingOrg = false;
	let orgSuccess = '';
	let orgError = '';
	let showKvkDialog = false;
	let resolvingNuts = false;

	// Add member state
	let addEmail = '';
	let addRole: OrganizationRole = 'member';
	let addingMember = false;
	let addSuccess = '';
	let addError = '';

	async function resolveNutsFromPostcode(pc: string) {
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
	}) {
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

	async function handleSaveOrg() {
		orgSuccess = '';
		orgError = '';
		savingOrg = true;

		try {
			const response = await fetch(`/api/organizations/${data.organization.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: orgName.trim(),
					description: orgDescription.trim() || undefined,
					kvk_nummer: kvkNummer.trim() || undefined,
					handelsnaam: handelsnaam.trim() || undefined,
					rechtsvorm: rechtsvorm.trim() || undefined,
					straat: straat.trim() || undefined,
					postcode: postcode.trim() || undefined,
					plaats: plaats.trim() || undefined,
					nuts_codes: nutsCodes.length > 0 ? nutsCodes : undefined
				})
			});

			if (!response.ok) {
				const result = await response.json();
				orgError = result.message ?? 'Er is een fout opgetreden.';
				return;
			}

			orgSuccess = 'Organisatie bijgewerkt.';
			await invalidateAll();
		} catch {
			orgError = 'Er is een netwerkfout opgetreden.';
		} finally {
			savingOrg = false;
		}
	}

	async function handleAddMember() {
		addSuccess = '';
		addError = '';

		if (!addEmail.trim()) {
			addError = 'E-mailadres is verplicht.';
			return;
		}

		addingMember = true;

		try {
			const response = await fetch(`/api/organizations/${data.organization.id}/members`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: addEmail.trim(),
					role: addRole
				})
			});

			if (!response.ok) {
				const result = await response.json();
				addError = result.message ?? 'Er is een fout opgetreden.';
				return;
			}

			addSuccess = `${addEmail.trim()} toegevoegd als ${ROLE_LABELS[addRole].toLowerCase()}.`;
			addEmail = '';
			addRole = 'member';
			await invalidateAll();
		} catch {
			addError = 'Er is een netwerkfout opgetreden.';
		} finally {
			addingMember = false;
		}
	}

	async function handleUpdateRole(memberId: string, newRole: string) {
		try {
			const response = await fetch(`/api/organizations/${data.organization.id}/members/${memberId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: newRole })
			});

			if (!response.ok) {
				const result = await response.json();
				alert(result.message ?? 'Er is een fout opgetreden bij het wijzigen van de rol.');
				return;
			}

			await invalidateAll();
		} catch {
			alert('Er is een netwerkfout opgetreden.');
		}
	}

	async function handleRemoveMember(memberId: string, memberName: string) {
		if (!confirm(`Weet je zeker dat je ${memberName} wilt verwijderen uit deze organisatie?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/organizations/${data.organization.id}/members/${memberId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const result = await response.json();
				alert(result.message ?? 'Er is een fout opgetreden bij het verwijderen.');
				return;
			}

			await invalidateAll();
		} catch {
			alert('Er is een netwerkfout opgetreden.');
		}
	}
</script>

<div class="space-y-8">
	<div class="flex items-center gap-3">
		<a href="/admin/organizations" class="text-sm text-gray-500 hover:text-gray-700">&larr; Terug</a>
		<h2 class="text-lg font-medium text-gray-900">{data.organization.name}</h2>
	</div>

	<!-- Edit organization -->
	<form
		on:submit|preventDefault={handleSaveOrg}
		class="rounded-card border border-gray-200 bg-white shadow-card transition hover:shadow-card-hover"
	>
		<div class="space-y-4 p-6">
			<h3 class="text-base font-medium text-gray-900">Organisatiegegevens</h3>

			{#if orgSuccess}
				<div class="rounded-badge bg-success-50 p-3" role="status">
					<p class="text-sm text-success-700">{orgSuccess}</p>
				</div>
			{/if}

			{#if orgError}
				<div class="rounded-badge bg-error-50 p-3" role="alert">
					<p class="text-sm text-error-700">{orgError}</p>
				</div>
			{/if}

			<div>
				<label for="org-name" class="block text-sm font-medium text-gray-700">Naam</label>
				<input
					id="org-name"
					type="text"
					bind:value={orgName}
					required
					minlength={2}
					maxlength={200}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
				/>
			</div>

			<div>
				<label for="org-slug" class="block text-sm font-medium text-gray-700">Slug</label>
				<input
					id="org-slug"
					type="text"
					value={data.organization.slug}
					readonly
					disabled
					class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm sm:text-sm"
				/>
			</div>

			<div>
				<label for="org-description" class="block text-sm font-medium text-gray-700">Beschrijving</label>
				<textarea
					id="org-description"
					bind:value={orgDescription}
					maxlength={1000}
					rows="3"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
				></textarea>
			</div>
		</div>

		<!-- KVK & Adresgegevens -->
		<div class="space-y-4 border-t border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<h3 class="text-base font-medium text-gray-900">KVK & Adresgegevens</h3>
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
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="org-kvk" class="block text-sm font-medium text-gray-700">KVK-nummer</label>
					<input
						id="org-kvk"
						type="text"
						bind:value={kvkNummer}
						maxlength={8}
						placeholder="12345678"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					/>
				</div>
				<div>
					<label for="org-handelsnaam" class="block text-sm font-medium text-gray-700">Handelsnaam</label>
					<input
						id="org-handelsnaam"
						type="text"
						bind:value={handelsnaam}
						maxlength={300}
						placeholder="Officiële handelsnaam"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					/>
				</div>
			</div>

			<div>
				<label for="org-rechtsvorm" class="block text-sm font-medium text-gray-700">Rechtsvorm</label>
				<input
					id="org-rechtsvorm"
					type="text"
					bind:value={rechtsvorm}
					maxlength={100}
					placeholder="Bijv. Besloten Vennootschap"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
				/>
			</div>

			<div>
				<label for="org-straat" class="block text-sm font-medium text-gray-700">Straat + huisnummer</label>
				<input
					id="org-straat"
					type="text"
					bind:value={straat}
					maxlength={200}
					placeholder="Hoofdstraat 1"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
				/>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="org-postcode" class="block text-sm font-medium text-gray-700">Postcode</label>
					<input
						id="org-postcode"
						type="text"
						bind:value={postcode}
						maxlength={7}
						placeholder="1234 AB"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					/>
				</div>
				<div>
					<label for="org-plaats" class="block text-sm font-medium text-gray-700">Plaats</label>
					<input
						id="org-plaats"
						type="text"
						bind:value={plaats}
						maxlength={100}
						placeholder="Amsterdam"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					/>
				</div>
			</div>
		</div>

		<!-- NUTS-codes -->
		<div class="space-y-4 border-t border-gray-200 p-6">
			<div class="flex items-center gap-2">
				<h3 class="text-base font-medium text-gray-900">NUTS-codes</h3>
				{#if resolvingNuts}
					<span class="text-xs text-gray-400">Bepalen op basis van postcode...</span>
				{/if}
			</div>
			<CodeLookup
				apiUrl="/api/nuts"
				selected={nutsCodes}
				placeholder="Zoek NUTS-code of regio..."
				on:change={(e) => { nutsCodes = e.detail; }}
			/>
			<p class="text-xs text-gray-500">
				NUTS-codes worden automatisch ingevuld bij KVK-lookup op basis van de postcode.
			</p>
		</div>

		<div class="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-3">
			<button
				type="submit"
				disabled={savingOrg}
				class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if savingOrg}
					Opslaan...
				{:else}
					Opslaan
				{/if}
			</button>
		</div>
	</form>

	<!-- Members section -->
	<div class="rounded-card border border-gray-200 bg-white shadow-card transition hover:shadow-card-hover">
		<div class="p-6">
			<h3 class="text-base font-medium text-gray-900">Leden</h3>
			<p class="mt-1 text-sm text-gray-500">Beheer de leden van deze organisatie.</p>
		</div>

		{#if data.members.length === 0}
			<div class="border-t border-gray-200 px-6 py-8 text-center">
				<p class="text-sm text-gray-500">Geen leden gevonden.</p>
			</div>
		{:else}
			<div class="border-t border-gray-200">
				<ul class="divide-y divide-gray-200" role="list" aria-label="Organisatieleden">
					{#each data.members as member (member.id)}
						<li class="flex items-center justify-between px-6 py-4">
							<div class="flex items-center">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
									{member.profile?.first_name?.charAt(0)?.toUpperCase() ?? '?'}
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-900">
										{member.profile?.first_name ?? ''} {member.profile?.last_name ?? ''}
									</p>
									<p class="text-sm text-gray-500">
										{member.profile?.email ?? ''}
									</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<select
									value={member.role}
									on:change={(e) => handleUpdateRole(member.id, e.currentTarget.value)}
									class="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
								>
									<option value="owner">Eigenaar</option>
									<option value="admin">Beheerder</option>
									<option value="member">Lid</option>
								</select>
								<button
									on:click={() => handleRemoveMember(member.id, member.profile ? `${member.profile.first_name} ${member.profile.last_name}` : 'dit lid')}
									class="rounded-md p-1.5 text-gray-500 hover:bg-error-50 hover:text-error-600"
									title="Lid verwijderen"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Add member form -->
		<div class="border-t border-gray-200 bg-gray-50 p-6">
			<h4 class="text-sm font-medium text-gray-900">Lid toevoegen</h4>

			{#if addSuccess}
				<div class="mt-3 rounded-badge bg-success-50 p-3" role="status">
					<p class="text-sm text-success-700">{addSuccess}</p>
				</div>
			{/if}

			{#if addError}
				<div class="mt-3 rounded-badge bg-error-50 p-3" role="alert">
					<p class="text-sm text-error-700">{addError}</p>
				</div>
			{/if}

			<form on:submit|preventDefault={handleAddMember} class="mt-4 flex gap-3">
				<div class="flex-1">
					<label for="add-email" class="sr-only">E-mailadres</label>
					<input
						id="add-email"
						type="email"
						bind:value={addEmail}
						required
						placeholder="E-mailadres van nieuw lid"
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					/>
				</div>
				<div>
					<label for="add-role" class="sr-only">Rol</label>
					<select
						id="add-role"
						bind:value={addRole}
						class="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					>
						<option value="member">Lid</option>
						<option value="admin">Beheerder</option>
						<option value="owner">Eigenaar</option>
					</select>
				</div>
				<button
					type="submit"
					disabled={addingMember}
					class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if addingMember}
						Toevoegen...
					{:else}
						Toevoegen
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>

<!-- KVK Search Dialog -->
<KvkSearchDialog
	open={showKvkDialog}
	onClose={() => { showKvkDialog = false; }}
	onSelect={handleKvkSelect}
/>
