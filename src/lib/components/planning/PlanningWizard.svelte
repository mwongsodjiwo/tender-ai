<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { WizardStep, GeneratedPlanningResponse, ApplyResult } from './wizard-state';
	import WizardStepNav from './WizardStepNav.svelte';
	import WizardStepParameters from './WizardStepParameters.svelte';
	import WizardStepPreview from './WizardStepPreview.svelte';
	import WizardStepConfirmation from './WizardStepConfirmation.svelte';

	export let projectId: string;
	export let timelineStart: string | null = null;
	export let timelineEnd: string | null = null;

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
</script>

<div class="space-y-6">
	<WizardStepNav {currentStep} />

	{#if currentStep === 'parameters'}
		<WizardStepParameters
			bind:targetStartDate
			bind:targetEndDate
			bind:bufferDays
			bind:parallelActivities
			bind:includeReviews
			{generating}
			{generateError}
			on:generate={handleGenerate}
		/>
	{:else if currentStep === 'preview' && generatedPlanning}
		<WizardStepPreview
			{generatedPlanning}
			{applying}
			{applyError}
			on:apply={handleApply}
			on:regenerate={handleRegenerate}
		/>
	{:else if currentStep === 'confirmation' && applyResult}
		<WizardStepConfirmation {projectId} {applyResult} />
	{/if}
</div>
