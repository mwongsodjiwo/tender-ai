<!-- Organization settings page — tabbed UI: Algemeen, Retentie, Drempelwaarden, Relaties -->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import SettingsGeneralTab from '$components/settings/SettingsGeneralTab.svelte';
	import SettingsRetentionTab from '$components/settings/SettingsRetentionTab.svelte';
	import SettingsThresholdsTab from '$components/settings/SettingsThresholdsTab.svelte';
	import SettingsRelationshipsTab from '$components/settings/SettingsRelationshipsTab.svelte';

	export let data: PageData;

	const TABS = [
		{ key: 'general', label: 'Algemeen' },
		{ key: 'retention', label: 'Retentie' },
		{ key: 'thresholds', label: 'Drempelwaarden' },
		{ key: 'relationships', label: 'Relaties' }
	] as const;

	type TabKey = (typeof TABS)[number]['key'];

	const EDITABLE_ROLES: ReadonlyArray<string> = ['owner', 'admin'];

	let activeTab: TabKey = 'general';
	let errorMessage = '';
	let successMessage = '';

	$: canEdit = (data.currentMemberRole !== null && EDITABLE_ROLES.includes(data.currentMemberRole))
		|| data.isSuperadmin;

	function clearMessages(): void {
		errorMessage = '';
		successMessage = '';
	}

	async function handleSaveOrgType(payload: {
		organization_type: string;
		aanbestedende_dienst_type: string | null;
	}): Promise<void> {
		if (!data.organization) return;
		clearMessages();
		try {
			const res = await fetch(`/api/organizations/${data.organization.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Opslaan mislukt';
				return;
			}
			successMessage = 'Algemene instellingen opgeslagen.';
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}

	async function handleSaveDetails(payload: Record<string, unknown>): Promise<void> {
		if (!data.organization) return;
		clearMessages();
		try {
			const res = await fetch(`/api/organizations/${data.organization.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Opslaan mislukt';
				return;
			}
			successMessage = 'Organisatiegegevens opgeslagen.';
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}

	async function handleSaveSettings(payload: Record<string, unknown>): Promise<void> {
		if (!data.organization) return;
		clearMessages();
		try {
			const res = await fetch(`/api/organizations/${data.organization.id}/settings`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Opslaan mislukt';
				return;
			}
			successMessage = 'Instellingen opgeslagen.';
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}

	async function handleAddRelationship(payload: {
		target_organization_id: string;
		relationship_type: string;
		contract_reference: string;
	}): Promise<void> {
		if (!data.organization) return;
		clearMessages();
		try {
			const res = await fetch(`/api/organizations/${data.organization.id}/relationships`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Relatie toevoegen mislukt';
				return;
			}
			successMessage = 'Relatie toegevoegd.';
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}

	async function handleUpdateRelationship(
		id: string, payload: Record<string, unknown>
	): Promise<void> {
		if (!data.organization) return;
		clearMessages();
		try {
			const res = await fetch(
				`/api/organizations/${data.organization.id}/relationships/${id}`,
				{ method: 'PATCH', headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload) }
			);
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Relatie wijzigen mislukt';
				return;
			}
			successMessage = 'Relatie bijgewerkt.';
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}
</script>

<svelte:head>
	<title>Organisatie-instellingen — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-medium text-gray-900">Organisatie-instellingen</h2>
		<p class="mt-1 text-sm text-gray-500">
			Beheer de instellingen van uw organisatie.
		</p>
	</div>

	{#if !data.organization}
		<div class="rounded-card border-2 border-dashed border-gray-300 p-12 text-center">
			<h3 class="text-sm font-semibold text-gray-900">Geen organisatie</h3>
			<p class="mt-1 text-sm text-gray-500">
				U bent nog niet aan een organisatie gekoppeld.
			</p>
		</div>
	{:else}
		{#if errorMessage}
			<div class="rounded-card bg-error-50 p-4" role="alert">
				<p class="text-sm text-error-700">{errorMessage}</p>
			</div>
		{/if}

		{#if successMessage}
			<div class="rounded-card bg-success-50 p-4" role="status">
				<p class="text-sm text-success-700">{successMessage}</p>
			</div>
		{/if}

		{#if data.loadError}
			<div class="rounded-card bg-error-50 p-4" role="alert">
				<p class="text-sm text-error-700">{data.loadError}</p>
			</div>
		{/if}

		<!-- Tab navigation -->
		<nav class="border-b border-gray-200" aria-label="Instellingen tabs">
			<div class="-mb-px flex space-x-6">
				{#each TABS as tab (tab.key)}
					<button
						type="button"
						on:click={() => { activeTab = tab.key; clearMessages(); }}
						class="whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium
							{activeTab === tab.key
								? 'border-primary-500 text-primary-600'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						aria-selected={activeTab === tab.key}
						role="tab"
					>
						{tab.label}
					</button>
				{/each}
			</div>
		</nav>

		<!-- Tab content -->
		<div role="tabpanel" aria-label={TABS.find((t) => t.key === activeTab)?.label ?? ''}>
			{#if activeTab === 'general'}
				<SettingsGeneralTab organization={data.organization} {canEdit} onSave={handleSaveOrgType} onSaveDetails={handleSaveDetails} />
			{:else if activeTab === 'retention'}
				<SettingsRetentionTab settings={data.settings} retentionProfiles={data.retentionProfiles}
					{canEdit} onSave={handleSaveSettings} />
			{:else if activeTab === 'thresholds'}
				<SettingsThresholdsTab settings={data.settings} {canEdit} onSave={handleSaveSettings} />
			{:else if activeTab === 'relationships'}
				<SettingsRelationshipsTab relationships={data.relationships} {canEdit}
					onAdd={handleAddRelationship} onUpdate={handleUpdateRelationship} />
			{/if}
		</div>
	{/if}
</div>
