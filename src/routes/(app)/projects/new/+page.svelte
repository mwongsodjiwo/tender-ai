<script lang="ts">
	import { goto } from '$app/navigation';
	import { PROCEDURE_TYPE_LABELS } from '$types';
	import type { ProcedureType } from '$types';
	import type { PageData } from './$types';

	export let data: PageData;

	let name = '';
	let description = '';
	let procedureType = '';
	let organizationId = data.organizations[0]?.id ?? '';
	let loading = false;
	let errorMessage = '';

	const procedureOptions = Object.entries(PROCEDURE_TYPE_LABELS) as [ProcedureType, string][];

	async function handleSubmit() {
		loading = true;
		errorMessage = '';

		const response = await fetch('/api/projects', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				organization_id: organizationId,
				name,
				description: description || undefined,
				procedure_type: procedureType || undefined
			})
		});

		const result = await response.json();

		if (!response.ok) {
			errorMessage = result.message ?? 'Er is een fout opgetreden';
			loading = false;
			return;
		}

		// Redirect to briefing for the new project
		goto(`/projects/${result.data.id}/briefing`);
	}
</script>

<svelte:head>
	<title>Nieuw project — Tendermanager</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	<div class="mb-6">
		<a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">
			&larr; Terug naar dashboard
		</a>
	</div>

	<h1 class="text-2xl font-semibold text-gray-900">Nieuw aanbestedingsproject</h1>
	<p class="mt-2 text-sm text-gray-600">
		Vul de basisgegevens in en start vervolgens de AI-begeleide briefing.
	</p>

	<form on:submit|preventDefault={handleSubmit} class="mt-8 space-y-6">
		{#if errorMessage}
			<div class="rounded-badge bg-error-50 p-4" role="alert">
				<p class="text-sm text-error-700">{errorMessage}</p>
			</div>
		{/if}

		<div>
			<label for="organization" class="block text-sm font-medium text-gray-700">Organisatie</label>
			{#if data.organizations.length === 0}
				<p class="mt-1 text-sm text-error-600">
					U bent nog geen lid van een organisatie. Maak eerst een organisatie aan.
				</p>
			{:else}
			<select
				id="organization"
				bind:value={organizationId}
				required
				class="mt-1 block w-full rounded-md border-gray-300 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
			>
					{#each data.organizations as org}
						<option value={org.id}>{org.name}</option>
					{/each}
				</select>
			{/if}
		</div>

		<div>
			<label for="name" class="block text-sm font-medium text-gray-700">Projectnaam</label>
		<input
			id="name"
			type="text"
			required
			bind:value={name}
			placeholder="Bijv. Aanbesteding ICT-dienstverlening 2026"
			class="mt-1 block w-full rounded-md border-gray-300 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
		/>
		</div>

		<div>
			<label for="description" class="block text-sm font-medium text-gray-700">
				Korte beschrijving
				<span class="font-normal text-gray-500">(optioneel)</span>
			</label>
			<textarea
				id="description"
				rows="3"
				bind:value={description}
				placeholder="Een korte beschrijving van het project..."
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
			></textarea>
		</div>

		<div>
			<label for="procedure" class="block text-sm font-medium text-gray-700">
				Aanbestedingsprocedure
				<span class="font-normal text-gray-500">(optioneel, kan later worden gekozen)</span>
			</label>
		<select
			id="procedure"
			bind:value={procedureType}
			class="mt-1 block w-full rounded-md border-gray-300 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
		>
				<option value="">Nog niet gekozen</option>
				{#each procedureOptions as [value, label]}
					<option {value}>{label}</option>
				{/each}
			</select>
		</div>

		<div class="flex justify-end space-x-3">
			<a
				href="/dashboard"
				class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
			>
				Annuleren
			</a>
			<button
				type="submit"
				disabled={loading || !organizationId || !name}
				class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
			>
				{loading ? 'Bezig...' : 'Aanmaken en briefing starten'}
			</button>
		</div>
	</form>
</div>
