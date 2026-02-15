<script lang="ts">
	interface FilterOption {
		value: string;
		label: string;
	}

	interface Filter {
		key: string;
		label: string;
		options: FilterOption[];
	}

	export let placeholder: string = 'Zoeken...';
	export let filters: Filter[] = [];
	export let onSearch: (query: string) => void;
	export let onFilter: (key: string, value: string) => void;

	let searchQuery = '';

	function handleSearch() {
		onSearch(searchQuery);
	}

	function handleFilterChange(key: string, event: Event) {
		const target = event.target as HTMLSelectElement;
		onFilter(key, target.value);
	}
</script>

<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
	<div class="relative flex-1">
		<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
			<svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
		</div>
		<input
			type="search"
			bind:value={searchQuery}
			on:input={handleSearch}
			{placeholder}
			class="block w-full rounded-card border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			aria-label={placeholder}
		/>
	</div>
	{#each filters as filter}
		<div class="shrink-0">
			<label for="filter-{filter.key}" class="sr-only">{filter.label}</label>
			<select
				id="filter-{filter.key}"
				class="block rounded-card border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
				on:change={(e) => handleFilterChange(filter.key, e)}
			>
				<option value="">{filter.label}</option>
				{#each filter.options as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
	{/each}
</div>
