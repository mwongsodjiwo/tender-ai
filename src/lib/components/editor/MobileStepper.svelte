<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let artifacts: { id: string; status: string; content?: string | null }[] = [];
	export let currentSectionIndex = 0;
	export let sectionLabel = 'Sectie';

	const dispatch = createEventDispatcher<{ navigate: number }>();

	$: totalCount = artifacts.length;
</script>

<div class="fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white p-2 lg:hidden">
	<div class="flex items-center justify-between px-2">
		<span class="text-xs text-gray-500">
			{sectionLabel} {currentSectionIndex + 1} van {totalCount}
		</span>
		<div class="flex gap-1">
			{#each artifacts as artifact, i}
				<button
					on:click={() => dispatch('navigate', i)}
					class="h-2 w-2 rounded-full {i === currentSectionIndex
						? 'bg-primary-600'
						: artifact.status === 'approved'
							? 'bg-success-600'
							: artifact.status === 'generated' || (artifact.status === 'draft' && artifact.content)
								? 'bg-blue-400'
								: 'bg-gray-300'}"
					aria-label="Ga naar {sectionLabel.toLowerCase()} {i + 1}"
					type="button"
				></button>
			{/each}
		</div>
	</div>
</div>
