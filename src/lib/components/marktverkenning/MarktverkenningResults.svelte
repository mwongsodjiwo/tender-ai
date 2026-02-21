<script lang="ts">
	import type { DeskresearchResult } from '$types';

	export let results: DeskresearchResult[];
	export let summary: string;
</script>

{#if summary}
	<div class="rounded-lg border border-primary-200 bg-primary-50 p-4">
		<h3 class="text-sm font-semibold text-primary-800">AI Samenvatting</h3>
		<div class="mt-2 text-sm text-primary-700 whitespace-pre-wrap">{summary}</div>
	</div>
{/if}

<div class="space-y-3">
	<h3 class="text-sm font-semibold text-gray-700">{results.length} resultaten gevonden</h3>
	{#each results as result (result.id)}
		<div class="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
			<div class="flex items-start justify-between">
				<h4 class="text-sm font-medium text-gray-900">{result.title}</h4>
				<span class="ml-2 shrink-0 rounded-badge bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
					{Math.round(result.relevance * 100)}% relevant
				</span>
			</div>
			{#if result.contracting_authority}
				<p class="mt-1 text-xs text-gray-500">Opdrachtgever: {result.contracting_authority}</p>
			{/if}
			<div class="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
				{#if result.cpv_codes.length > 0}
					<span>CPV: {result.cpv_codes.join(', ')}</span>
				{/if}
				{#if result.estimated_value}
					<span>Waarde: &euro;{result.estimated_value.toLocaleString('nl-NL')}</span>
				{/if}
				{#if result.publication_date}
					<span>Publicatie: {new Date(result.publication_date).toLocaleDateString('nl-NL')}</span>
				{/if}
			</div>
			{#if result.snippet}
				<p class="mt-2 text-sm text-gray-600 line-clamp-2">{result.snippet}</p>
			{/if}
		</div>
	{/each}
</div>
