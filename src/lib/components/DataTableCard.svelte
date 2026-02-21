<script lang="ts">
	export let searchPlaceholder = 'Zoeken';
	export let searchLabel = 'Zoeken';
	export let searchQuery = '';
	export let showFilter = false;
	export let showFilterButton = true;
	export let showOptionsButton = true;
	export let scrollable = false;
	export let rowCount = 0;

	$: recordLabel = rowCount === 1 ? '1 record' : `${rowCount} records`;
</script>

<div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-200" class:flex={scrollable} class:flex-col={scrollable} class:overflow-hidden={scrollable}>
	<!-- Toolbar -->
	<div class="flex items-center gap-3 border-b border-gray-100 px-5 py-3 shrink-0">
		<div class="relative flex-1 max-w-xs">
			<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				type="search"
				bind:value={searchQuery}
				placeholder={searchPlaceholder}
				class="block w-full rounded-full border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
				aria-label={searchLabel}
			/>
		</div>
		{#if showFilterButton}
			<button
				type="button"
				on:click={() => (showFilter = !showFilter)}
				class="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
			>
				<svg class="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M2 5h20" /><path d="M6 12h12" /><path d="M9 19h6" />
				</svg>
				Filter
			</button>
		{/if}
		{#if showOptionsButton}
			<div class="ml-auto">
				<button
					type="button"
					class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
					aria-label="Meer opties"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
					</svg>
				</button>
			</div>
		{/if}
		<slot name="toolbar-extra" />
	</div>

	<!-- Filter panel -->
	{#if showFilter}
		<div class="border-b border-gray-100 bg-gray-50/50 px-5 py-3 shrink-0">
			<slot name="filter" />
		</div>
	{/if}

	<!-- Table content -->
	{#if scrollable}
		<div class="scroll-area flex-1 min-h-0 overflow-y-auto">
			<slot />
		</div>
	{:else}
		<slot />
	{/if}

	<!-- Footer — outside scroll-area so it stays visible -->
	{#if rowCount > 0}
		<div class="shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-3">
			<p class="text-xs text-gray-900">{recordLabel}</p>
		</div>
	{/if}
</div>

<style>
	/* Reserveer scrollbar-ruimte zodat content niet verspringt */
	.scroll-area {
		scrollbar-gutter: stable;
	}

	/* Firefox: altijd thin, transparante thumb bij rust */
	.scroll-area {
		scrollbar-width: thin;
		scrollbar-color: transparent transparent;
	}
	.scroll-area:hover,
	.scroll-area:active {
		scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
	}

	/* Webkit (Chrome/Safari): overlay scrollbar */
	.scroll-area::-webkit-scrollbar {
		width: 6px;
		background: transparent;
	}
	.scroll-area::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 3px;
	}
	.scroll-area:hover::-webkit-scrollbar-thumb,
	.scroll-area:active::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
	}
</style>
