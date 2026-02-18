<!-- ProcedureAdvisor — Shows procedure advice based on estimated value and thresholds -->
<script lang="ts">
	import type { OrganizationSettings } from '$types';
	import type { ProcedureType, ContractingAuthorityType } from '$types';
	import { PROCEDURE_TYPE_LABELS } from '$types';
	import {
		getProcedureAdvice,
		checkDeviation,
		type CategoryType,
		type ProcedureAdvice
	} from '$lib/utils/procedure-advice';

	export let estimatedValue: number | null = null;
	export let category: CategoryType = 'diensten';
	export let authorityType: ContractingAuthorityType = 'decentraal';
	export let settings: Pick<
		OrganizationSettings,
		| 'threshold_works'
		| 'threshold_services_central'
		| 'threshold_services_decentral'
		| 'threshold_social_services'
	> | null = null;
	export let chosenProcedure: ProcedureType | null = null;
	export let deviationJustification = '';
	export let editing = false;

	$: advice = estimatedValue && estimatedValue > 0
		? getProcedureAdvice(estimatedValue, category, authorityType, settings)
		: null;

	$: deviation = advice
		? checkDeviation(advice.recommended, chosenProcedure)
		: null;

	$: showWarning = deviation?.isDeviation ?? false;
	$: requiresJustification = deviation?.requiresJustification ?? false;
</script>

{#if advice}
	<div class="mt-4 space-y-3">
		<!-- Advice banner -->
		<div class="rounded-lg border px-4 py-3
			{advice.isAboveThreshold
				? 'border-warning-200 bg-warning-50'
				: 'border-success-200 bg-success-50'}">
			<div class="flex items-start gap-3">
				<div class="mt-0.5 shrink-0">
					{#if advice.isAboveThreshold}
						<svg class="h-5 w-5 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
						</svg>
					{:else}
						<svg class="h-5 w-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					{/if}
				</div>
				<div>
					<p class="text-sm font-semibold
						{advice.isAboveThreshold ? 'text-warning-800' : 'text-success-800'}">
						Advies: {advice.label}
					</p>
					<p class="mt-1 text-sm
						{advice.isAboveThreshold ? 'text-warning-700' : 'text-success-700'}">
						{advice.motivation}
					</p>
				</div>
			</div>
		</div>

		<!-- Deviation warning -->
		{#if showWarning}
			<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
				<div class="flex items-start gap-3">
					<svg class="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
					<div class="flex-1">
						<p class="text-sm font-semibold text-red-800">
							Afwijking van advies
						</p>
						<p class="mt-1 text-sm text-red-700">
							De gekozen procedure ({PROCEDURE_TYPE_LABELS[chosenProcedure ?? 'open']})
							wijkt af van het advies ({advice.label}).
							Een onderbouwing is verplicht.
						</p>

						{#if editing && requiresJustification}
							<div class="mt-3">
								<label for="deviation-justification" class="block text-sm font-medium text-red-800">
									Onderbouwing afwijking *
								</label>
								<textarea
									id="deviation-justification"
									bind:value={deviationJustification}
									rows="3"
									required
									class="mt-1 block w-full rounded-lg border border-red-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
									placeholder="Motiveer waarom u afwijkt van het procedureadvies..."
								></textarea>
								{#if requiresJustification && deviationJustification.trim().length === 0}
									<p class="mt-1 text-xs text-red-600">
										Dit veld is verplicht bij afwijking van het advies.
									</p>
								{/if}
							</div>
						{:else if requiresJustification && deviationJustification}
							<div class="mt-2 rounded-md bg-red-100 px-3 py-2">
								<p class="text-xs font-medium text-red-800">Onderbouwing:</p>
								<p class="mt-1 text-sm text-red-700">{deviationJustification}</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
