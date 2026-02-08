<script lang="ts">
	export let status: string;
	export let variant: 'default' | 'outline' = 'default';

	const STATUS_STYLES: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700 border-gray-200',
		concept: 'bg-gray-100 text-gray-700 border-gray-200',
		generated: 'bg-primary-100 text-primary-700 border-primary-200',
		review: 'bg-purple-100 text-purple-700 border-purple-200',
		approved: 'bg-success-100 text-success-700 border-success-200',
		goedgekeurd: 'bg-success-100 text-success-700 border-success-200',
		rejected: 'bg-error-100 text-error-700 border-error-200',
		afgewezen: 'bg-error-100 text-error-700 border-error-200',
		verplicht: 'bg-error-50 text-error-700 border-error-200',
		optioneel: 'bg-primary-50 text-primary-700 border-primary-200',
		actief: 'bg-success-50 text-success-700 border-success-200',
		inactief: 'bg-gray-100 text-gray-500 border-gray-200',
		warning: 'bg-warning-100 text-warning-700 border-warning-200',
		briefing: 'bg-primary-100 text-primary-700 border-primary-200',
		generating: 'bg-warning-100 text-warning-700 border-warning-200',
		published: 'bg-success-100 text-success-700 border-success-200',
		archived: 'bg-gray-100 text-gray-500 border-gray-200'
	};

	const STATUS_LABELS: Record<string, string> = {
		draft: 'Concept',
		concept: 'Concept',
		generated: 'Gegenereerd',
		review: 'In review',
		approved: 'Goedgekeurd',
		goedgekeurd: 'Goedgekeurd',
		rejected: 'Afgewezen',
		afgewezen: 'Afgewezen',
		verplicht: 'Verplicht',
		optioneel: 'Optioneel',
		actief: 'Actief',
		inactief: 'Inactief',
		warning: 'Waarschuwing',
		briefing: 'Briefing',
		generating: 'Genereren',
		published: 'Gepubliceerd',
		archived: 'Gearchiveerd'
	};

	$: styles = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700 border-gray-200';
	$: displayLabel = STATUS_LABELS[status] ?? status;
	$: variantClass = variant === 'outline' ? 'bg-transparent border' : '';
</script>

<span
	class="inline-flex items-center rounded-badge px-2.5 py-0.5 text-xs font-medium {styles} {variantClass}"
	role="status"
>
	{displayLabel}
</span>
