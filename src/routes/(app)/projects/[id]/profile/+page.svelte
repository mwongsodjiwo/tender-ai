<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { ProjectProfile, Document, Organization, OrganizationSettings, Milestone } from '$types';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import ProfileForm from '$lib/components/profile/ProfileForm.svelte';
	import ProfileTabs from '$lib/components/profile/ProfileTabs.svelte';
	import ProfileSidebar from '$lib/components/profile/ProfileSidebar.svelte';
	import ProfileUploadModal from '$lib/components/profile/ProfileUploadModal.svelte';
	import { saveProfile as doSaveProfile, confirmProfile as doConfirmProfile } from '$lib/utils/profile-actions';
	import type { TimelineMilestone } from '$lib/utils/procurement-timeline.js';
	import type { ContractingAuthorityType, ProcedureType } from '$types';

	type ThresholdSettings = Pick<OrganizationSettings, 'threshold_works' | 'threshold_services_central' | 'threshold_services_decentral' | 'threshold_social_services'> | null;

	export let data: PageData;

	$: project = data.project;
	$: profile = data.profile as ProjectProfile | null;
	$: documents = (data.documents ?? []) as Document[];
	$: organization = (data.organization ?? null) as Partial<Organization> | null;
	$: milestones = (data.milestones ?? []) as Milestone[];

	type ProfileTab = 'organisatie' | 'project' | 'financieel' | 'planning' | 'documenten';
	let activeTab: ProfileTab = 'organisatie';

	const TABS: { id: ProfileTab; label: string }[] = [
		{ id: 'organisatie', label: 'Organisatie' },
		{ id: 'project', label: 'Project' },
		{ id: 'financieel', label: 'Financieel' },
		{ id: 'planning', label: 'Planning' },
		{ id: 'documenten', label: 'Documenten' }
	];

	let editing = false, saving = false, confirming = false;
	let error = '', success = '';
	let showUploadPopup = false, deviationJustification = '';
	let planningMilestones: TimelineMilestone[] = [];

	$: authorityType = (data.authorityType ?? 'decentraal') as ContractingAuthorityType;
	$: orgThresholds = (data.orgThresholds ?? null) as ThresholdSettings;

	$: effectiveMilestones = milestones.length > 0
		? milestones
		: planningMilestones.map((m) => ({
				...m,
				id: m.milestone_type,
				project_id: project.id
			})) as unknown as Milestone[];

	let form = {
		project_goal: '',
		scope_description: '',
		estimated_value: null as number | null,
		currency: 'EUR',
		cpv_codes: [] as string[]
	};

	$: if (profile) {
		form = {
			project_goal: profile.project_goal ?? '',
			scope_description: profile.scope_description ?? '',
			estimated_value: profile.estimated_value,
			currency: profile.currency ?? 'EUR',
			cpv_codes: [...(profile.cpv_codes ?? [])]
		};
	}

	function startEditing(): void { editing = true; error = ''; success = ''; }
	function cancelEditing(): void { editing = false; error = ''; }

	async function handleSave(): Promise<void> {
		saving = true;
		error = '';
		success = '';
		const result = await doSaveProfile(project.id, {
			project_goal: form.project_goal,
			scope_description: form.scope_description,
			estimated_value: form.estimated_value ?? undefined,
			currency: form.currency,
			cpv_codes: form.cpv_codes
		}, !!profile, planningMilestones, milestones);
		error = result.error;
		success = result.success;
		saving = false;
		if (!result.error) editing = false;
	}

	async function handleConfirm(): Promise<void> {
		confirming = true;
		error = '';
		success = '';
		const result = await doConfirmProfile(project.id);
		error = result.error;
		success = result.success;
		confirming = false;
	}

	function handleKeydown(e: KeyboardEvent): void { if (e.key === 'Escape' && editing) cancelEditing(); }
	function handleUploadComplete(): void { showUploadPopup = false; invalidateAll(); }
</script>

<svelte:head>
	<title>Projectprofiel — {project.name} — Tendermanager</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="space-y-6">
	<h1 class="text-2xl font-semibold text-gray-900">Projectprofiel</h1>

	<nav class="-mb-px flex gap-6 border-b border-gray-200" aria-label="Profiel tabbladen">
		{#each TABS as tab (tab.id)}
			<button
				on:click={() => (activeTab = tab.id)}
				class="whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors
					{activeTab === tab.id
						? 'border-primary-600 text-primary-600'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
				aria-selected={activeTab === tab.id}
				role="tab"
			>
				{tab.label}
			</button>
		{/each}
	</nav>

	{#if error}
		<InfoBanner type="warning" message={error} />
	{/if}
	{#if success}
		<InfoBanner type="info" message={success} />
	{/if}

	{#if !profile && !editing}
		<div class="rounded-card bg-white p-8 shadow-card text-center">
			<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
			</svg>
			<h2 class="mt-4 text-lg font-semibold text-gray-900">Nog geen projectprofiel</h2>
			<p class="mt-2 text-sm text-gray-500">Vul het projectprofiel in om te beginnen met de voorbereiding.</p>
			<button on:click={startEditing}
				class="mt-6 rounded-card bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
				Profiel invullen
			</button>
		</div>
	{:else if editing}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<ProfileForm
				{activeTab}
				{form}
				{saving}
				{organization}
				{profile}
				{project}
				{authorityType}
				{orgThresholds}
				bind:deviationJustification
				{planningMilestones}
				bind:showUploadPopup
				onSave={handleSave}
				onMilestonesChange={(u) => { planningMilestones = u; }}
			/>
			<ProfileSidebar {project} {profile} milestones={effectiveMilestones} {confirming} onConfirm={handleConfirm} />
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="lg:col-span-2">
				<ProfileTabs
					{activeTab}
					{profile}
					{project}
					{documents}
					{organization}
					{authorityType}
					{orgThresholds}
					bind:deviationJustification
					{planningMilestones}
					onEdit={startEditing}
					onShowUpload={() => { showUploadPopup = true; }}
				/>
			</div>
			<ProfileSidebar {project} {profile} milestones={effectiveMilestones} {confirming} onConfirm={handleConfirm} />
		</div>
	{/if}
</div>

{#if showUploadPopup}
	<ProfileUploadModal
		projectId={project.id}
		organizationId={project.organization_id}
		onClose={() => { showUploadPopup = false; }}
		onUploadComplete={handleUploadComplete}
	/>
{/if}
