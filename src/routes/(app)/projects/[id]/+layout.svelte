<script lang="ts">
	import type { LayoutData } from './$types';
	import PhaseIndicator from '$lib/components/PhaseIndicator.svelte';

	export let data: LayoutData;

	$: project = data.project;
</script>

<!-- Phase indicator at top of every project page -->
<div class="mb-6 rounded-card bg-white px-6 py-4 shadow-card">
	<div class="mb-2 flex items-center justify-between">
		<h2 class="text-sm font-medium text-gray-500">{project.name}</h2>
	</div>
	<PhaseIndicator currentPhase={project.current_phase ?? 'preparing'} />
</div>

<slot />
