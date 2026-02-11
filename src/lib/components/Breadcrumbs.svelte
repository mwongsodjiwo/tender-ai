<script lang="ts">
	export let items: { label: string; href?: string }[];
</script>

<nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-sm text-gray-500">
	{#each items as item, i}
		{#if i > 0}
			<svg class="h-3.5 w-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		{/if}
		{#if item.href}
			<a href={item.href} class="hover:text-gray-700 transition-colors truncate">{item.label}</a>
		{:else}
			<span class="font-medium text-gray-900 truncate" aria-current="page">{item.label}</span>
		{/if}
	{/each}
</nav>
