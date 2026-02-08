<script lang="ts">
	import { PROCEDURE_TYPE_LABELS, PROCEDURE_TYPES, type TenderNedItem } from '$types';

	let query = '';
	let procedureType = '';
	let searching = false;
	let results: TenderNedItem[] = [];
	let totalCount = 0;
	let currentOffset = 0;
	let hasSearched = false;

	const PAGE_SIZE = 10;

	async function search(offset: number = 0): Promise<void> {
		if (query.trim().length < 2) return;

		searching = true;
		currentOffset = offset;

		const params = new URLSearchParams({
			query: query.trim(),
			limit: String(PAGE_SIZE),
			offset: String(offset)
		});

		if (procedureType) {
			params.set('procedure_type', procedureType);
		}

		try {
			const response = await fetch(`/api/tenderned?${params.toString()}`);

			if (response.ok) {
				const data = await response.json();
				results = data.data.items;
				totalCount = data.data.total;
			}
		} finally {
			searching = false;
			hasSearched = true;
		}
	}

	function handleSubmit(): void {
		search(0);
	}

	function nextPage(): void {
		search(currentOffset + PAGE_SIZE);
	}

	function prevPage(): void {
		search(Math.max(0, currentOffset - PAGE_SIZE));
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatValue(value: number | null, currency: string | null): string {
		if (!value) return '-';
		return new Intl.NumberFormat('nl-NL', {
			style: 'currency',
			currency: currency ?? 'EUR',
			maximumFractionDigits: 0
		}).format(value);
	}

	$: currentPage = Math.floor(currentOffset / PAGE_SIZE) + 1;
	$: totalPages = Math.ceil(totalCount / PAGE_SIZE);
</script>

<div class="space-y-4">
	<!-- Search form -->
	<form on:submit|preventDefault={handleSubmit} class="flex flex-wrap gap-3">
		<div class="flex-1">
			<label for="tenderned-query" class="sr-only">Zoek in TenderNed</label>
			<input
				id="tenderned-query"
				type="search"
				bind:value={query}
				placeholder="Zoek op trefwoord, organisatie of CPV-code..."
				class="block w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			/>
		</div>

		<div>
			<label for="tenderned-procedure" class="sr-only">Procedure</label>
			<select
				id="tenderned-procedure"
				bind:value={procedureType}
				class="block rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			>
				<option value="">Alle procedures</option>
				{#each PROCEDURE_TYPES as pt}
					<option value={pt}>{PROCEDURE_TYPE_LABELS[pt]}</option>
				{/each}
			</select>
		</div>

		<button
			type="submit"
			disabled={searching || query.trim().length < 2}
			class="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if searching}
				<svg class="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
				Zoeken...
			{:else}
				Zoeken
			{/if}
		</button>
	</form>

	<!-- Results -->
	{#if !hasSearched}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
			<svg class="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
			</svg>
			<p class="mt-2 text-sm font-medium text-gray-900">Zoek in TenderNed</p>
			<p class="mt-1 text-sm text-gray-500">Vind eerder gepubliceerde aanbestedingen als referentie.</p>
		</div>
	{:else if results.length === 0}
		<div class="rounded-lg bg-gray-50 p-8 text-center">
			<p class="text-sm text-gray-500">Geen resultaten gevonden voor &ldquo;{query}&rdquo;</p>
		</div>
	{:else}
		<div class="text-sm text-gray-500">
			{totalCount} resultaten gevonden
		</div>

		<ul class="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white transition hover:shadow-sm">
			{#each results as item}
				<li class="px-6 py-4">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<h4 class="text-sm font-medium text-gray-900">{item.title}</h4>
							{#if item.contracting_authority}
								<p class="mt-0.5 text-xs text-gray-500">{item.contracting_authority}</p>
							{/if}
							{#if item.description}
								<p class="mt-1 line-clamp-2 text-sm text-gray-600">{item.description}</p>
							{/if}
						</div>
						{#if item.source_url}
							<a
								href={item.source_url}
								target="_blank"
								rel="noopener noreferrer"
								class="ml-4 flex-shrink-0 text-xs text-primary-600 hover:text-primary-800"
								aria-label="Bekijk op TenderNed"
							>
								Bekijk &rarr;
							</a>
						{/if}
					</div>

					<div class="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
						{#if item.procedure_type}
							<span class="rounded bg-primary-50 px-2 py-0.5 text-primary-700">
								{PROCEDURE_TYPE_LABELS[item.procedure_type] ?? item.procedure_type}
							</span>
						{/if}
						<span>Gepubliceerd: {formatDate(item.publication_date)}</span>
						{#if item.estimated_value}
							<span>Waarde: {formatValue(item.estimated_value, item.currency)}</span>
						{/if}
						{#if item.cpv_codes && item.cpv_codes.length > 0}
							<span>CPV: {item.cpv_codes.slice(0, 3).join(', ')}</span>
						{/if}
					</div>
				</li>
			{/each}
		</ul>

		<!-- Pagination -->
		{#if totalPages > 1}
			<nav class="flex items-center justify-between" aria-label="Paginering">
				<button
					type="button"
					on:click={prevPage}
					disabled={currentOffset === 0}
					class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Vorige
				</button>
				<span class="text-sm text-gray-500">
					Pagina {currentPage} van {totalPages}
				</span>
				<button
					type="button"
					on:click={nextPage}
					disabled={currentOffset + PAGE_SIZE >= totalCount}
					class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Volgende
				</button>
			</nav>
		{/if}
	{/if}
</div>
