<!-- Template management settings page -->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import SettingsTemplatesTab from '$components/settings/SettingsTemplatesTab.svelte';

	export let data: PageData;

	let errorMessage = '';
	let successMessage = '';

	function clearMessages(): void {
		errorMessage = '';
		successMessage = '';
	}

	async function handleUpload(formData: FormData): Promise<void> {
		clearMessages();
		try {
			const res = await fetch('/api/templates', { method: 'POST', body: formData });
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Upload mislukt';
				return;
			}
			successMessage = 'Sjabloon succesvol geüpload.';
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}

	async function handleDelete(id: string): Promise<void> {
		clearMessages();
		try {
			const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Verwijderen mislukt';
				return;
			}
			successMessage = 'Sjabloon verwijderd.';
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}

	async function handleSetDefault(id: string): Promise<void> {
		clearMessages();
		try {
			const res = await fetch(`/api/templates/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_default: true })
			});
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Instellen als standaard mislukt';
				return;
			}
			successMessage = 'Sjabloon ingesteld als standaard.';
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}

	function handleDownload(id: string): void {
		window.open(`/api/templates/${id}`, '_blank');
	}
</script>

<svelte:head>
	<title>Sjablonen — Instellingen — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-medium text-gray-900">Documentsjablonen</h2>
		<p class="mt-1 text-sm text-gray-500">
			Upload en beheer .docx sjablonen voor documentgeneratie.
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

		<SettingsTemplatesTab
			templates={data.templates}
			documentTypes={data.documentTypes}
			organizationId={data.organization.id}
			canEdit={data.canEdit}
			onUpload={handleUpload}
			onDelete={handleDelete}
			onSetDefault={handleSetDefault}
			onDownload={handleDownload}
		/>
	{/if}
</div>
