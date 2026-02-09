<script lang="ts">
	export let data: { month: string; label: string; started: number; completed: number }[] = [];
	export let loading: boolean = false;

	$: maxValue = Math.max(1, ...data.map(d => Math.max(d.started, d.completed)));
	$: barHeight = (value: number) => Math.round((value / maxValue) * 100);
</script>

<div class="rounded-card bg-white p-6 shadow-card">
	<div class="flex items-center justify-between">
		<h2 class="text-base font-semibold text-gray-900">Projecten per maand</h2>
		<div class="flex items-center gap-4 text-xs text-gray-500">
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-2.5 w-2.5 rounded-sm bg-primary-500"></span>
				Gestart
			</span>
			<span class="flex items-center gap-1.5">
				<span class="inline-block h-2.5 w-2.5 rounded-sm bg-success-500"></span>
				Afgerond
			</span>
		</div>
	</div>

	{#if loading}
		<div class="mt-6 flex h-40 items-end justify-between gap-3 animate-pulse">
			{#each Array(6) as _}
				<div class="flex flex-1 flex-col items-center gap-1">
					<div class="w-full rounded-t bg-gray-200" style="height: 60px"></div>
					<div class="h-3 w-8 rounded bg-gray-200"></div>
				</div>
			{/each}
		</div>
	{:else if data.length === 0}
		<p class="mt-6 text-sm text-gray-500">Nog geen maanddata beschikbaar.</p>
	{:else}
		<div class="mt-6 flex h-40 items-end justify-between gap-2" role="img" aria-label="Projecten per maand staafdiagram">
			{#each data as item (item.month)}
				<div class="flex flex-1 flex-col items-center gap-1">
					<div class="flex w-full items-end justify-center gap-1" style="height: 120px">
						<div
							class="w-2/5 rounded-t bg-primary-400 transition-all duration-300"
							style="height: {barHeight(item.started)}%"
							title="{item.started} gestart"
							role="presentation"
						></div>
						<div
							class="w-2/5 rounded-t bg-success-400 transition-all duration-300"
							style="height: {barHeight(item.completed)}%"
							title="{item.completed} afgerond"
							role="presentation"
						></div>
					</div>
					<span class="text-xs text-gray-500">{item.label}</span>
				</div>
			{/each}
		</div>

		<!-- Y-axis labels -->
		<div class="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-400">
			<span>0</span>
			<span>{Math.ceil(maxValue / 2)}</span>
			<span>{maxValue}</span>
		</div>
	{/if}
</div>
