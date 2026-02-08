<script lang="ts">
	interface Section {
		id: string;
		label: string;
		level?: number;
	}

	export let sections: Section[] = [];
	export let activeSection: string = '';
	export let onSectionClick: ((id: string) => void) | undefined = undefined;

	function handleClick(id: string) {
		onSectionClick?.(id);
	}
</script>

<nav aria-label="Inhoudsopgave" class="w-full">
	<ul class="space-y-0.5">
		{#each sections as section}
			{@const isActive = section.id === activeSection}
			{@const indent = (section.level ?? 0) > 0 ? `pl-${(section.level ?? 0) * 4}` : ''}
			<li>
				<button
					type="button"
					class="group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors {indent}
						{isActive
							? 'bg-primary-50 text-primary-700 font-medium border-l-2 border-primary-600'
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent'}"
					aria-current={isActive ? 'true' : undefined}
					on:click={() => handleClick(section.id)}
				>
					{section.label}
				</button>
			</li>
		{/each}
	</ul>
</nav>
