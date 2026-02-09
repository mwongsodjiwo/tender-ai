<script lang="ts">
	import { onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import {
		PROCEDURE_TYPE_LABELS,
		PROJECT_PHASE_LABELS,
		type ProjectPhase
	} from '$types';
	import RoleSwitcher from '$components/RoleSwitcher.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import ActivityChecklist from '$lib/components/ActivityChecklist.svelte';

	export let data: PageData;

	$: project = data.project;
	$: artifacts = data.artifacts;
	$: members = data.members as { id: string; profile: { first_name: string; last_name: string; email: string }; roles: { role: import('$types').ProjectRole }[] }[];
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

	// Current phase from project data
	$: currentPhase = (project.current_phase ?? 'preparing') as ProjectPhase;

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

	// Current user's roles
	$: currentUserRoles = (() => {
		const currentMember = members.find(
			(m) => m.profile?.email === data.profile?.email
		);
		return currentMember?.roles?.map((r) => r.role) ?? [];
	})();
	let activeRole: import('$types').ProjectRole = 'viewer';
	$: if (currentUserRoles.length > 0 && !currentUserRoles.includes(activeRole)) {
		activeRole = currentUserRoles[0];
	}

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

	// Phase-specific activities
	type ActivityItem = {
		label: string;
		status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
		href: string | null;
	};

	const PHASE_ACTIVITIES: Record<ProjectPhase, (projectId: string) => ActivityItem[]> = {
		preparing: (pid) => [
			{
				label: 'Briefing starten',
				status: project.status === 'draft' ? 'not_started' : 'completed',
				href: `/projects/${pid}/briefing`
			},
			{
				label: 'Projectprofiel invullen',
				status: project.status === 'draft' ? 'not_started' : project.briefing_data && Object.keys(project.briefing_data).length > 0 ? 'completed' : 'in_progress',
				href: `/projects/${pid}/profile`
			},
			{
				label: 'Projectprofiel bevestigen',
				status: 'not_started',
				href: `/projects/${pid}/profile`
			},
			{
				label: 'Team samenstellen',
				status: members.length > 1 ? 'completed' : 'not_started',
				href: `/projects/${pid}/team`
			}
		],
		exploring: (pid) => [
			{
				label: 'Deskresearch uitvoeren',
				status: 'not_started',
				href: null
			},
			{
				label: 'Request for Information (RFI)',
				status: 'not_started',
				href: null
			},
			{
				label: 'Marktconsultatie',
				status: 'not_started',
				href: null
			},
			{
				label: 'Marktverkenningsrapport opstellen',
				status: 'not_started',
				href: null
			}
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
				href: `/projects/${pid}/documents`
			},
			{
				label: 'Gunningscriteria (EMVI)',
				status: 'not_started',
				href: `/projects/${pid}/emvi`
			},
			{
				label: 'UEA configureren',
				status: 'not_started',
				href: `/projects/${pid}/uea`
			},
			{
				label: 'Conceptovereenkomst',
				status: 'not_started',
				href: `/projects/${pid}/contract`
			}
		],
		tendering: (pid) => [
			{
				label: 'Publicatie op TenderNed',
				status: 'not_started',
				href: null
			},
			{
				label: 'Nota van Inlichtingen beantwoorden',
				status: 'not_started',
				href: `/projects/${pid}/correspondence`
			},
			{
				label: 'Inschrijvingen beoordelen',
				status: 'not_started',
				href: null
			},
			{
				label: 'Gunningsbeslissing',
				status: 'not_started',
				href: null
			},
			{
				label: 'Afwijzingsbrieven versturen',
				status: 'not_started',
				href: `/projects/${pid}/correspondence`
			}
		],
		contracting: (pid) => [
			{
				label: 'Definitieve overeenkomst opstellen',
				status: 'not_started',
				href: `/projects/${pid}/contract`
			},
			{
				label: 'Uitnodiging tot ondertekening',
				status: 'not_started',
				href: `/projects/${pid}/correspondence`
			},
			{
				label: 'Contract ondertekend',
				status: 'not_started',
				href: null
			}
		]
	};

	$: phaseActivities = PHASE_ACTIVITIES[currentPhase](project.id);
	$: completedActivities = phaseActivities.filter((a) => a.status === 'completed').length;
</script>

<svelte:head>
	<title>{project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<!-- Project header -->
	<div class="rounded-card bg-white p-6 shadow-card">
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">{project.name}</h1>
				{#if project.description}
					<p class="mt-1 text-gray-600">{project.description}</p>
				{/if}
			</div>
			<StatusBadge status={project.status} />
		</div>

		<div class="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
			{#if project.procedure_type}
				<span>Procedure: {PROCEDURE_TYPE_LABELS[project.procedure_type] ?? project.procedure_type}</span>
			{/if}
			{#if project.estimated_value}
				<span>Waarde: &euro;{project.estimated_value.toLocaleString('nl-NL')}</span>
			{/if}
		</div>

		<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			{#if currentPhase === 'preparing' && (project.status === 'draft' || project.status === 'briefing')}
				<a
					href="/projects/{project.id}/briefing"
					class="inline-flex items-center justify-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:justify-start"
				>
					{project.status === 'draft' ? 'Briefing starten' : 'Briefing voortzetten'}
				</a>
			{:else}
				<div></div>
			{/if}
			<RoleSwitcher roles={currentUserRoles} bind:activeRole />
		</div>
	</div>

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
				{completedActivities} van {phaseActivities.length} activiteiten afgerond
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
		<!-- Activities checklist (spans 2 cols) -->
		<div class="space-y-4 lg:col-span-2">
			<div class="rounded-card bg-white p-6 shadow-card">
				<div class="flex items-center justify-between">
					<h2 class="text-base font-semibold text-gray-900">
						Activiteiten — {PROJECT_PHASE_LABELS[currentPhase]}
					</h2>
					<span class="text-sm text-gray-500">
						{completedActivities}/{phaseActivities.length}
					</span>
				</div>
				<div class="mt-1 mb-4">
					<ProgressBar value={completedActivities} max={phaseActivities.length || 1} showPercentage={false} size="sm" />
				</div>
				<ActivityChecklist activities={phaseActivities} />
			</div>

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
									<!-- Lucide: Scale -->
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
