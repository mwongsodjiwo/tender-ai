<script lang="ts">
	import { WIZARD_STEPS, WIZARD_STEP_LABELS } from './wizard-state';
	import type { WizardStep } from './wizard-state';

	export let currentStep: WizardStep;

	$: currentIndex = WIZARD_STEPS.indexOf(currentStep);
</script>

<div class="flex items-center justify-center gap-2">
	{#each WIZARD_STEPS as step, i (step)}
		{@const isActive = currentStep === step}
		{@const isPast = currentIndex > i}
		<div class="flex items-center gap-2">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
					{isActive
						? 'bg-primary-600 text-white'
						: isPast
							? 'bg-primary-100 text-primary-700'
							: 'bg-gray-100 text-gray-500'}"
			>
				{#if isPast}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				{:else}
					{i + 1}
				{/if}
			</div>
			<span class="text-sm font-medium {isActive ? 'text-gray-900' : 'text-gray-500'}">
				{WIZARD_STEP_LABELS[i]}
			</span>
			{#if i < WIZARD_STEPS.length - 1}
				<div class="mx-2 h-px w-8 {isPast ? 'bg-primary-300' : 'bg-gray-200'}"></div>
			{/if}
		</div>
	{/each}
</div>
