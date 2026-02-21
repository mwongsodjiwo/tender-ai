<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { PROJECT_PHASES, PROJECT_PHASE_LABELS, type ProjectPhase } from '$types';
	import PhaseStep from './PhaseStep.svelte';

	export let currentPhase: ProjectPhase;
	export let compact: boolean = false;
	export let interactive: boolean = false;
	export let selectedPhase: ProjectPhase | null = null;

	const dispatch = createEventDispatcher<{ phaseSelect: ProjectPhase }>();

	$: currentIndex = PROJECT_PHASES.indexOf(currentPhase);
	$: selectedIndex = selectedPhase ? PROJECT_PHASES.indexOf(selectedPhase) : -1;
	$: phaseCount = PROJECT_PHASES.length;

	function phaseStatus(index: number): 'completed' | 'current' | 'upcoming' {
		if (index < currentIndex) return 'completed';
		if (index === currentIndex) return 'current';
		return 'upcoming';
	}

	function handlePhaseSelect(e: CustomEvent<ProjectPhase>) {
		dispatch('phaseSelect', e.detail);
	}
</script>

<nav aria-label="Projectfasen" class="w-full">
	<div class="phase-bar" class:compact>
		{#each PROJECT_PHASES as phase, index (phase)}
			<PhaseStep
				{phase}
				{index}
				status={phaseStatus(index)}
				{compact}
				{interactive}
				isSelected={selectedPhase === phase}
				isLast={index === PROJECT_PHASES.length - 1}
				{phaseCount}
				{selectedIndex}
				on:phaseSelect={handlePhaseSelect}
			/>
		{/each}
	</div>

	{#if !compact}
		<p class="mobile-label sm:hidden">
			Fase {currentIndex + 1}: {PROJECT_PHASE_LABELS[currentPhase]}
		</p>
	{/if}
</nav>

<style>
	.phase-bar {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		position: relative;
	}

	.phase-bar.compact :global(.phase-circle) {
		width: 28px;
		height: 28px;
	}
	.phase-bar.compact :global(.phase-step.current .phase-circle) {
		width: 34px;
		height: 34px;
		box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
	}
	.phase-bar.compact :global(.phase-step.completed .phase-circle::after) {
		width: 10px;
		height: 6px;
		border-left-width: 2px;
		border-bottom-width: 2px;
	}
	.phase-bar.compact :global(.phase-step.current .phase-circle::after) {
		width: 8px;
		height: 8px;
	}
	.phase-bar.compact :global(.phase-step.upcoming .phase-circle::after) {
		width: 6px;
		height: 6px;
	}
	.phase-bar.compact :global(.phase-connector) {
		top: 14px;
		height: 2px;
	}

	.mobile-label {
		margin-top: 12px;
		text-align: center;
		font-size: 0.875rem;
		font-weight: 500;
		color: #1e293b;
	}
</style>
