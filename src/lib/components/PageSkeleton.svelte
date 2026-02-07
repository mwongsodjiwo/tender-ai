<!-- Reusable page skeleton/loading placeholder component -->
<script lang="ts">
	export let lines: number = 3;
	export let showHeader: boolean = true;
	export let showCards: boolean = false;

	const CARD_COUNT = 3;
</script>

<div class="animate-pulse space-y-6" aria-hidden="true">
	{#if showHeader}
		<div class="flex items-center justify-between">
			<div class="h-8 w-48 rounded bg-gray-200"></div>
			<div class="h-10 w-32 rounded bg-gray-200"></div>
		</div>
	{/if}

	{#if showCards}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each Array(CARD_COUNT) as _, i}
				<div class="rounded-lg border border-gray-200 bg-white p-6">
					<div class="h-5 w-3/4 rounded bg-gray-200"></div>
					<div class="mt-3 h-4 w-full rounded bg-gray-200"></div>
					<div class="mt-2 h-4 w-2/3 rounded bg-gray-200"></div>
					<div class="mt-4 h-3 w-1/3 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			{#each Array(lines) as _, i}
				<div class="mt-3 h-4 rounded bg-gray-200 {i === lines - 1 ? 'w-2/3' : 'w-full'}"></div>
			{/each}
		</div>
	{/if}
</div>
