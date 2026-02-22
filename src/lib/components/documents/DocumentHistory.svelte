<!-- Compact history timeline for document drawer -->
<script lang="ts">
	import type { DocumentHistoryEntry } from './types.js';

	export let entries: DocumentHistoryEntry[] = [];

	$: visibleEntries = entries.slice(0, 5);

	const ACTION_LABELS: Record<string, string> = {
		create: 'Aangemaakt', update: 'Bijgewerkt', delete: 'Verwijderd',
		approve: 'Goedgekeurd', reject: 'Afgewezen', generate: 'Gegenereerd',
		export: 'Geexporteerd'
	};

	function formatDateTime(dateStr: string): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleString('nl-NL', {
			day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
		});
	}
</script>

<div class="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
	<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Historie</h4>
	{#if visibleEntries.length > 0}
		<div class="mt-3 space-y-2.5">
			{#each visibleEntries as entry}
				<div class="flex items-start gap-2">
					<svg class="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<circle cx="12" cy="12" r="10"/>
						<path d="M12 6v6H8"/>
					</svg>
					<div class="min-w-0">
						<p class="text-xs text-gray-900">
							<span class="font-medium">{ACTION_LABELS[entry.action] ?? entry.action}</span>
							{#if entry.actorName}
								<span class="text-gray-500"> door {entry.actorName}</span>
							{/if}
						</p>
						<p class="text-xs text-gray-400">{formatDateTime(entry.createdAt)}</p>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="mt-2 text-xs text-gray-400">Geen historie beschikbaar</p>
	{/if}
</div>
