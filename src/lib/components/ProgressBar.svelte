<script lang="ts">
	export let value: number;
	export let max: number = 100;
	export let label: string = '';
	export let showPercentage: boolean = true;
	export let size: 'sm' | 'md' | 'lg' = 'md';

	const SIZE_CLASSES = {
		sm: 'h-1.5',
		md: 'h-2.5',
		lg: 'h-4'
	} as const;

	$: percentage = Math.min(Math.round((value / max) * 100), 100);
</script>

<div>
	{#if label || showPercentage}
		<div class="mb-1 flex items-center justify-between text-sm">
			{#if label}
				<span class="font-medium text-gray-700">{label}</span>
			{/if}
			{#if showPercentage}
				<span class="text-gray-500">{percentage}%</span>
			{/if}
		</div>
	{/if}
	<div
		class="w-full overflow-hidden rounded-full bg-gray-200 {SIZE_CLASSES[size]}"
		role="progressbar"
		aria-valuenow={value}
		aria-valuemin={0}
		aria-valuemax={max}
		aria-label={label || 'Voortgang'}
	>
		<div
			class="rounded-full bg-primary-600 transition-all duration-300 {SIZE_CLASSES[size]}"
			style="width: {percentage}%"
		></div>
	</div>
</div>
