<script lang="ts">
	import type { Organization } from '$types';
	import {
		activeOrganizationId,
		switchOrganization,
		orgColor
	} from '$stores/organization-context';

	export let organizations: Organization[] = [];
	export let onSwitch: ((orgId: string) => void) | undefined = undefined;

	function handleChange(e: Event) {
		const target = e.currentTarget as HTMLSelectElement;
		const orgId = target.value;
		if (!orgId) return;
		switchOrganization(orgId);
		onSwitch?.(orgId);
	}
</script>

{#if organizations.length > 0}
	<div>
		<span class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
			Organisatie
		</span>
		<div class="relative mt-1 px-1.5">
			<div
				class="pointer-events-none absolute inset-y-0 left-3 flex items-center pl-2"
				aria-hidden="true"
			>
				{#if $activeOrganizationId}
					{@const activeOrg = organizations.find((o) => o.id === $activeOrganizationId)}
					{#if activeOrg}
						<span
							class="inline-block h-2.5 w-2.5 rounded-full"
							style="background-color: {orgColor(activeOrg.name)}"
						></span>
					{/if}
				{/if}
			</div>
			<select
				value={$activeOrganizationId ?? ''}
				on:change={handleChange}
				class="w-full rounded-lg border py-2 pl-7 pr-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1
					{$activeOrganizationId
						? 'border-primary-200 bg-primary-50 focus:border-primary-500 focus:ring-primary-500'
						: 'border-gray-200 bg-white focus:border-primary-500 focus:ring-primary-500'}"
				aria-label="Selecteer een organisatie"
			>
				<option value="" disabled>Kies een organisatie...</option>
				{#each organizations as org (org.id)}
					<option value={org.id}>{org.name}</option>
				{/each}
			</select>
		</div>
	</div>
{/if}
