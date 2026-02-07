<script lang="ts">
	import { PROJECT_ROLE_LABELS } from '$types';
	import type { ProjectRole } from '$types';

	export let roles: ProjectRole[];
	export let activeRole: ProjectRole;

	function selectRole(role: ProjectRole) {
		activeRole = role;
	}
</script>

{#if roles.length > 1}
	<div class="flex items-center gap-2" role="group" aria-label="Rolkiezer">
		<span class="text-xs font-medium text-gray-500">Actieve rol:</span>
		<div class="flex gap-1">
			{#each roles as role}
				<button
					on:click={() => selectRole(role)}
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors {activeRole === role
						? 'bg-primary-100 text-primary-800 ring-1 ring-primary-300'
						: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
					aria-pressed={activeRole === role}
				>
					{PROJECT_ROLE_LABELS[role]}
				</button>
			{/each}
		</div>
	</div>
{:else if roles.length === 1}
	<span class="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800">
		{PROJECT_ROLE_LABELS[roles[0]]}
	</span>
{/if}
