<script lang="ts">
	import type { ApplyResult } from './wizard-state';

	export let projectId: string;
	export let applyResult: ApplyResult;
</script>

<div class="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
	<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
		<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
		</svg>
	</div>

	<h3 class="mt-4 text-lg font-semibold text-green-900">Planning is toegepast</h3>
	<p class="mt-2 text-sm text-green-700">
		De AI-planning is succesvol opgeslagen in het project.
	</p>

	<div class="mt-5 inline-flex items-center gap-6 text-sm text-green-800">
		<span><strong>{applyResult.total_activities}</strong> activiteiten</span>
		<span><strong>{applyResult.total_milestones}</strong> milestones</span>
		<span><strong>{applyResult.total_dependencies}</strong> afhankelijkheden</span>
	</div>

	<div class="mt-6">
		<a
			href="/projects/{projectId}/planning?tab=timeline"
			class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
		>
			Bekijk in tijdlijn
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
			</svg>
		</a>
	</div>
</div>
