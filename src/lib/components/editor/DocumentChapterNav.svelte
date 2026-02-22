<!-- Compact chapter navigation panel for document editor sidebar -->
<script lang="ts">
	export let chapters: { id: string; title: string }[] = [];
	export let currentIndex = 0;
	export let onChapterClick: ((index: number) => void) | undefined = undefined;
</script>

<nav aria-label="Hoofdstuknavigatie" class="space-y-0.5">
	{#each chapters as chapter, index (chapter.id)}
		{@const active = index === currentIndex}
		<button
			type="button"
			class="flex w-full items-center gap-2.5 px-4 py-2 text-sm cursor-pointer transition-colors
				{active
					? 'bg-primary-50 text-primary-700 font-medium border-l-2 border-primary-500'
					: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent'}"
			aria-current={active ? 'true' : undefined}
			on:click={() => onChapterClick?.(index)}
		>
			<span
				class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold
					{active ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}"
			>
				{index + 1}
			</span>
			<span class="line-clamp-1 text-left">{chapter.title}</span>
		</button>
	{/each}
</nav>
