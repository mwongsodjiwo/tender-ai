<script lang="ts">
	import type { ProjectProfile, Organization, OrganizationSettings } from '$types';
	import OrganizationTab from '$lib/components/OrganizationTab.svelte';
	import CodeLookup from '$lib/components/CodeLookup.svelte';
	import ProcedureAdvisor from '$lib/components/ProcedureAdvisor.svelte';
	import PlanningMilestones from '$lib/components/planning/PlanningMilestones.svelte';
	import type { TimelineMilestone } from '$lib/utils/procurement-timeline.js';
	import type { ContractingAuthorityType, ProcedureType } from '$types';

	type ThresholdSettings = Pick<OrganizationSettings, 'threshold_works' | 'threshold_services_central' | 'threshold_services_decentral' | 'threshold_social_services'> | null;

	type ProfileTab = 'organisatie' | 'project' | 'financieel' | 'planning' | 'documenten';

	interface FormState {
		project_goal: string;
		scope_description: string;
		estimated_value: number | null;
		currency: string;
		cpv_codes: string[];
	}

	export let activeTab: ProfileTab;
	export let form: FormState;
	export let saving: boolean;
	export let organization: Partial<Organization> | null;
	export let profile: ProjectProfile | null;
	export let project: { id: string; procedure_type: string | null; organization_id: string };
	export let authorityType: ContractingAuthorityType;
	export let orgThresholds: ThresholdSettings;
	export let deviationJustification: string;
	export let planningMilestones: TimelineMilestone[];
	export let showUploadPopup: boolean;

	export let onSave: () => void;
	export let onMilestonesChange: (updated: TimelineMilestone[]) => void;

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
		currency: 'Valuta',
		cpv_codes: 'CPV-codes'
	};
</script>

<form on:submit|preventDefault={onSave} class="lg:col-span-2">
	<div class="rounded-card bg-white shadow-card">
		<div class="flex items-center justify-between border-b border-gray-100 px-6 pt-6 pb-4">
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
					<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
					</svg>
				</div>
				<h2 class="text-base font-semibold text-gray-900">
					{TABS.find((t) => t.id === activeTab)?.label ?? ''} bewerken
				</h2>
			</div>
			<button type="submit" disabled={saving}
				class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
				title={saving ? 'Opslaan...' : 'Opslaan'} aria-label="Opslaan">
				{#if saving}
					<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				{:else}
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
						<polyline points="17 21 17 13 7 13 7 21"/>
						<polyline points="7 3 7 8 15 8"/>
					</svg>
				{/if}
			</button>
		</div>

		<div class="px-6 py-6">
			{#if activeTab === 'organisatie'}
				<OrganizationTab {organization} />
			{:else if activeTab === 'project'}
				<div class="space-y-5">
					<div>
						<label for="project_goal" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.project_goal}</label>
						<textarea id="project_goal" bind:value={form.project_goal} rows="3"
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
							placeholder="Wat is het doel van dit project?"></textarea>
					</div>
					<div>
						<label for="scope_description" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.scope_description}</label>
						<textarea id="scope_description" bind:value={form.scope_description} rows="4"
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
							placeholder="Beschrijf de scope en omvang van de opdracht"></textarea>
					</div>
				</div>
			{:else if activeTab === 'financieel'}
				<div class="space-y-5">
					<div>
						<label for="estimated_value" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.estimated_value}</label>
						<div class="relative mt-1">
							<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">&euro;</span>
							<input id="estimated_value" type="number" bind:value={form.estimated_value}
								class="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
								placeholder="0" min="0" step="1000" />
						</div>
					</div>
					<div>
						<CodeLookup
							label={FIELD_LABELS.cpv_codes}
							apiUrl="/api/cpv"
							selected={form.cpv_codes}
							placeholder="Zoek CPV-code of omschrijving..."
							on:change={(e) => { form.cpv_codes = e.detail; }}
						/>
					</div>
					<ProcedureAdvisor
						estimatedValue={form.estimated_value}
						{authorityType}
						settings={orgThresholds}
						chosenProcedure={project.procedure_type as ProcedureType | null}
						bind:deviationJustification
						editing={true}
					/>
				</div>
			{:else if activeTab === 'planning'}
				<PlanningMilestones
					procedureType={project.procedure_type as ProcedureType | null}
					anchorDate={profile?.timeline_start || new Date().toISOString().split('T')[0]}
					milestones={planningMilestones}
					disabled={false}
					onMilestonesChange={onMilestonesChange}
				/>
			{:else if activeTab === 'documenten'}
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500">Documenten worden beheerd via de documentenpagina.</p>
						<a href="/projects/{project.id}/documents"
							class="mt-4 inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
							Naar documenten
						</a>
					</div>
					<button type="button" on:click={() => (showUploadPopup = true)}
						class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white shadow-md hover:bg-primary-700 transition-colors"
						title="Document uploaden" aria-label="Document uploaden">
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</div>
</form>
