<script lang="ts">
	import { PROJECT_ROLE_LABELS, PROJECT_ROLES, type ProjectRole } from '$lib/types/enums.js';
	import { invalidateAll } from '$app/navigation';

	export let projectId: string;
	export let availableMembers: {
		profile_id: string;
		profile: { first_name: string; last_name: string; email: string };
	}[] = [];
	export let onClose: (() => void) | null = null;

	let selectedProfileId = '';
	let selectedRoles: ProjectRole[] = [];
	let loading = false;
	let errorMessage = '';

	function toggleRole(role: ProjectRole): void {
		if (selectedRoles.includes(role)) {
			selectedRoles = selectedRoles.filter((r) => r !== role);
		} else {
			selectedRoles = [...selectedRoles, role];
		}
	}

	async function addMember(): Promise<void> {
		if (!selectedProfileId || selectedRoles.length === 0) return;
		loading = true;
		errorMessage = '';

		const response = await fetch(`/api/projects/${projectId}/members`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ profile_id: selectedProfileId, roles: selectedRoles })
		});

		if (response.ok) {
			selectedProfileId = '';
			selectedRoles = [];
			onClose?.();
			await invalidateAll();
		} else {
			const data = await response.json();
			errorMessage = data.message ?? 'Er is een fout opgetreden';
		}
		loading = false;
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
	on:click|self={() => onClose?.()}
>
	<div
		class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200"
		role="dialog"
		aria-modal="true"
		aria-label="Teamlid toevoegen"
	>
		<!-- Header -->
		<div class="mb-5 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">Teamlid toevoegen</h2>
			<button
				type="button"
				on:click={() => onClose?.()}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
				aria-label="Sluiten"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M18 6L6 18" /><path d="M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Form -->
		<div class="space-y-4">
			<div>
				<label for="member-select" class="block text-sm font-medium text-gray-700">
					Organisatielid selecteren
				</label>
				<select
					id="member-select"
					bind:value={selectedProfileId}
					class="mt-1 block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
				>
					<option value="">Selecteer een lid...</option>
					{#each availableMembers as om}
						<option value={om.profile_id}>
							{om.profile.first_name} {om.profile.last_name} ({om.profile.email})
						</option>
					{/each}
				</select>
			</div>
			<fieldset>
				<legend class="block text-sm font-medium text-gray-700">Rollen</legend>
				<div class="mt-2 flex flex-wrap gap-2">
					{#each PROJECT_ROLES as role}
						<button
							type="button"
							on:click={() => toggleRole(role)}
							class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors
								{selectedRoles.includes(role)
									? 'bg-primary-100 text-primary-800 ring-1 ring-primary-300'
									: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
						>
							{PROJECT_ROLE_LABELS[role]}
						</button>
					{/each}
				</div>
			</fieldset>
			{#if errorMessage}
				<p class="text-sm text-error-600" role="alert">{errorMessage}</p>
			{/if}
			<div class="flex items-center justify-end gap-3 pt-2">
				<button
					type="button"
					on:click={() => onClose?.()}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
				>
					Annuleren
				</button>
				<button
					type="button"
					on:click={addMember}
					disabled={!selectedProfileId || selectedRoles.length === 0 || loading}
					class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
				>
					{loading ? 'Bezig...' : 'Toevoegen'}
				</button>
			</div>
		</div>
	</div>
</div>
