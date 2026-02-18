<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let label = '';
	export let apiUrl: '/api/cpv' | '/api/nuts';
	export let selected: string[] = [];
	export let placeholder = 'Zoek op code of omschrijving...';
	export let disabled = false;

	const dispatch = createEventDispatcher<{ change: string[] }>();

	type ResultItem = {
		code: string;
		description_nl?: string;
		label_nl?: string;
	};

	let query = '';
	let results: ResultItem[] = [];
	let loading = false;
	let open = false;
	let debounceTimer: ReturnType<typeof setTimeout>;
	let inputEl: HTMLInputElement;

	function itemLabel(item: ResultItem): string {
		return item.description_nl ?? item.label_nl ?? item.code;
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		const q = query.trim();
		if (q.length < 2) {
			results = [];
			open = false;
			return;
		}
		debounceTimer = setTimeout(() => fetchResults(q), 250);
	}

	async function fetchResults(search: string) {
		loading = true;
		open = true;
		try {
			const params = new URLSearchParams({ search, limit: '15' });
			const res = await fetch(`${apiUrl}?${params}`);
			if (!res.ok) {
				results = [];
				return;
			}
			const json = await res.json();
			results = (json.data?.items ?? []) as ResultItem[];
			open = results.length > 0;
		} finally {
			loading = false;
		}
	}

	function selectItem(item: ResultItem) {
		if (!selected.includes(item.code)) {
			selected = [...selected, item.code];
			dispatch('change', selected);
		}
		query = '';
		results = [];
		open = false;
		inputEl?.focus();
	}

	function removeCode(code: string) {
		selected = selected.filter((c) => c !== code);
		dispatch('change', selected);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Backspace' && query === '' && selected.length > 0) {
			removeCode(selected[selected.length - 1]);
		}
		if (event.key === 'Escape') {
			open = false;
			query = '';
		}
	}

	function handleBlur() {
		// Delay so click on dropdown item registers first
		setTimeout(() => { open = false; }, 200);
	}
</script>

{#if label}
	<label class="block text-sm font-medium text-gray-700">{label}</label>
{/if}

<div class="relative mt-1">
	<!-- Selected tags + input -->
	<div
		class="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 shadow-sm
			focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500
			{disabled ? 'opacity-50 cursor-not-allowed' : ''}"
	>
		{#each selected as code (code)}
			<span class="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
				{code}
				{#if !disabled}
					<button
						type="button"
						on:click={() => removeCode(code)}
						class="ml-0.5 text-primary-400 hover:text-primary-600"
						aria-label="Verwijder {code}"
					>
						<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</span>
		{/each}

		{#if !disabled}
			<input
				bind:this={inputEl}
				bind:value={query}
				on:input={handleInput}
				on:keydown={handleKeydown}
				on:focus={handleInput}
				on:blur={handleBlur}
				type="text"
				class="min-w-[120px] flex-1 border-none bg-transparent py-0.5 text-sm outline-none placeholder:text-gray-400"
				{placeholder}
			/>
		{/if}
	</div>

	<!-- Dropdown results -->
	{#if open && !disabled}
		<ul class="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
			{#if loading}
				<li class="px-3 py-2 text-sm text-gray-400">Zoeken...</li>
			{/if}
			{#each results as item (item.code)}
				{@const isSelected = selected.includes(item.code)}
				<li>
					<button
						type="button"
						on:mousedown|preventDefault={() => selectItem(item)}
						class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors
							{isSelected ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-900'}"
						disabled={isSelected}
					>
						<span class="shrink-0 font-mono text-xs text-gray-500">{item.code}</span>
						<span class="truncate">{itemLabel(item)}</span>
						{#if isSelected}
							<svg class="ml-auto h-4 w-4 shrink-0 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</button>
				</li>
			{/each}
			{#if !loading && results.length === 0}
				<li class="px-3 py-2 text-sm text-gray-400">Geen resultaten</li>
			{/if}
		</ul>
	{/if}
</div>
