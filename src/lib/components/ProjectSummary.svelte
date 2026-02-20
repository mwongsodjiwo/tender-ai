<script lang="ts">
	import type { Project, ProjectProfile, Milestone } from '$types';
	import type { ContractingAuthorityType, ProcedureType } from '$types';
	import type { OrganizationSettings } from '$types';
	import { PROCEDURE_TYPE_LABELS, MILESTONE_TYPE_LABELS } from '$types';
	import { getProcedureAdvice } from '$lib/utils/procedure-advice';

	export let project: Project;
	export let profile: ProjectProfile | null = null;
	export let milestones: Milestone[] = [];
	export let authorityType: ContractingAuthorityType = 'decentraal';
	export let orgThresholds: ThresholdSettings | null = null;

	type ThresholdSettings = Pick<
		OrganizationSettings,
		'threshold_works' | 'threshold_services_central' |
		'threshold_services_decentral' | 'threshold_social_services'
	>;

	$: isConfirmed = project.profile_confirmed;
	$: estimatedValue = profile?.estimated_value ?? null;

	$: thresholdAdvice = estimatedValue
		? getProcedureAdvice(estimatedValue, 'diensten', authorityType, orgThresholds)
		: null;

	$: publicationDate = findMilestone('publication');
	$: submissionDate = findMilestone('submission_deadline');
	$: awardDate = findMilestone('award_decision');

	function findMilestone(type: string): Milestone | undefined {
		return milestones.find((m) => m.milestone_type === type);
	}

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

<div class="rounded-card bg-white p-6 shadow-card space-y-4">
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
	{#if publicationDate || submissionDate || awardDate}
		<hr class="border-gray-100" />
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Sleutelmomenten</p>
			<dl class="mt-2 space-y-2">
				{#if publicationDate}
					<div class="flex items-center justify-between">
						<dt class="text-xs text-gray-500">{MILESTONE_TYPE_LABELS.publication}</dt>
						<dd class="text-xs font-medium text-gray-900">{formatDate(publicationDate.target_date)}</dd>
					</div>
				{/if}
				{#if submissionDate}
					<div class="flex items-center justify-between">
						<dt class="text-xs text-gray-500">{MILESTONE_TYPE_LABELS.submission_deadline}</dt>
						<dd class="text-xs font-medium text-gray-900">{formatDate(submissionDate.target_date)}</dd>
					</div>
				{/if}
				{#if awardDate}
					<div class="flex items-center justify-between">
						<dt class="text-xs text-gray-500">{MILESTONE_TYPE_LABELS.award_decision}</dt>
						<dd class="text-xs font-medium text-gray-900">{formatDate(awardDate.target_date)}</dd>
					</div>
				{/if}
			</dl>
		</div>
	{/if}

	<!-- Threshold advice -->
	{#if thresholdAdvice}
		<hr class="border-gray-100" />
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Drempeladvies</p>
			<div class="mt-1.5 flex items-center gap-2">
				{#if thresholdAdvice.isAboveThreshold}
					<span class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
						<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
						</svg>
						Boven EU-drempel
					</span>
				{:else}
					<span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
						<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
						</svg>
						Onder EU-drempel
					</span>
				{/if}
			</div>
			<p class="mt-1 text-xs text-gray-500">
				Drempel: {formatCurrency(thresholdAdvice.threshold)}
			</p>
		</div>
	{/if}
</div>
