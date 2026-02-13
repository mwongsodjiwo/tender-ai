<script lang="ts">
	import { onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import {
		PROJECT_PHASES,
		PROJECT_PHASE_LABELS,
		PROCEDURE_TYPE_LABELS,
		type ProjectPhase,
		type PhaseActivity
	} from '$types';
	import PhaseIndicator from '$lib/components/PhaseIndicator.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import ActivityChecklist from '$lib/components/ActivityChecklist.svelte';

	export let data: PageData;

	$: project = data.project;
	$: artifacts = data.artifacts;
	$: members = data.members as { id: string; profile_id: string; profile: { first_name: string; last_name: string; email: string }; roles: { role: import('$types').ProjectRole }[] }[];
	$: projectMetrics = data.projectMetrics as {
		totalSections: number;
		approvedSections: number;
		progressPercentage: number;
	};
	$: sectionsInReview = data.sectionsInReview as {
		id: string;
		title: string;
		reviewerName: string;
		reviewerEmail: string;
		reviewStatus: string;
		waitingSince: string;
	}[];
	$: documentBlocks = data.documentBlocks as {
		docType: { id: string; name: string; slug: string };
		items: typeof artifacts;
		total: number;
		approved: number;
		progress: number;
	}[];
	$: auditEntries = (data.auditEntries ?? []) as {
		id: string;
		action: string;
		entity_type: string;
		actor_email: string | null;
		changes: Record<string, unknown>;
		created_at: string;
	}[];
	$: dbActivities = (data.phaseActivities ?? []) as PhaseActivity[];
	$: profileSummary = data.profileSummary as { id: string; contracting_authority: string; project_goal: string; planning_generated_at: string | null } | null;
	$: leidraadDocTypeId = data.leidraadDocTypeId as string | null;

	// Current phase from project data
	$: currentPhase = (project.current_phase ?? 'preparing') as ProjectPhase;
	$: currentPhaseIndex = PROJECT_PHASES.indexOf(currentPhase);

	// Auto-poll when project is generating artifacts
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	$: if (project.status === 'generating') {
		if (!pollTimer) {
			pollTimer = setInterval(() => {
				invalidateAll();
			}, 10000);
		}
	} else {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
	});

	// Deadline calculation
	$: deadlineDays = project.deadline_date
		? Math.ceil((new Date(project.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
		: null;

	const ROLE_LABELS: Record<string, string> = {
		project_leader: 'Projectleider',
		procurement_advisor: 'Inkoopadviseur',
		legal_advisor: 'Jurist',
		budget_holder: 'Budgethouder',
		subject_expert: 'Vakinhoudelijk expert',
		viewer: 'Bekijker'
	};

	const AUDIT_ACTION_LABELS: Record<string, string> = {
		create: 'Aangemaakt',
		update: 'Bijgewerkt',
		delete: 'Verwijderd',
		generate: 'Gegenereerd',
		approve: 'Goedgekeurd',
		reject: 'Afgewezen',
		invite: 'Uitgenodigd',
		export: 'Geexporteerd',
		upload: 'Geupload'
	};

	function timeAgo(dateStr: string): string {
		const diff = Date.now() - new Date(dateStr).getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return 'Zojuist';
		if (minutes < 60) return `${minutes} min geleden`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} uur geleden`;
		const days = Math.floor(hours / 24);
		if (days === 1) return 'Gisteren';
		return `${days} dagen geleden`;
	}

	function getInitials(firstName: string, lastName: string): string {
		return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
	}

	function getMemberName(profileId: string): string {
		const member = members.find((m) => m.profile_id === profileId);
		if (!member?.profile) return '';
		return `${member.profile.first_name ?? ''} ${member.profile.last_name ?? ''}`.trim();
	}

	// Phase-specific fallback activities (used when no DB activities exist for a phase)
	type ActivityItem = {
		label: string;
		status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
		href: string | null;
		dueDate?: string | null;
		assignedToName?: string | null;
	};

	const FALLBACK_PHASE_ACTIVITIES: Record<ProjectPhase, (projectId: string) => ActivityItem[]> = {
		preparing: (pid) => [
			{
				label: 'Briefing starten',
				status: project.status === 'draft' ? 'not_started' : 'completed',
				href: `/projects/${pid}/briefing`
			},
			{
				label: 'Projectprofiel invullen',
				status: profileSummary ? 'completed' : project.status === 'draft' ? 'not_started' : 'in_progress',
				href: `/projects/${pid}/profile`
			},
			{
				label: 'Projectprofiel bevestigen',
				status: project.profile_confirmed ? 'completed' : 'not_started',
				href: `/projects/${pid}/profile`
			},
			{
				label: 'Team samenstellen',
				status: members.length > 1 ? 'completed' : 'not_started',
				href: `/projects/${pid}/team`
			}
		],
		exploring: (pid) => [
			{ label: 'Deskresearch uitvoeren', status: 'not_started', href: `/projects/${pid}/marktverkenning?tab=deskresearch` },
			{ label: 'Request for Information (RFI)', status: 'not_started', href: `/projects/${pid}/marktverkenning?tab=rfi` },
			{ label: 'Marktconsultatie', status: 'not_started', href: `/projects/${pid}/marktverkenning?tab=consultatie` },
			{ label: 'Marktverkenningsrapport opstellen', status: 'not_started', href: `/projects/${pid}/marktverkenning?tab=rapport` }
		],
		specifying: (pid) => [
			{
				label: 'Programma van Eisen (PvE)',
				status: documentBlocks.find((b) => b.docType.slug === 'programma-van-eisen') ? 'in_progress' : 'not_started',
				href: `/projects/${pid}/requirements`
			},
			{
				label: 'Aanbestedingsleidraad',
				status: documentBlocks.find((b) => b.docType.slug === 'aanbestedingsleidraad') ? 'in_progress' : 'not_started',
				href: leidraadDocTypeId ? `/projects/${pid}/documents/${leidraadDocTypeId}` : `/projects/${pid}/documents`
			},
			{ label: 'Gunningscriteria (EMVI)', status: 'not_started', href: `/projects/${pid}/emvi` },
			{ label: 'UEA configureren', status: 'not_started', href: `/projects/${pid}/uea` },
			{ label: 'Conceptovereenkomst', status: 'not_started', href: `/projects/${pid}/contract` }
		],
		tendering: (pid) => [
			{ label: 'Publicatie op TenderNed', status: 'not_started', href: null },
			{ label: 'Nota van Inlichtingen beantwoorden', status: 'not_started', href: `/projects/${pid}/correspondence` },
			{ label: 'Inschrijvingen beoordelen', status: 'not_started', href: `/projects/${pid}/evaluations` },
			{ label: 'Gunningsbeslissing', status: 'not_started', href: `/projects/${pid}/evaluations` },
			{ label: 'Afwijzingsbrieven versturen', status: 'not_started', href: `/projects/${pid}/correspondence` }
		],
		contracting: (pid) => [
			{ label: 'Definitieve overeenkomst opstellen', status: 'not_started', href: `/projects/${pid}/contract` },
			{ label: 'Uitnodiging tot ondertekening', status: 'not_started', href: `/projects/${pid}/correspondence` },
			{ label: 'Contract ondertekend', status: 'not_started', href: null }
		]
	};

	// Resolve activity title to a navigable href
	const TITLE_ROUTE_MAP: [RegExp, (pid: string) => string][] = [
		[/programma van eisen/i, (pid) => `/projects/${pid}/requirements`],
		[/aanbestedingsleidraad/i, (pid) => leidraadDocTypeId ? `/projects/${pid}/documents/${leidraadDocTypeId}` : `/projects/${pid}/documents`],
		[/conceptovereenkomst/i, (pid) => `/projects/${pid}/contract`],
		[/uniform europees|uea/i, (pid) => `/projects/${pid}/uea`],
		[/nota van inlichtingen/i, (pid) => `/projects/${pid}/correspondence`],
		[/selectieleidraad/i, (pid) => `/projects/${pid}/documents`],
		[/gunningscriteria|emvi/i, (pid) => `/projects/${pid}/emvi`],
		[/marktverkenning|deskresearch|rfi|marktconsultatie/i, (pid) => `/projects/${pid}/marktverkenning`],
		[/briefing/i, (pid) => `/projects/${pid}/briefing`],
		[/profiel/i, (pid) => `/projects/${pid}/profile`],
		[/team/i, (pid) => `/projects/${pid}/team`]
	];

	function getActivityHref(title: string): string | null {
		for (const [pattern, resolver] of TITLE_ROUTE_MAP) {
			if (pattern.test(title)) return resolver(project.id);
		}
		return null;
	}

	// Build activities per phase: use DB activities if available, else fallback
	function getActivitiesForPhase(phase: ProjectPhase): ActivityItem[] {
		const dbForPhase = dbActivities.filter((a) => a.phase === phase);
		if (dbForPhase.length > 0) {
			return dbForPhase.map((a) => ({
				label: a.title,
				status: a.status,
				href: getActivityHref(a.title),
				dueDate: a.due_date ?? null,
				assignedToName: a.assigned_to ? getMemberName(a.assigned_to) : null
			}));
		}
		return FALLBACK_PHASE_ACTIVITIES[phase](project.id);
	}

	// Selected phase for the interactive phasebar — purely local state
	let selectedPhase: ProjectPhase | null = null;
	let userHasSelected = false;

	// Initialize selectedPhase from currentPhase on first render / when project changes
	$: if (!userHasSelected) {
		selectedPhase = currentPhase;
	}

	// Ensure selectedPhase always has a valid value
	$: effectiveSelectedPhase = selectedPhase ?? currentPhase;

	function handlePhaseSelect(event: CustomEvent<ProjectPhase>) {
		userHasSelected = true;
		selectedPhase = event.detail;
	}

	function phaseCompletionCount(phase: ProjectPhase): { completed: number; total: number } {
		const activities = getActivitiesForPhase(phase);
		return {
			completed: activities.filter((a) => a.status === 'completed').length,
			total: activities.length
		};
	}

	function phaseStatus(phaseIndex: number): 'completed' | 'current' | 'upcoming' {
		if (phaseIndex < currentPhaseIndex) return 'completed';
		if (phaseIndex === currentPhaseIndex) return 'current';
		return 'upcoming';
	}

	// Derived values for the selected phase card
	$: selectedPhaseIndex = PROJECT_PHASES.indexOf(effectiveSelectedPhase);
	$: selectedStatus = phaseStatus(selectedPhaseIndex);
	$: selectedCompletion = phaseCompletionCount(effectiveSelectedPhase);
	$: selectedActivities = getActivitiesForPhase(effectiveSelectedPhase);

	// Phase-specific tools — each tool links to a page relevant for that phase
	type PhaseTool = {
		label: string;
		description: string;
		href: string;
		icon: 'briefing' | 'profile' | 'team' | 'documents' | 'market' | 'requirements' | 'leidraad' | 'emvi' | 'uea' | 'contract' | 'correspondence' | 'evaluations' | 'tenderned';
	};

	const PHASE_TOOLS: Record<ProjectPhase, (pid: string) => PhaseTool[]> = {
		preparing: () => [],
		exploring: (pid) => [
			{ label: 'Marktverkenning', description: 'Deskresearch, RFI en consultatie', href: `/projects/${pid}/marktverkenning`, icon: 'market' }
		],
		specifying: (pid) => [
			{ label: 'Programma van Eisen', description: 'Eisen en wensen opstellen', href: `/projects/${pid}/requirements`, icon: 'requirements' },
			{ label: 'Gunningscriteria', description: 'EMVI-wegingstool', href: `/projects/${pid}/emvi`, icon: 'emvi' },
			{ label: 'UEA', description: 'Uniform Europees Aanbestedingsdocument', href: `/projects/${pid}/uea`, icon: 'uea' }
		],
		tendering: (pid) => [
			{ label: 'Beoordelingen', description: 'Inschrijvingen beoordelen', href: `/projects/${pid}/evaluations`, icon: 'evaluations' }
		],
		contracting: () => []
	};

	$: selectedPhaseTools = PHASE_TOOLS[effectiveSelectedPhase](project.id);
</script>

<svelte:head>
	<title>{project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<!-- Interactive phase indicator -->
	<div class="px-4 py-6 sm:px-6">
		<PhaseIndicator
			{currentPhase}
			interactive={true}
			selectedPhase={effectiveSelectedPhase}
			on:phaseSelect={handlePhaseSelect}
		/>
	</div>

	<!-- Project header -->
	<div class="rounded-card bg-white p-6 shadow-card">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">{project.name}</h1>
			{#if project.description}
				<p class="mt-1 text-gray-600">{project.description}</p>
			{/if}
		</div>

		<div class="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
			{#if project.procedure_type}
				<span>Procedure: {PROCEDURE_TYPE_LABELS[project.procedure_type] ?? project.procedure_type}</span>
			{/if}
			{#if project.estimated_value}
				<span>Waarde: &euro;{project.estimated_value.toLocaleString('nl-NL')}</span>
			{/if}
		</div>

		{#if currentPhase === 'preparing' && !project.profile_confirmed}
			<div class="mt-4 flex gap-3">
				{#if project.status === 'draft' || project.status === 'briefing'}
					<a
						href="/projects/{project.id}/briefing"
						class="inline-flex items-center justify-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
					>
						{project.status === 'draft' ? 'Briefing starten' : 'Briefing voortzetten'}
					</a>
				{/if}
				<a
					href="/projects/{project.id}/profile"
					class="inline-flex items-center justify-center rounded-card border border-primary-300 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
				>
					Projectprofiel invullen
				</a>
			</div>
		{/if}
	</div>

	<!-- Profile confirmation banner -->
	{#if currentPhase === 'preparing' && !project.profile_confirmed && profileSummary}
		<InfoBanner
			type="warning"
			title="Projectprofiel nog niet bevestigd"
			message="Het projectprofiel is ingevuld maar nog niet bevestigd. Bevestig het profiel om door te gaan naar de volgende fase."
		/>
	{/if}

	<!-- Planning suggestion banner -->
	{#if project.profile_confirmed && profileSummary && !profileSummary.planning_generated_at}
		<div class="rounded-card bg-blue-50 border border-blue-200 p-5 shadow-card">
			<div class="flex items-start gap-4">
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
					<svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
					</svg>
				</div>
				<div class="flex-1">
					<h3 class="text-sm font-semibold text-blue-900">AI-planning beschikbaar</h3>
					<p class="mt-1 text-sm text-blue-700">
						Het projectprofiel is bevestigd. Laat de AI een realistische planning genereren
						op basis van het gekozen procedure-type en de scope van dit project.
					</p>
					<a
						href="/projects/{project.id}/planning?tab=ai"
						class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					>
						Planning genereren
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</a>
				</div>
			</div>
		</div>
	{/if}

	<!-- Top row: 3 metric cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-card bg-white p-6 shadow-card">
			<p class="text-sm font-medium text-gray-500">Voortgang</p>
			<p class="mt-2 text-3xl font-bold text-gray-900">{projectMetrics.progressPercentage}%</p>
			<p class="mt-1 text-sm text-gray-500">{projectMetrics.approvedSections} van {projectMetrics.totalSections} secties afgerond</p>
			<div class="mt-3">
				<ProgressBar value={projectMetrics.approvedSections} max={projectMetrics.totalSections || 1} showPercentage={false} size="sm" />
			</div>
		</div>

		<div class="rounded-card bg-white p-6 shadow-card">
			<p class="text-sm font-medium text-gray-500">Huidige fase</p>
			<p class="mt-2 text-2xl font-bold text-gray-900">{PROJECT_PHASE_LABELS[currentPhase]}</p>
			<p class="mt-1 text-sm text-gray-500">
				{phaseCompletionCount(currentPhase).completed} van {phaseCompletionCount(currentPhase).total} activiteiten afgerond
			</p>
		</div>

		<div class="rounded-card bg-white p-6 shadow-card">
			<p class="text-sm font-medium text-gray-500">Deadline</p>
			{#if project.deadline_date}
				{@const days = deadlineDays ?? 0}
				<p class="mt-2 text-3xl font-bold {days <= 3 ? 'text-error-600' : days <= 7 ? 'text-warning-600' : 'text-gray-900'}">
					{new Date(project.deadline_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
				</p>
				<p class="mt-1 text-sm {days <= 3 ? 'text-error-600 font-medium' : 'text-gray-500'}">
					{#if days < 0}
						{Math.abs(days)} dagen verlopen
					{:else if days === 0}
						Vandaag
					{:else if days === 1}
						Nog 1 dag
					{:else}
						Nog {days} dagen
					{/if}
				</p>
			{:else}
				<p class="mt-2 text-lg text-gray-300">Niet ingesteld</p>
			{/if}
		</div>
	</div>

	<!-- Phase activities + sidebar -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
		<!-- Phase checklists (spans 2 cols) -->
		<div class="space-y-4 lg:col-span-2">
			<!-- Selected phase card (always expanded) -->
			<div class="rounded-card bg-white shadow-card overflow-hidden">
				<div class="flex w-full items-center gap-4 p-5">
					<!-- Phase status icon -->
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold
							{selectedStatus === 'completed'
								? 'bg-success-100 text-success-600'
								: selectedStatus === 'current'
									? 'bg-primary-600 text-white ring-4 ring-primary-100'
									: 'bg-gray-100 text-gray-400'}"
					>
						{#if selectedStatus === 'completed'}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{:else}
							{selectedPhaseIndex + 1}
						{/if}
					</div>

					<div class="flex-1 min-w-0">
						<h2 class="text-base font-semibold {selectedStatus === 'upcoming' ? 'text-gray-400' : 'text-gray-900'}">
							{PROJECT_PHASE_LABELS[effectiveSelectedPhase]}
						</h2>
					</div>

					<span class="text-sm text-gray-500">{selectedCompletion.completed}/{selectedCompletion.total}</span>
				</div>

				<div class="border-t border-gray-100 px-5 pb-5 pt-3">
					{#if selectedCompletion.total > 0}
						<div class="mb-3">
							<ProgressBar value={selectedCompletion.completed} max={selectedCompletion.total || 1} showPercentage={false} size="sm" />
						</div>
					{/if}
					<ActivityChecklist activities={selectedActivities} />
				</div>
			</div>

			<!-- Phase tools -->
			{#if selectedPhaseTools.length > 0}
				<div class="space-y-3">
					<h2 class="text-base font-semibold text-gray-900">Tools</h2>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{#each selectedPhaseTools as tool (tool.href)}
							<a
								href={tool.href}
								class="flex items-start gap-3 rounded-card bg-white p-4 shadow-card transition-all hover:shadow-card-hover"
							>
								<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
									{#if tool.icon === 'briefing'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
										</svg>
									{:else if tool.icon === 'profile'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.375 3.375h4.5" />
										</svg>
									{:else if tool.icon === 'team'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
										</svg>
									{:else if tool.icon === 'documents'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
										</svg>
									{:else if tool.icon === 'market'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
										</svg>
									{:else if tool.icon === 'requirements'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
										</svg>
									{:else if tool.icon === 'leidraad'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
										</svg>
									{:else if tool.icon === 'emvi'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
										</svg>
									{:else if tool.icon === 'uea'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
										</svg>
									{:else if tool.icon === 'contract'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
										</svg>
									{:else if tool.icon === 'correspondence'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
										</svg>
									{:else if tool.icon === 'evaluations'}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
										</svg>
									{:else}
										<svg class="h-4.5 w-4.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17l-5.1-3.18M5.52 9.03l5.1-3.18M17.82 12l-5.1 3.18m0-6.36l5.1 3.18M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
										</svg>
									{/if}
								</div>
								<div class="min-w-0">
									<p class="text-sm font-semibold text-gray-900">{tool.label}</p>
									<p class="mt-0.5 text-xs text-gray-500">{tool.description}</p>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Document blocks (show in specifying phase and beyond) -->
			{#if currentPhase === 'specifying' || currentPhase === 'tendering' || currentPhase === 'contracting'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-gray-900">Documenten</h2>
						<a href="/projects/{project.id}/documents" class="text-sm font-medium text-primary-600 hover:text-primary-700">
							Alle documenten &rarr;
						</a>
					</div>
					{#if documentBlocks.length === 0}
						{#if project.status === 'generating'}
							<InfoBanner type="warning" title="Documenten worden gegenereerd" message="Dit kan enkele minuten duren. De pagina ververst automatisch." />
						{:else}
							<InfoBanner type="info" message="Voltooi eerst de briefing om documenten te laten genereren." />
						{/if}
					{:else}
						<CardGrid columns={2}>
							{#each documentBlocks as block}
								<a
									href={block.docType.slug === 'programma-van-eisen'
										? `/projects/${project.id}/requirements`
										: block.docType.slug === 'conceptovereenkomst'
											? `/projects/${project.id}/contract`
											: block.docType.slug === 'uniform-europees-aanbestedingsdocument'
												? `/projects/${project.id}/uea`
												: `/projects/${project.id}/documents/${block.docType.id}`}
									class="block rounded-card bg-white p-5 shadow-card transition-all hover:shadow-card-hover"
								>
									<div class="flex items-start justify-between">
										<h3 class="font-medium text-gray-900">{block.docType.name}</h3>
										<span class="text-xs text-gray-400">{block.total} secties</span>
									</div>
									<div class="mt-3">
										<ProgressBar value={block.approved} max={block.total || 1} size="sm" label="" />
									</div>
									<div class="mt-2 flex items-center justify-between text-xs text-gray-500">
										<span>{block.approved} van {block.total} goedgekeurd</span>
										<span class="font-medium text-primary-600">{block.progress}%</span>
									</div>
								</a>
							{/each}
							<!-- EMVI tool card -->
							<a
								href="/projects/{project.id}/emvi"
								class="block rounded-card bg-white p-5 shadow-card transition-all hover:shadow-card-hover"
							>
								<div class="flex items-start justify-between">
									<h3 class="font-medium text-gray-900">Gunningscriteria (EMVI)</h3>
									<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
									</svg>
								</div>
								<p class="mt-2 text-sm text-gray-500">Beheer gunningssystematiek en wegingscriteria</p>
								<div class="mt-3 text-sm font-medium text-primary-600">
									Wegingstool openen &rarr;
								</div>
							</a>
						</CardGrid>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Right sidebar -->
		<div class="space-y-4">
			<!-- Sections in review -->
			{#if sectionsInReview.length > 0}
				<div class="rounded-card bg-white p-6 shadow-card">
					<h2 class="text-base font-semibold text-gray-900">Secties in review</h2>
					<div class="mt-4 space-y-3">
						{#each sectionsInReview as section}
							<div class="rounded-lg border border-gray-100 p-3">
								<p class="text-sm font-medium text-gray-900">{section.title}</p>
								{#if section.reviewerName}
									<p class="mt-1 text-xs text-gray-500">Reviewer: {section.reviewerName}</p>
								{/if}
								<p class="mt-1 text-xs text-gray-400">{timeAgo(section.waitingSince)}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Team preview -->
			<div class="rounded-card bg-white p-6 shadow-card">
				<div class="flex items-center justify-between">
					<h2 class="text-base font-semibold text-gray-900">Team</h2>
					<a href="/projects/{project.id}/team" class="text-sm font-medium text-primary-600 hover:text-primary-700">
						Bekijk &rarr;
					</a>
				</div>
				{#if members.length === 0}
					<p class="mt-4 text-sm text-gray-500">Nog geen teamleden.</p>
				{:else}
					<div class="mt-4 space-y-3">
						{#each members.slice(0, 5) as member}
							<div class="flex items-center gap-3">
								<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
									{getInitials(member.profile?.first_name ?? '', member.profile?.last_name ?? '')}
								</div>
								<div class="min-w-0">
									<p class="text-sm font-medium text-gray-900 truncate">
										{member.profile?.first_name ?? ''} {member.profile?.last_name ?? ''}
									</p>
									<div class="flex flex-wrap gap-1 mt-0.5">
										{#each member.roles ?? [] as r}
											<span class="text-xs text-gray-500">{ROLE_LABELS[r.role] ?? r.role}</span>
										{/each}
									</div>
								</div>
							</div>
						{/each}
						{#if members.length > 5}
							<p class="text-xs text-gray-400">+{members.length - 5} meer</p>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Recente activiteit -->
			<div class="rounded-card bg-white p-6 shadow-card">
				<div class="flex items-center justify-between">
					<h2 class="text-base font-semibold text-gray-900">Recente activiteit</h2>
					<a href="/projects/{project.id}/audit" class="text-sm font-medium text-primary-600 hover:text-primary-700">
						Bekijk &rarr;
					</a>
				</div>
				{#if auditEntries.length === 0}
					<p class="mt-4 text-sm text-gray-500">Nog geen activiteit.</p>
				{:else}
					<div class="mt-4 space-y-3">
						{#each auditEntries as entry}
							<div class="flex gap-3">
								<div class="mt-1 h-2 w-2 shrink-0 rounded-full bg-gray-300"></div>
								<div class="min-w-0">
									<p class="text-sm text-gray-700">
										<span class="font-medium">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</span>
										{#if entry.entity_type}
											<span class="text-gray-500"> — {entry.entity_type}</span>
										{/if}
									</p>
									<p class="text-xs text-gray-400">
										{entry.actor_email ? `${entry.actor_email} · ` : ''}{timeAgo(entry.created_at)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
