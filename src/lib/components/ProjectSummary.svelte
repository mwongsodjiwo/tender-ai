<script lang="ts">
	import type { Project, ProjectProfile, Milestone } from '$types';
	import type { ProcedureType } from '$types';
	import { PROCEDURE_TYPE_LABELS, MILESTONE_TYPE_LABELS } from '$types';

	export let project: Project;
	export let profile: ProjectProfile | null = null;
	export let milestones: Milestone[] = [];

	$: isConfirmed = project.profile_confirmed;
	$: estimatedValue = profile?.estimated_value ?? null;

	$: sortedMilestones = [...milestones].sort(
		(a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
	);

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('nl-NL', {
			style: 'currency',
			currency: 'EUR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}
</script>

<div class="rounded-card bg-white px-[35px] pt-6 pb-[35px] shadow-card space-y-4">
	<!-- Project name + status -->
	<div>
		<h3 class="text-sm font-semibold text-gray-900 truncate" title={project.name}>
			{project.name}
		</h3>
		<div class="mt-1.5 flex items-center gap-2">
			{#if isConfirmed}
				<span class="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
					<span class="h-1.5 w-1.5 rounded-full bg-success-500" aria-hidden="true"></span>
					Bevestigd
				</span>
			{:else}
				<span class="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
					<span class="h-1.5 w-1.5 rounded-full bg-warning-500" aria-hidden="true"></span>
					Concept
				</span>
			{/if}
		</div>
	</div>

	<hr class="border-gray-100" />

	<!-- Procedure type -->
	{#if project.procedure_type}
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Procedure</p>
			<p class="mt-1 text-sm text-gray-900">
				{PROCEDURE_TYPE_LABELS[project.procedure_type as ProcedureType] ?? project.procedure_type}
			</p>
		</div>
	{/if}

	<!-- Estimated value -->
	{#if estimatedValue}
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Geraamde waarde</p>
			<p class="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(estimatedValue)}</p>
		</div>
	{/if}

	<!-- CPV codes -->
	{#if profile?.cpv_codes && profile.cpv_codes.length > 0}
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">CPV-codes</p>
			<div class="mt-1 flex flex-wrap gap-1">
				{#each profile.cpv_codes as code}
					<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{code}</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Key milestones -->
	{#if sortedMilestones.length > 0}
		<hr class="border-gray-100" />
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Planning</p>
			<dl class="mt-2 space-y-2 text-[0.7875rem]">
				{#each sortedMilestones as milestone (milestone.id)}
					<div class="flex items-center justify-between">
						<dt class="text-gray-500">
							{MILESTONE_TYPE_LABELS[milestone.milestone_type] ?? milestone.milestone_type}
						</dt>
						<dd class="font-medium text-gray-900">{formatDate(milestone.target_date)}</dd>
					</div>
				{/each}
			</dl>
		</div>
	{/if}
</div>
