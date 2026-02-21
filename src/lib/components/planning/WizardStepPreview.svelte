<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formatDate, formatPhaseLabel, formatRoleLabel } from './wizard-state';
	import type { GeneratedPlanningResponse } from './wizard-state';

	export let generatedPlanning: GeneratedPlanningResponse;
	export let applying: boolean;
	export let applyError: string;

	const dispatch = createEventDispatcher<{ apply: void; regenerate: void }>();

	$: totalActivities = generatedPlanning.planning.phases.reduce(
		(sum, p) => sum + p.activities.length, 0
	);
	$: totalMilestones = generatedPlanning.planning.phases.reduce(
		(sum, p) => sum + p.milestones.length, 0
	);
	$: totalDependencies = generatedPlanning.planning.dependencies.length;
</script>

<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
	<div class="flex items-start justify-between">
		<div>
			<h3 class="text-lg font-semibold text-gray-900">Voorgestelde planning</h3>
			<p class="mt-1 text-sm text-gray-500">
				Bekijk het voorstel van de AI. Je kunt de planning toepassen of opnieuw genereren.
			</p>
		</div>
		<span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
			<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
			</svg>
			AI-voorstel
		</span>
	</div>

	<!-- Summary metrics -->
	<div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
			<p class="text-2xl font-semibold text-gray-900">{totalActivities}</p>
			<p class="text-xs text-gray-500">Activiteiten</p>
		</div>
		<div class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
			<p class="text-2xl font-semibold text-gray-900">{totalMilestones}</p>
			<p class="text-xs text-gray-500">Milestones</p>
		</div>
		<div class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
			<p class="text-2xl font-semibold text-gray-900">{totalDependencies}</p>
			<p class="text-xs text-gray-500">Afhankelijkheden</p>
		</div>
		<div class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
			<p class="text-2xl font-semibold text-gray-900">{generatedPlanning.planning.total_duration_days}</p>
			<p class="text-xs text-gray-500">Dagen totaal</p>
		</div>
	</div>

	<!-- Phase breakdown -->
	<div class="mt-6 space-y-4">
		{#each generatedPlanning.planning.phases as phase (phase.phase)}
			<details class="group rounded-lg border border-gray-200">
				<summary class="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
					<div class="flex items-center gap-2">
						<svg class="h-4 w-4 text-gray-500 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
						{formatPhaseLabel(phase.phase)}
					</div>
					<span class="text-xs text-gray-500">
						{formatDate(phase.start_date)} — {formatDate(phase.end_date)}
						({phase.activities.length} activiteiten, {phase.milestones.length} milestones)
					</span>
				</summary>
				<div class="border-t border-gray-200 px-4 pb-4 pt-3">
					{#if phase.activities.length > 0}
						<h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Activiteiten</h4>
						<div class="mt-2 space-y-2">
							{#each phase.activities as activity (activity.title)}
								<div class="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
									<div class="flex items-start justify-between">
										<p class="text-sm font-medium text-gray-800">{activity.title}</p>
										<span class="shrink-0 text-xs text-gray-500">{activity.estimated_hours}u</span>
									</div>
									{#if activity.description}
										<p class="mt-0.5 text-xs text-gray-500">{activity.description}</p>
									{/if}
									<div class="mt-1 flex items-center gap-3 text-xs text-gray-500">
										<span>{formatDate(activity.planned_start)} — {formatDate(activity.planned_end)}</span>
										<span class="rounded bg-gray-100 px-1.5 py-0.5">{formatRoleLabel(activity.assigned_role)}</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
					{#if phase.milestones.length > 0}
						<h4 class="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Milestones</h4>
						<div class="mt-2 space-y-1.5">
							{#each phase.milestones as milestone (milestone.title)}
								<div class="flex items-center gap-2 text-sm">
									{#if milestone.is_critical}
										<svg class="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Kritiek">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									{:else}
										<svg class="h-4 w-4 shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
											<path d="M12 2l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" />
										</svg>
									{/if}
									<span class="text-gray-700">{milestone.title}</span>
									<span class="text-xs text-gray-500">{formatDate(milestone.target_date)}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</details>
		{/each}
	</div>

	{#if generatedPlanning.rationale}
		<div class="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
			<p class="text-sm font-medium text-blue-800">AI-toelichting</p>
			<p class="mt-1 text-sm text-blue-700">{generatedPlanning.rationale}</p>
		</div>
	{/if}

	{#if generatedPlanning.warnings.length > 0}
		<div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
			<p class="text-sm font-medium text-amber-800">Waarschuwingen</p>
			<ul class="mt-1 list-inside list-disc space-y-0.5 text-sm text-amber-700">
				{#each generatedPlanning.warnings as warning}
					<li>{warning}</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if applyError}
		<div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{applyError}
		</div>
	{/if}

	<div class="mt-6 flex items-center justify-between">
		<button
			type="button"
			on:click={() => dispatch('regenerate')}
			disabled={applying}
			class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
		>
			Opnieuw genereren
		</button>
		<button
			type="button"
			on:click={() => dispatch('apply')}
			disabled={applying}
			class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
		>
			{#if applying}
				<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Toepassen...
			{:else}
				Toepassen
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			{/if}
		</button>
	</div>
</div>
