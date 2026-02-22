<!-- Supplier table — displays filtered supplier rows -->
<script lang="ts">
	import type { Supplier } from '$types';

	export let suppliers: Supplier[] = [];
	export let onSelect: (supplier: Supplier) => void = () => {};

	function renderStars(rating: number | null): string {
		if (!rating) return '—';
		return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
	}
</script>

<div class="w-full rounded-card bg-white shadow-card overflow-hidden">
	<table class="w-full">
		<thead>
			<tr class="border-b border-gray-200">
				<th scope="col" class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
					Bedrijfsnaam
				</th>
				<th scope="col" class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
					KVK
				</th>
				<th scope="col" class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
					Plaats
				</th>
				<th scope="col" class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
					Tags
				</th>
				<th scope="col" class="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
					Beoordeling
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-100">
			{#each suppliers as supplier (supplier.id)}
				<tr
					class="group cursor-pointer transition-colors hover:bg-gray-50"
					on:click={() => onSelect(supplier)}
					on:keydown={(e) => { if (e.key === 'Enter') onSelect(supplier); }}
					tabindex="0"
					role="button"
					aria-label="Open {supplier.company_name}"
				>
					<td class="px-6 py-4">
						<span class="text-sm font-medium text-gray-900">{supplier.company_name}</span>
						{#if supplier.trade_name && supplier.trade_name !== supplier.company_name}
							<p class="text-xs text-gray-400">{supplier.trade_name}</p>
						{/if}
					</td>
					<td class="px-6 py-4 text-sm text-gray-500">
						{supplier.kvk_nummer ?? '—'}
					</td>
					<td class="px-6 py-4 text-sm text-gray-500">
						{supplier.city ?? '—'}
					</td>
					<td class="px-6 py-4">
						{#if (supplier.tags ?? []).length > 0}
							<div class="flex flex-wrap gap-1">
								{#each supplier.tags.slice(0, 3) as tag}
									<span class="inline-flex rounded-badge bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
										{tag}
									</span>
								{/each}
								{#if supplier.tags.length > 3}
									<span class="text-[10px] text-gray-400">+{supplier.tags.length - 3}</span>
								{/if}
							</div>
						{:else}
							<span class="text-xs text-gray-300">—</span>
						{/if}
					</td>
					<td class="px-6 py-4 text-right text-sm text-gray-500">
						{renderStars(supplier.rating)}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
