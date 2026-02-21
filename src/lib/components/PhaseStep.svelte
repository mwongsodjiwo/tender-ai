<!-- PhaseStep — Single phase circle + label with connector line -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ProjectPhase } from '$types';
	import { PROJECT_PHASE_LABELS } from '$types';

	export let phase: ProjectPhase;
	export let index: number;
	export let status: 'completed' | 'current' | 'upcoming';
	export let compact: boolean = false;
	export let interactive: boolean = false;
	export let isSelected: boolean = false;
	export let isLast: boolean = false;
	export let phaseCount: number;
	export let selectedIndex: number;

	const dispatch = createEventDispatcher<{ phaseSelect: ProjectPhase }>();

	function handleClick() {
		if (interactive) dispatch('phaseSelect', phase);
	}
</script>

{#if interactive}
	<button
		type="button"
		class="phase-step {status} interactive"
		class:selected={isSelected}
		aria-current={status === 'current' ? 'step' : undefined}
		aria-label={`Selecteer fase ${index + 1}: ${PROJECT_PHASE_LABELS[phase]}`}
		on:click={handleClick}
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

{#if !isLast}
	<div
		class="phase-connector"
		class:completed={status === 'completed' && index < phaseCount - 1}
		class:active-left={status === 'completed'}
		class:future={status === 'current' || status === 'upcoming'}
		class:selected-left={selectedIndex >= 0 && index < selectedIndex}
		style="
			left: calc({((index) / phaseCount) * 100 + (100 / phaseCount / 2)}% + {compact ? '12px' : '20px'});
			right: calc({(1 - ((index + 1) / phaseCount) - (1 / phaseCount / 2)) * 100}% + {compact ? '12px' : '20px'});
		"
	></div>
{/if}

<style>
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
	.phase-step.interactive { cursor: pointer; }
	.phase-step.interactive:focus-visible {
		outline: 2px solid #6b7280;
		outline-offset: 6px;
		border-radius: 12px;
	}

	.phase-circle {
		width: 40px; height: 40px;
		border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		transition: all 0.3s ease;
		position: relative;
	}
	.phase-step.completed .phase-circle { background: #10b981; }
	.phase-step.completed .phase-circle::after {
		content: ''; width: 14px; height: 8px;
		border-left: 2.5px solid white; border-bottom: 2.5px solid white;
		transform: rotate(-45deg) translateY(-1px);
	}
	.phase-step.current .phase-circle {
		width: 48px; height: 48px; background: #2563eb;
		box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.15);
	}
	.phase-step.current .phase-circle::after {
		content: ''; width: 12px; height: 12px; background: white; border-radius: 50%;
	}
	.phase-step.upcoming .phase-circle { background: #e2e8f0; }
	.phase-step.upcoming .phase-circle::after {
		content: ''; width: 8px; height: 8px; background: #94a3b8; border-radius: 50%;
	}

	.phase-label {
		margin-top: 12px; font-size: 0.8125rem; color: #64748b;
		text-align: center; line-height: 1.3; max-width: 120px;
	}
	.phase-step.current .phase-label { font-weight: 500; color: #1e293b; }
	.phase-step.completed .phase-label { color: #10b981; font-weight: 500; }

	.phase-step.selected.completed .phase-circle { box-shadow: 0 0 0 4px rgba(5, 122, 85, 0.35); }
	.phase-step.selected.upcoming .phase-circle { box-shadow: 0 0 0 4px rgba(55, 65, 81, 0.3); }

	.phase-connector {
		position: absolute; top: 20px; height: 3px; z-index: 0; border-radius: 2px;
	}
	.phase-connector.completed { background: #10b981; }
	.phase-connector.active-left { background: #10b981; }
	.phase-connector.future { background: #e2e8f0; }

	@media (max-width: 639px) {
		.phase-label { display: none; }
		.phase-circle { width: 32px; height: 32px; }
		.phase-step.current .phase-circle { width: 40px; height: 40px; }
		.phase-connector { top: 16px; }
	}
</style>
