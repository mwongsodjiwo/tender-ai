<script lang="ts">
	import type { LayoutData } from './$types';
	import PhaseIndicator from '$lib/components/PhaseIndicator.svelte';

	export let data: LayoutData;

	$: project = data.project;
</script>

<!-- Phase indicator at top of every project page -->
<div class="mb-6 px-4 py-6 sm:px-6">
	<PhaseIndicator currentPhase={project.current_phase ?? 'preparing'} />
</div>

<slot />
