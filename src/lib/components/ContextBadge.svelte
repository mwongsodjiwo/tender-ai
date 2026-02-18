<script lang="ts">
	import { activeOrganization, orgColor } from '$stores/organization-context';

	/** Optional extra CSS classes */
	export let className: string = '';
</script>

{#if $activeOrganization}
	{@const color = orgColor($activeOrganization.name)}
	<span
		class="inline-flex items-center gap-1.5 rounded-badge px-2.5 py-0.5 text-xs font-medium {className}"
		style="background-color: {color}20; color: {color}; border: 1px solid {color}40"
		title="Actieve organisatie: {$activeOrganization.name}"
		aria-label="Actieve organisatie: {$activeOrganization.name}"
	>
		<span
			class="inline-block h-2 w-2 rounded-full"
			style="background-color: {color}"
			aria-hidden="true"
		></span>
		<span class="max-w-[120px] truncate">{$activeOrganization.name}</span>
	</span>
{/if}
