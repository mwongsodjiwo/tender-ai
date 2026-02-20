<!-- Page thumbnails sidebar: Word-style miniature page previews per section -->
<script lang="ts">
	export let sections: PageSection[] = [];
	export let currentIndex = 0;
	export let onSectionClick: ((index: number) => void) | undefined = undefined;

	interface PageSection {
		id: string;
		title: string;
		status: 'draft' | 'generated' | 'review' | 'approved';
		contentPreview: string;
	}

	const STATUS_STYLES = {
		approved: { border: 'border-success-500', badge: 'bg-success-100 text-success-700', label: 'Goedgekeurd' },
		review: { border: 'border-amber-400', badge: 'bg-amber-100 text-amber-700', label: 'Review' },
		generated: { border: 'border-primary-400', badge: 'bg-primary-100 text-primary-700', label: 'Gegenereerd' },
		draft: { border: 'border-gray-300', badge: 'bg-gray-100 text-gray-600', label: 'Concept' }
	} as const;

	function getStatusStyle(status: PageSection['status']) {
		return STATUS_STYLES[status] ?? STATUS_STYLES.draft;
	}

	function truncatePreview(html: string): string {
		const text = html.replace(/<[^>]*>/g, '').trim();
		return text.length > 80 ? text.slice(0, 80) + '...' : text || 'Lege sectie';
	}
</script>

<nav aria-label="Paginaminiaturen" class="space-y-2">
	{#each sections as section, index (section.id)}
		{@const style = getStatusStyle(section.status)}
		{@const active = index === currentIndex}
		<button
			type="button"
			class="group relative w-full rounded-lg border-2 p-2.5 text-left transition-all
				{active ? 'border-primary-500 ring-2 ring-primary-200 shadow-sm' : style.border}
				hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
			aria-current={active ? 'true' : undefined}
			on:click={() => onSectionClick?.(index)}
		>
			<div class="flex items-start justify-between gap-1.5">
				<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-100 text-[10px] font-semibold text-gray-600">
					{index + 1}
				</span>
				<span class="inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium {style.badge}">
					{style.label}
				</span>
			</div>
			<p class="mt-1.5 text-xs font-medium text-gray-900 line-clamp-1">{section.title}</p>
			<div class="mt-1 h-[3.5rem] overflow-hidden rounded border border-gray-100 bg-gray-50 px-2 py-1">
				<p class="text-[8px] leading-tight text-gray-400 line-clamp-4">
					{truncatePreview(section.contentPreview)}
				</p>
			</div>
		</button>
	{/each}
</nav>
