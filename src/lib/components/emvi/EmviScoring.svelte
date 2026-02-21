<script lang="ts">
	interface Criterion {
		name: string;
		criterion_type: string;
		weight_percentage: number;
	}

	export let criteria: Criterion[];
	export let totalWeight: number;
	export let weightValid: boolean;
	export let priceWeight: number;
	export let qualityWeight: number;
	export let qualityCriteriaCount: number;
</script>

<div class="space-y-4">
	<!-- Weight overview card -->
	<div class="rounded-card bg-white p-5 shadow-card">
		<h3 class="text-sm font-semibold text-gray-900">Weging overzicht</h3>
		<div class="mt-4 space-y-3">
			{#each criteria as criterion}
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-600 truncate mr-2">{criterion.name}</span>
					<span class="font-medium text-gray-900 shrink-0">{Number(criterion.weight_percentage)}%</span>
				</div>
			{/each}
			{#if criteria.length > 0}
				<hr class="border-gray-200" />
				<div class="flex items-center justify-between text-sm font-semibold">
					<span class="text-gray-900">Totaal</span>
					<span class="{weightValid ? 'text-success-600' : 'text-error-600'}">{totalWeight}%</span>
				</div>
			{/if}
		</div>

		{#if criteria.length > 0}
			<div class="mt-4">
				<div class="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
					{#if priceWeight > 0}
						<div class="bg-primary-500 transition-all" style="width: {Math.min(priceWeight, 100)}%" title="Prijs: {priceWeight}%"></div>
					{/if}
					{#if qualityWeight > 0}
						<div class="bg-success-500 transition-all" style="width: {Math.min(qualityWeight, 100)}%" title="Kwaliteit: {qualityWeight}%"></div>
					{/if}
				</div>
				<div class="mt-2 flex gap-4 text-xs text-gray-500">
					<span class="flex items-center gap-1">
						<span class="inline-block h-2 w-2 rounded-full bg-primary-500"></span>
						Prijs ({priceWeight}%)
					</span>
					<span class="flex items-center gap-1">
						<span class="inline-block h-2 w-2 rounded-full bg-success-500"></span>
						Kwaliteit ({qualityWeight}%)
					</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- EMVI guidelines info block -->
	<div class="rounded-card bg-white p-5 shadow-card">
		<h3 class="text-sm font-semibold text-gray-900">EMVI-richtlijnen</h3>
		<ul class="mt-3 space-y-2 text-xs text-gray-600">
			{#each ['Prijs mag maximaal 40-50% wegen', 'Minimaal 2 kwaliteitscriteria', 'Totaalweging moet optellen tot 100%', 'Elk criterium moet objectief meetbaar zijn', 'Conform art. 2.114 Aanbestedingswet 2012'] as guideline}
				<li class="flex items-start gap-2">
					<svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
					</svg>
					{guideline}
				</li>
			{/each}
		</ul>

		{#if priceWeight > 50}
			<div class="mt-3 rounded-md bg-warning-50 p-2 text-xs text-warning-700">
				Prijsweging is hoger dan 50%. Overweeg meer gewicht aan kwaliteit te geven.
			</div>
		{/if}
		{#if qualityCriteriaCount < 2 && criteria.length > 0}
			<div class="mt-3 rounded-md bg-warning-50 p-2 text-xs text-warning-700">
				Minder dan 2 kwaliteitscriteria. Voeg meer kwaliteitscriteria toe.
			</div>
		{/if}
	</div>
</div>
