<script lang="ts">
	interface Step {
		label: string;
		status: 'completed' | 'active' | 'pending';
	}

	export let steps: Step[] = [];
	export let currentStep: number = 0;
	export let onStepClick: ((index: number) => void) | undefined = undefined;

	const STATUS_ICON_CLASSES = {
		completed: 'bg-success-600 text-white',
		active: 'bg-primary-600 text-white ring-2 ring-primary-200',
		pending: 'bg-gray-200 text-gray-500'
	} as const;

	const STATUS_LINE_CLASSES = {
		completed: 'bg-success-600',
		active: 'bg-primary-600',
		pending: 'bg-gray-200'
	} as const;

	const STATUS_LABEL_CLASSES = {
		completed: 'text-gray-700',
		active: 'text-primary-700 font-semibold',
		pending: 'text-gray-500'
	} as const;
</script>

<nav aria-label="Stappen" class="w-full">
	<ol class="space-y-1">
		{#each steps as step, index}
			<li class="relative">
				{#if index < steps.length - 1}
					<div
						class="absolute left-4 top-8 h-full w-0.5 -translate-x-1/2 {STATUS_LINE_CLASSES[step.status]}"
						aria-hidden="true"
					></div>
				{/if}
				<button
					type="button"
					class="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-default disabled:hover:bg-transparent"
					disabled={!onStepClick}
					aria-current={index === currentStep ? 'step' : undefined}
					on:click={() => onStepClick?.(index)}
				>
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium {STATUS_ICON_CLASSES[step.status]}"
						aria-hidden="true"
					>
						{#if step.status === 'completed'}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{:else}
							{index + 1}
						{/if}
					</span>
					<span class="text-sm {STATUS_LABEL_CLASSES[step.status]}">
						{step.label}
					</span>
				</button>
			</li>
		{/each}
	</ol>
</nav>
