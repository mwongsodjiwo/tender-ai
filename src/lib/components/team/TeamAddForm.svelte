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

<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
	<div class="space-y-3">
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
						class="rounded-full px-3 py-1 text-xs font-medium transition-colors
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
		<button
			type="button"
			on:click={addMember}
			disabled={!selectedProfileId || selectedRoles.length === 0 || loading}
			class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
		>
			{loading ? 'Bezig...' : 'Toevoegen'}
		</button>
	</div>
</div>
