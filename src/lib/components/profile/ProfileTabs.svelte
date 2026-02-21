<script lang="ts">
	import type { ProjectProfile, Document, Organization, OrganizationSettings } from '$types';
	import { PROCEDURE_TYPE_LABELS } from '$types';
	import OrganizationTab from '$lib/components/OrganizationTab.svelte';
	import ProcedureAdvisor from '$lib/components/ProcedureAdvisor.svelte';
	import PlanningMilestones from '$lib/components/planning/PlanningMilestones.svelte';
	import ProfileDocuments from './ProfileDocuments.svelte';
	import type { TimelineMilestone } from '$lib/utils/procurement-timeline.js';
	import type { ContractingAuthorityType, ProcedureType } from '$types';

	type ProfileTab = 'organisatie' | 'project' | 'financieel' | 'planning' | 'documenten';
	type ThresholdSettings = Pick<OrganizationSettings, 'threshold_works' | 'threshold_services_central' | 'threshold_services_decentral' | 'threshold_social_services'> | null;

	export let activeTab: ProfileTab;
	export let profile: ProjectProfile | null;
	export let project: { id: string; procedure_type: string | null };
	export let documents: Document[];
	export let organization: Partial<Organization> | null;
	export let authorityType: ContractingAuthorityType;
	export let orgThresholds: ThresholdSettings;
	export let deviationJustification: string;
	export let planningMilestones: TimelineMilestone[];

	export let onEdit: () => void;
	export let onShowUpload: () => void;

	const TABS: { id: ProfileTab; label: string }[] = [
		{ id: 'organisatie', label: 'Organisatie' },
		{ id: 'project', label: 'Project' },
		{ id: 'financieel', label: 'Financieel' },
		{ id: 'planning', label: 'Planning' },
		{ id: 'documenten', label: 'Documenten' }
	];

	const FIELD_LABELS: Record<string, string> = {
		project_goal: 'Projectdoel',
		scope_description: 'Scope / omschrijving',
		estimated_value: 'Geschatte waarde',
		cpv_codes: 'CPV-codes'
	};
</script>

{#if activeTab === 'organisatie'}
	<OrganizationTab {organization} />
{:else if activeTab === 'documenten'}
	<ProfileDocuments {documents} projectId={project.id} {onShowUpload} />
{:else}
	<div class="rounded-card bg-white shadow-card">
		<div class="flex items-center justify-between border-b border-gray-100 px-6 pt-6 pb-4">
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
					{#if activeTab === 'project'}
						<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
						</svg>
					{:else if activeTab === 'financieel'}
						<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
						</svg>
					{:else}
						<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
						</svg>
					{/if}
				</div>
				<h2 class="text-base font-semibold text-gray-900">
					{TABS.find((t) => t.id === activeTab)?.label ?? ''}
				</h2>
			</div>
			<button on:click={onEdit}
				class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm hover:bg-primary-700 transition-colors"
				title="Bewerken" aria-label="Bewerken">
				<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
				</svg>
			</button>
		</div>

		<dl class="divide-y divide-gray-100">
			{#if activeTab === 'project'}
				<div class="px-6 py-4">
					<dt class="text-sm text-gray-500">{FIELD_LABELS.project_goal}</dt>
					<dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profile?.project_goal || '—'}</dd>
				</div>
				<div class="px-6 py-4">
					<dt class="text-sm text-gray-500">{FIELD_LABELS.scope_description}</dt>
					<dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profile?.scope_description || '—'}</dd>
				</div>
			{:else if activeTab === 'financieel'}
				<div class="flex items-center justify-between px-6 py-4">
					<dt class="text-sm text-gray-500">{FIELD_LABELS.estimated_value}</dt>
					<dd class="text-sm text-gray-900">
						{#if profile?.estimated_value}&euro;{profile.estimated_value.toLocaleString('nl-NL')}{:else}—{/if}
					</dd>
				</div>
				<div class="flex items-center justify-between px-6 py-4">
					<dt class="text-sm text-gray-500">Procedure</dt>
					<dd class="text-sm text-gray-900">
						{project.procedure_type ? (PROCEDURE_TYPE_LABELS[project.procedure_type as keyof typeof PROCEDURE_TYPE_LABELS] ?? project.procedure_type) : '—'}
					</dd>
				</div>
				<div class="flex items-center justify-between px-6 py-4">
					<dt class="text-sm text-gray-500">{FIELD_LABELS.cpv_codes}</dt>
					<dd class="flex flex-wrap gap-1">
						{#if profile?.cpv_codes && profile.cpv_codes.length > 0}
							{#each profile.cpv_codes as code}
								<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{code}</span>
							{/each}
						{:else}
							<span class="text-sm text-gray-900">—</span>
						{/if}
					</dd>
				</div>
				<div class="px-6 py-4">
					<ProcedureAdvisor
						estimatedValue={profile?.estimated_value ?? null}
						{authorityType}
						settings={orgThresholds}
						chosenProcedure={project.procedure_type as ProcedureType | null}
						bind:deviationJustification
						editing={false}
					/>
				</div>
			{:else if activeTab === 'planning'}
				<div class="px-6 py-4">
					<PlanningMilestones
						procedureType={project.procedure_type as ProcedureType | null}
						anchorDate={new Date().toISOString().split('T')[0]}
						milestones={planningMilestones}
						disabled={true}
						onMilestonesChange={null}
					/>
				</div>
			{/if}
		</dl>
	</div>
{/if}
