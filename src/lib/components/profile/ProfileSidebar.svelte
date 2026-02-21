<script lang="ts">
	import type { Project, ProjectProfile, Milestone } from '$types';
	import ProjectSummary from '$lib/components/ProjectSummary.svelte';

	export let project: Project;
	export let profile: ProjectProfile | null;
	export let milestones: Milestone[];
	export let confirming: boolean;

	export let onConfirm: () => void;

	$: isConfirmed = project.profile_confirmed;
</script>

<div class="space-y-4">
	<ProjectSummary
		{project}
		{profile}
		{milestones}
	/>

	{#if !isConfirmed && profile}
		<button on:click={onConfirm} disabled={confirming}
			class="flex w-full items-center gap-3 rounded-card bg-white p-4 shadow-card transition-colors hover:bg-gray-50 disabled:opacity-50">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-50">
				<svg class="h-5 w-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<div class="text-left">
				<p class="text-sm font-semibold text-gray-900">{confirming ? 'Bevestigen...' : 'Profiel bevestigen'}</p>
				<p class="text-xs text-gray-500">Bevestig als single source of truth</p>
			</div>
		</button>
	{/if}
</div>
