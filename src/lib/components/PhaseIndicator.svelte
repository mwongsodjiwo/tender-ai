<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		PROJECT_PHASES,
		PROJECT_PHASE_LABELS,
		type ProjectPhase
	} from '$types';

	export let currentPhase: ProjectPhase;
	export let compact: boolean = false;
	export let interactive: boolean = false;
	export let selectedPhase: ProjectPhase | null = null;

	const dispatch = createEventDispatcher<{ phaseSelect: ProjectPhase }>();

	$: currentIndex = PROJECT_PHASES.indexOf(currentPhase);
	$: selectedIndex = selectedPhase ? PROJECT_PHASES.indexOf(selectedPhase) : -1;

	function phaseStatus(index: number): 'completed' | 'current' | 'upcoming' {
		if (index < currentIndex) return 'completed';
		if (index === currentIndex) return 'current';
		return 'upcoming';
	}

	function handlePhaseSelect(phase: ProjectPhase) {
		if (!interactive) return;
		dispatch('phaseSelect', phase);
	}

	$: phaseCount = PROJECT_PHASES.length;
</script>

<nav aria-label="Projectfasen" class="w-full">
	<div class="phase-bar" class:compact>
		{#each PROJECT_PHASES as phase, index (phase)}
			{@const status = phaseStatus(index)}
			{@const isLast = index === PROJECT_PHASES.length - 1}

			<!-- Phase step -->
			{#if interactive}
				<button
					type="button"
					class="phase-step {status} interactive"
					class:selected={selectedPhase === phase}
					aria-current={status === 'current' ? 'step' : undefined}
					aria-label={`Selecteer fase ${index + 1}: ${PROJECT_PHASE_LABELS[phase]}`}
					on:click={() => handlePhaseSelect(phase)}
				>
					<div class="phase-circle"></div>
					{#if !compact}
						<span class="phase-label">{PROJECT_PHASE_LABELS[phase]}</span>
					{/if}
				</button>
			{:else}
				<div
					class="phase-step {status}"
					aria-current={status === 'current' ? 'step' : undefined}
					role="listitem"
				>
					<div class="phase-circle"></div>
					{#if !compact}
						<span class="phase-label">{PROJECT_PHASE_LABELS[phase]}</span>
					{/if}
				</div>
			{/if}

			<!-- Connector line -->
			{#if !isLast}
				<div
					class="phase-connector"
					class:completed={index < currentIndex - 1}
					class:active-left={index === currentIndex - 1}
					class:future={index >= currentIndex}
					class:selected-left={selectedIndex >= 0 && index < selectedIndex}
					style="
						left: calc({((index) / phaseCount) * 100 + (100 / phaseCount / 2)}% + {compact ? '12px' : '20px'});
						right: calc({(1 - ((index + 1) / phaseCount) - (1 / phaseCount / 2)) * 100}% + {compact ? '12px' : '20px'});
					"
				></div>
			{/if}
		{/each}
	</div>

	<!-- Mobile: show current phase name below -->
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

	.phase-step {
		background: transparent;
		border: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		flex: 1;
		position: relative;
		z-index: 1;
	}

	.phase-step.interactive {
		cursor: pointer;
	}

	.phase-step.interactive:focus-visible {
		outline: 2px solid #6b7280;
		outline-offset: 6px;
		border-radius: 12px;
	}

	/* ── Circle base ── */
	.phase-circle {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		position: relative;
	}

	/* Completed circle: green with checkmark */
	.phase-step.completed .phase-circle {
		background: #10b981;
	}

	.phase-step.completed .phase-circle::after {
		content: '';
		width: 14px;
		height: 8px;
		border-left: 2.5px solid white;
		border-bottom: 2.5px solid white;
		transform: rotate(-45deg) translateY(-1px);
	}

	/* Active circle: larger blue with glow + white dot */
	.phase-step.current .phase-circle {
		width: 48px;
		height: 48px;
		background: #2563eb;
		box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.15);
	}

	.phase-step.current .phase-circle::after {
		content: '';
		width: 12px;
		height: 12px;
		background: white;
		border-radius: 50%;
	}

	/* Future circle: grey with small dot */
	.phase-step.upcoming .phase-circle {
		background: #e2e8f0;
	}

	.phase-step.upcoming .phase-circle::after {
		content: '';
		width: 8px;
		height: 8px;
		background: #94a3b8;
		border-radius: 50%;
	}

	/* ── Labels ── */
	.phase-label {
		margin-top: 12px;
		font-size: 13px;
		color: #64748b;
		text-align: center;
		line-height: 1.3;
		max-width: 120px;
	}

	.phase-step.current .phase-label {
		font-weight: 600;
		color: #1e293b;
	}

	/* Selected state: ring around circle — only for completed and upcoming, not current */
	.phase-step.selected.completed .phase-circle {
		box-shadow: 0 0 0 4px rgba(5, 122, 85, 0.35);
	}

	.phase-step.selected.upcoming .phase-circle {
		box-shadow: 0 0 0 4px rgba(55, 65, 81, 0.3);
	}

	.phase-step.completed .phase-label {
		color: #10b981;
		font-weight: 500;
	}

	/* ── Connector lines ── */
	.phase-connector {
		position: absolute;
		top: 20px;
		height: 3px;
		z-index: 0;
		border-radius: 2px;
	}

	.phase-connector.completed {
		background: #10b981;
	}

	.phase-connector.active-left {
		background: #10b981;
	}

	/* No separate connector color for selected — keep the phase status colors */

	.phase-connector.future {
		background: #e2e8f0;
	}

	/* ── Compact mode ── */
	.phase-bar.compact .phase-circle {
		width: 28px;
		height: 28px;
	}

	.phase-bar.compact .phase-step.current .phase-circle {
		width: 34px;
		height: 34px;
		box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
	}

	.phase-bar.compact .phase-step.completed .phase-circle::after {
		width: 10px;
		height: 6px;
		border-left-width: 2px;
		border-bottom-width: 2px;
	}

	.phase-bar.compact .phase-step.current .phase-circle::after {
		width: 8px;
		height: 8px;
	}

	.phase-bar.compact .phase-step.upcoming .phase-circle::after {
		width: 6px;
		height: 6px;
	}

	.phase-bar.compact .phase-connector {
		top: 14px;
		height: 2px;
	}

	/* ── Mobile label ── */
	.mobile-label {
		margin-top: 12px;
		text-align: center;
		font-size: 0.875rem;
		font-weight: 500;
		color: #1e293b;
	}

	/* ── Responsive: hide labels on small screens ── */
	@media (max-width: 639px) {
		.phase-label {
			display: none;
		}
		.phase-circle {
			width: 32px;
			height: 32px;
		}
		.phase-step.current .phase-circle {
			width: 40px;
			height: 40px;
		}
		.phase-connector {
			top: 16px;
		}
	}
</style>
