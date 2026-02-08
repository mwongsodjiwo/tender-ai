<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	let showForm = false;
	let orgName = '';
	let orgSlug = '';
	let orgDescription = '';
	let saving = false;
	let errorMessage = '';
	let successMessage = '';

	function generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function handleNameInput() {
		orgSlug = generateSlug(orgName);
	}

	async function handleCreateOrg() {
		errorMessage = '';
		successMessage = '';

		if (!orgName.trim() || !orgSlug.trim()) {
			errorMessage = 'Naam en slug zijn verplicht.';
			return;
		}

		saving = true;

		try {
			const response = await fetch('/api/organizations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: orgName.trim(),
					slug: orgSlug.trim(),
					description: orgDescription.trim() || undefined
				})
			});

			if (!response.ok) {
				const result = await response.json();
				errorMessage = result.message ?? 'Er is een fout opgetreden.';
				return;
			}

			successMessage = `Organisatie "${orgName.trim()}" aangemaakt.`;
			orgName = '';
			orgSlug = '';
			orgDescription = '';
			showForm = false;
			await invalidateAll();
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-medium text-gray-900">Organisaties</h2>
			<p class="mt-1 text-sm text-gray-500">Beheer alle organisaties op het platform.</p>
		</div>
		<button
			on:click={() => (showForm = !showForm)}
			class="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
		>
			{showForm ? 'Annuleren' : 'Nieuwe organisatie'}
		</button>
	</div>

	{#if successMessage}
		<div class="rounded-md bg-green-50 p-4" role="status">
			<p class="text-sm text-green-700">{successMessage}</p>
		</div>
	{/if}

	{#if showForm}
		<form
			on:submit|preventDefault={handleCreateOrg}
			class="rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-sm"
		>
			<h3 class="text-base font-medium text-gray-900">Nieuwe organisatie</h3>

			{#if errorMessage}
				<div class="mt-3 rounded-md bg-red-50 p-3" role="alert">
					<p class="text-sm text-red-700">{errorMessage}</p>
				</div>
			{/if}

			<div class="mt-4 space-y-4">
				<div>
					<label for="org-name" class="block text-sm font-medium text-gray-700">Naam</label>
					<input
						id="org-name"
						type="text"
						bind:value={orgName}
						on:input={handleNameInput}
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
						bind:value={orgSlug}
						required
						minlength={2}
						maxlength={100}
						pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					/>
					<p class="mt-1 text-xs text-gray-400">Alleen kleine letters, cijfers en koppeltekens.</p>
				</div>
				<div>
					<label for="org-description" class="block text-sm font-medium text-gray-700">Beschrijving</label>
					<textarea
						id="org-description"
						bind:value={orgDescription}
						maxlength={1000}
						rows="2"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					/>
				</div>
			</div>

			<div class="mt-4 flex justify-end">
				<button
					type="submit"
					disabled={saving}
					class="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if saving}
						Aanmaken...
					{:else}
						Aanmaken
					{/if}
				</button>
			</div>
		</form>
	{/if}

	<!-- Organizations table -->
	{#if data.organizations.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<h3 class="mt-2 text-sm font-semibold text-gray-900">Geen organisaties</h3>
			<p class="mt-1 text-sm text-gray-500">Er zijn nog geen organisaties aangemaakt.</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-sm">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Naam</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Slug</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Leden</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Aangemaakt</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each data.organizations as org (org.id)}
						<tr class="hover:bg-gray-50">
							<td class="whitespace-nowrap px-6 py-4">
								<a href="/admin/organizations/{org.id}" class="text-sm font-medium text-primary-600 hover:text-primary-800">
									{org.name}
								</a>
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{org.slug}</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{org.memberCount}</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
								{new Date(org.created_at).toLocaleDateString('nl-NL')}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
