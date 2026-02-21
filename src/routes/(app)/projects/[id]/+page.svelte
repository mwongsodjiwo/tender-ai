<script lang="ts">
	import type { PageData } from './$types';
	import {
		PROJECT_PHASES,
		PROJECT_PHASE_LABELS,
		type ProjectPhase
	} from '$types';
	import PhaseIndicator from '$lib/components/PhaseIndicator.svelte';

	export let data: PageData;

	$: project = data.project;
	$: currentPhase = (project.current_phase ?? 'preparing') as ProjectPhase;

	let selectedPhase: ProjectPhase | null = null;
	let userHasSelected = false;

	$: if (!userHasSelected) {
		selectedPhase = currentPhase;
	}

	$: effectiveSelectedPhase = selectedPhase ?? currentPhase;

	function handlePhaseSelect(event: CustomEvent<ProjectPhase>) {
		userHasSelected = true;
		selectedPhase = event.detail;
	}
</script>

<svelte:head>
	<title>{project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<!-- Interactive phase indicator -->
	<div class="px-4 py-6 sm:px-6">
		<PhaseIndicator
			{currentPhase}
			interactive={true}
			selectedPhase={effectiveSelectedPhase}
			on:phaseSelect={handlePhaseSelect}
		/>
	</div>
</div>
