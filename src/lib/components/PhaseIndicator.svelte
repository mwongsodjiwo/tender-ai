<script lang="ts">
	import {
		PROJECT_PHASES,
		PROJECT_PHASE_LABELS,
		type ProjectPhase
	} from '$types';

	export let currentPhase: ProjectPhase;
	export let compact: boolean = false;

	$: currentIndex = PROJECT_PHASES.indexOf(currentPhase);

	function phaseStatus(index: number): 'completed' | 'current' | 'upcoming' {
		if (index < currentIndex) return 'completed';
		if (index === currentIndex) return 'current';
		return 'upcoming';
	}
</script>

<nav aria-label="Projectfasen" class="w-full">
	<ol class="flex items-center {compact ? 'gap-1' : 'gap-0'}" role="list">
		{#each PROJECT_PHASES as phase, index (phase)}
			{@const status = phaseStatus(index)}
			{@const isLast = index === PROJECT_PHASES.length - 1}
			<li class="flex items-center {isLast ? '' : 'flex-1'}" aria-current={status === 'current' ? 'step' : undefined}>
				<div class="flex items-center gap-2 {compact ? '' : 'min-w-0'}">
					<!-- Step circle -->
					<div
						class="flex shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors
							{compact ? 'h-6 w-6' : 'h-8 w-8'}
							{status === 'completed'
								? 'bg-primary-600 text-white'
								: status === 'current'
									? 'bg-primary-600 text-white ring-4 ring-primary-100'
									: 'bg-gray-100 text-gray-400'}"
						aria-hidden="true"
					>
						{#if status === 'completed'}
							<svg class="{compact ? 'h-3 w-3' : 'h-4 w-4'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{:else}
							{index + 1}
						{/if}
					</div>

					<!-- Label -->
					{#if !compact}
						<span
							class="hidden text-sm font-medium whitespace-nowrap sm:inline
								{status === 'completed'
									? 'text-primary-700'
									: status === 'current'
										? 'text-primary-700'
										: 'text-gray-600'}"
						>
							{PROJECT_PHASE_LABELS[phase]}
						</span>
					{/if}
				</div>

				<!-- Connector line -->
				{#if !isLast}
					<div
						class="mx-2 h-0.5 flex-1
							{status === 'completed'
								? 'bg-primary-600'
								: 'bg-gray-200'}"
						aria-hidden="true"
					></div>
				{/if}
			</li>
		{/each}
	</ol>

	<!-- Mobile labels: show current phase name below on small screens -->
	{#if !compact}
		<p class="mt-2 text-center text-sm font-medium text-primary-700 sm:hidden">
			Fase {currentIndex + 1}: {PROJECT_PHASE_LABELS[currentPhase]}
		</p>
	{/if}
</nav>
