<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { PROJECT_PHASE_LABELS } from '$types';

	export let projectId: string;
	export let timelineStart: string | null = null;
	export let timelineEnd: string | null = null;

	// Wizard step state
	type WizardStep = 'parameters' | 'preview' | 'confirmation';
	let currentStep: WizardStep = 'parameters';

	// Step 1: Parameters
	let targetStartDate: string = timelineStart ?? new Date().toISOString().split('T')[0];
	let targetEndDate: string = timelineEnd ?? '';
	let bufferDays: number = 5;
	let parallelActivities: boolean = true;
	let includeReviews: boolean = true;

	// Step 2: Preview
	let generating: boolean = false;
	let generateError: string = '';
	let generatedPlanning: GeneratedPlanningResponse | null = null;

	// Step 3: Confirmation
	let applying: boolean = false;
	let applyError: string = '';
	let applyResult: ApplyResult | null = null;

	interface GeneratedPlanningResponse {
		planning: {
			phases: {
				phase: string;
				start_date: string;
				end_date: string;
				activities: {
					title: string;
					description: string;
					activity_type: string;
					planned_start: string;
					planned_end: string;
					estimated_hours: number;
					assigned_role: string;
				}[];
				milestones: {
					milestone_type: string;
					title: string;
					target_date: string;
					is_critical: boolean;
				}[];
			}[];
			dependencies: {
				from_title: string;
				to_title: string;
				type: string;
				lag_days: number;
			}[];
			total_duration_days: number;
			total_estimated_hours: number;
		};
		rationale: string;
		warnings: string[];
	}

	interface ApplyResult {
		total_activities: number;
		total_milestones: number;
		total_dependencies: number;
	}

	// Count totals from generated planning
	$: totalActivities = generatedPlanning?.planning.phases.reduce(
		(sum, p) => sum + p.activities.length, 0
	) ?? 0;
	$: totalMilestones = generatedPlanning?.planning.phases.reduce(
		(sum, p) => sum + p.milestones.length, 0
	) ?? 0;
	$: totalDependencies = generatedPlanning?.planning.dependencies.length ?? 0;

	async function handleGenerate(): Promise<void> {
		generating = true;
		generateError = '';
		generatedPlanning = null;

		try {
			const response = await fetch(`/api/projects/${projectId}/planning/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					target_start_date: targetStartDate || null,
					target_end_date: targetEndDate || null,
					preferences: {
						buffer_days: bufferDays,
						parallel_activities: parallelActivities,
						include_reviews: includeReviews
					}
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				generateError = errorData.message ?? 'Fout bij genereren van planning.';
				return;
			}

			const result = await response.json();
			generatedPlanning = result.data;
			currentStep = 'preview';
		} catch {
			generateError = 'Netwerkfout bij genereren van planning.';
		} finally {
			generating = false;
		}
	}

	async function handleApply(): Promise<void> {
		if (!generatedPlanning) return;

		applying = true;
		applyError = '';

		try {
			const response = await fetch(`/api/projects/${projectId}/planning/apply`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					planning: generatedPlanning.planning,
					clear_existing: false
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				applyError = errorData.message ?? 'Fout bij toepassen van planning.';
				return;
			}

			const result = await response.json();
			applyResult = result.data;
			currentStep = 'confirmation';

			// Refresh page data
			await invalidateAll();
		} catch {
			applyError = 'Netwerkfout bij toepassen van planning.';
		} finally {
			applying = false;
		}
	}

	function handleRegenerate(): void {
		generatedPlanning = null;
		currentStep = 'parameters';
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatPhaseLabel(phase: string): string {
		return PROJECT_PHASE_LABELS[phase as keyof typeof PROJECT_PHASE_LABELS] ?? phase;
	}

	const ROLE_LABELS: Record<string, string> = {
		project_leader: 'Projectleider',
		procurement_advisor: 'Inkoopadviseur',
		legal_advisor: 'Jurist',
		budget_holder: 'Budgethouder',
		subject_expert: 'Vakinhoudelijk expert'
	};

	function formatRoleLabel(role: string): string {
		return ROLE_LABELS[role] ?? role;
	}
</script>

<div class="space-y-6">
	<!-- Step indicators -->
	<div class="flex items-center justify-center gap-2">
		{#each ['parameters', 'preview', 'confirmation'] as step, i (step)}
			{@const stepLabels = ['Parameters', 'Preview', 'Bevestiging']}
			{@const isActive = currentStep === step}
			{@const isPast = ['parameters', 'preview', 'confirmation'].indexOf(currentStep) > i}
			<div class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
						{isActive
							? 'bg-primary-600 text-white'
							: isPast
								? 'bg-primary-100 text-primary-700'
								: 'bg-gray-100 text-gray-400'}"
				>
					{#if isPast}
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						{i + 1}
					{/if}
				</div>
				<span class="text-sm font-medium {isActive ? 'text-gray-900' : 'text-gray-400'}">
					{stepLabels[i]}
				</span>
				{#if i < 2}
					<div class="mx-2 h-px w-8 {isPast ? 'bg-primary-300' : 'bg-gray-200'}"></div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Step 1: Parameters -->
	{#if currentStep === 'parameters'}
		<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
			<h3 class="text-lg font-semibold text-gray-900">Planning genereren</h3>
			<p class="mt-1 text-sm text-gray-500">
				Stel de parameters in voor de AI-planningsgeneratie. De AI houdt rekening met het
				gekozen procedure-type, wettelijke termijnen en vergelijkbare aanbestedingen.
			</p>

			<div class="mt-6 space-y-5">
				<!-- Start date -->
				<div>
					<label for="planning-start" class="block text-sm font-medium text-gray-700">
						Gewenste startdatum
					</label>
					<input
						id="planning-start"
						type="date"
						bind:value={targetStartDate}
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
					/>
				</div>

				<!-- End date -->
				<div>
					<label for="planning-end" class="block text-sm font-medium text-gray-700">
						Gewenste einddatum <span class="text-gray-400">(optioneel)</span>
					</label>
					<input
						id="planning-end"
						type="date"
						bind:value={targetEndDate}
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
					/>
					<p class="mt-1 text-xs text-gray-400">
						Laat leeg voor een realistisch voorstel door de AI.
					</p>
				</div>

				<!-- Buffer -->
				<div>
					<label for="planning-buffer" class="block text-sm font-medium text-gray-700">
						Buffer per fase (werkdagen)
					</label>
					<select
						id="planning-buffer"
						bind:value={bufferDays}
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
					>
						<option value={0}>Geen buffer</option>
						<option value={3}>3 werkdagen</option>
						<option value={5}>5 werkdagen (aanbevolen)</option>
						<option value={10}>10 werkdagen</option>
						<option value={15}>15 werkdagen</option>
					</select>
				</div>

				<!-- Checkboxes -->
				<div class="space-y-3">
					<label class="flex items-center gap-2">
						<input
							type="checkbox"
							bind:checked={parallelActivities}
							class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
						/>
						<span class="text-sm text-gray-700">Parallelle activiteiten waar mogelijk</span>
					</label>
					<label class="flex items-center gap-2">
						<input
							type="checkbox"
							bind:checked={includeReviews}
							class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
						/>
						<span class="text-sm text-gray-700">Review-momenten opnemen</span>
					</label>
				</div>
			</div>

			<!-- Error -->
			{#if generateError}
				<div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{generateError}
				</div>
			{/if}

			<!-- Action -->
			<div class="mt-6 flex justify-end">
				<button
					type="button"
					on:click={handleGenerate}
					disabled={generating}
					class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
				>
					{#if generating}
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Planning genereren...
					{:else}
						Planning genereren
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					{/if}
				</button>
			</div>
		</div>

	<!-- Step 2: Preview -->
	{:else if currentStep === 'preview' && generatedPlanning}
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
					<p class="text-2xl font-bold text-gray-900">{totalActivities}</p>
					<p class="text-xs text-gray-500">Activiteiten</p>
				</div>
				<div class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
					<p class="text-2xl font-bold text-gray-900">{totalMilestones}</p>
					<p class="text-xs text-gray-500">Milestones</p>
				</div>
				<div class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
					<p class="text-2xl font-bold text-gray-900">{totalDependencies}</p>
					<p class="text-xs text-gray-500">Afhankelijkheden</p>
				</div>
				<div class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
					<p class="text-2xl font-bold text-gray-900">{generatedPlanning.planning.total_duration_days}</p>
					<p class="text-xs text-gray-500">Dagen totaal</p>
				</div>
			</div>

			<!-- Phase breakdown -->
			<div class="mt-6 space-y-4">
				{#each generatedPlanning.planning.phases as phase (phase.phase)}
					<details class="group rounded-lg border border-gray-200">
						<summary class="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
							<div class="flex items-center gap-2">
								<svg class="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
								{formatPhaseLabel(phase.phase)}
							</div>
							<span class="text-xs text-gray-400">
								{formatDate(phase.start_date)} — {formatDate(phase.end_date)}
								({phase.activities.length} activiteiten, {phase.milestones.length} milestones)
							</span>
						</summary>

						<div class="border-t border-gray-200 px-4 pb-4 pt-3">
							<!-- Activities -->
							{#if phase.activities.length > 0}
								<h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Activiteiten</h4>
								<div class="mt-2 space-y-2">
									{#each phase.activities as activity (activity.title)}
										<div class="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
											<div class="flex items-start justify-between">
												<p class="text-sm font-medium text-gray-800">{activity.title}</p>
												<span class="shrink-0 text-xs text-gray-400">
													{activity.estimated_hours}u
												</span>
											</div>
											{#if activity.description}
												<p class="mt-0.5 text-xs text-gray-500">{activity.description}</p>
											{/if}
											<div class="mt-1 flex items-center gap-3 text-xs text-gray-400">
												<span>{formatDate(activity.planned_start)} — {formatDate(activity.planned_end)}</span>
												<span class="rounded bg-gray-100 px-1.5 py-0.5">{formatRoleLabel(activity.assigned_role)}</span>
											</div>
										</div>
									{/each}
								</div>
							{/if}

							<!-- Milestones -->
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
											<span class="text-xs text-gray-400">{formatDate(milestone.target_date)}</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</details>
				{/each}
			</div>

			<!-- AI rationale -->
			{#if generatedPlanning.rationale}
				<div class="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
					<p class="text-sm font-medium text-blue-800">AI-toelichting</p>
					<p class="mt-1 text-sm text-blue-700">{generatedPlanning.rationale}</p>
				</div>
			{/if}

			<!-- Warnings -->
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

			<!-- Apply error -->
			{#if applyError}
				<div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{applyError}
				</div>
			{/if}

			<!-- Actions -->
			<div class="mt-6 flex items-center justify-between">
				<button
					type="button"
					on:click={handleRegenerate}
					disabled={applying}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
				>
					Opnieuw genereren
				</button>
				<button
					type="button"
					on:click={handleApply}
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

	<!-- Step 3: Confirmation -->
	{:else if currentStep === 'confirmation' && applyResult}
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
	{/if}
</div>
