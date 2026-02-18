<!-- Supplier drawer — Correspondentie tab: letters related to supplier -->
<script lang="ts">
	interface CorrespondenceLink {
		id: string;
		projectId: string;
		projectName: string;
		subject: string;
		type: string;
		createdAt: string;
	}

	export let letters: CorrespondenceLink[] = [];

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<div class="space-y-4">
	<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
		Correspondentie
	</h4>

	{#if letters.length === 0}
		<p class="text-sm text-gray-400">Geen correspondentie gevonden</p>
	{:else}
		<ul class="divide-y divide-gray-100" role="list">
			{#each letters as letter (letter.id)}
				<li class="py-3">
					<a
						href="/projects/{letter.projectId}/correspondence/{letter.id}"
						class="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
					>
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-900">{letter.subject}</span>
							<span class="text-xs text-gray-400">{formatDate(letter.createdAt)}</span>
						</div>
						<div class="mt-0.5 flex gap-2 text-xs text-gray-500">
							<span>{letter.type}</span>
							<span class="text-gray-300">|</span>
							<span>{letter.projectName}</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
