<script lang="ts">
	import type { PageData } from './$types';
	import type { DashboardMetrics, DashboardRecentProject, MonthlyProjectData } from '$types';
	import { PROJECT_PHASE_LABELS } from '$types';
	import type { ProjectPhase } from '$types';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import MonthlyChart from '$lib/components/MonthlyChart.svelte';

	export let data: PageData;

	$: metrics = data.metrics as DashboardMetrics;
	$: recentProjects = data.recentProjects as DashboardRecentProject[];
	$: upcomingDeadlines = data.upcomingDeadlines as DashboardRecentProject[];
	$: combinedDeadlines = (data.combinedDeadlines ?? []) as {
		id: string;
		type: string;
		title: string;
		date: string;
		project_id: string;
		project_name: string;
		phase: string;
		status: string;
		is_critical: boolean;
		days_remaining: number;
	}[];
	$: monthlyData = data.monthlyData as MonthlyProjectData[];
	$: hasCombinedDeadlines = combinedDeadlines.length > 0;

	const SECTION_STATUS_LABELS: Record<string, string> = {
		draft: 'Concept',
		generated: 'Gegenereerd',
		review: 'In review',
		approved: 'Goedgekeurd',
		rejected: 'Afgewezen'
	};

	const SECTION_STATUS_COLORS: Record<string, string> = {
		draft: 'bg-gray-400',
		generated: 'bg-primary-400',
		review: 'bg-purple-400',
		approved: 'bg-success-500',
		rejected: 'bg-error-400'
	};

	const PHASE_BADGE_COLORS: Record<string, string> = {
		preparing: 'bg-gray-100 text-gray-700',
		exploring: 'bg-primary-100 text-primary-700',
		specifying: 'bg-purple-100 text-purple-700',
		tendering: 'bg-warning-100 text-warning-700',
		contracting: 'bg-success-100 text-success-700'
	};

	function daysUntil(dateStr: string): number {
		const diff = new Date(dateStr).getTime() - new Date().getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
	}

	function phaseLabel(phase: string): string {
		return PROJECT_PHASE_LABELS[phase as ProjectPhase] ?? phase;
	}
</script>

<svelte:head>
	<title>Dashboard — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	{#if !data.hasOrganization}
		<InfoBanner
			type="info"
			title="Nog niet gekoppeld aan een organisatie"
			message="Je bent nog niet gekoppeld aan een organisatie. Neem contact op met de Tendermanager-beheerder."
		/>
	{:else}
		<!-- Page header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
				<p class="mt-1 text-sm text-gray-500">Overzicht van uw projecten en activiteit</p>
			</div>
			<a
				href="/projects/new"
				class="rounded-card bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:bg-primary-700 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
			>
				Nieuw project
			</a>
		</div>

		{#if metrics.total_projects === 0}
			<!-- Empty state -->
			<EmptyState
				title="Geen projecten"
				description="Begin met het aanmaken van uw eerste aanbestedingsproject."
				actionLabel="Nieuw project aanmaken"
				actionHref="/projects/new"
				icon="document"
			/>
		{:else}
			<!-- Top row: Chart + Big metric + Recent projects -->
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<!-- Left: Monthly chart -->
				<MonthlyChart data={monthlyData} />

				<!-- Center: Big metric — Documents in review -->
				<div class="flex flex-col items-center justify-center rounded-card bg-white p-6 shadow-card">
					<p class="text-sm font-medium text-gray-500">Documenten in review</p>
					<p class="mt-3 text-5xl font-bold tracking-tight text-gray-900">{metrics.in_review_count}</p>
					{#if metrics.in_review_trend > 0}
						<div class="mt-3 flex items-center gap-1 text-sm text-success-600">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
							</svg>
							<span>+{metrics.in_review_trend} deze week</span>
						</div>
					{:else}
						<p class="mt-3 text-sm text-gray-400">Geen wijzigingen deze week</p>
					{/if}
					<div class="mt-4 grid w-full grid-cols-2 gap-3 border-t border-gray-100 pt-4">
						<div class="text-center">
							<p class="text-2xl font-bold text-gray-900">{metrics.active_projects}</p>
							<p class="text-xs text-gray-500">Actief</p>
						</div>
						<div class="text-center">
							<p class="text-2xl font-bold text-gray-900">{metrics.completed_projects}</p>
							<p class="text-xs text-gray-500">Afgerond</p>
						</div>
					</div>
				</div>

				<!-- Right: Recent projects table -->
				<div class="rounded-card bg-white p-6 shadow-card">
					<h2 class="text-base font-semibold text-gray-900">Recente projecten</h2>
					{#if recentProjects.length === 0}
						<p class="mt-4 text-sm text-gray-500">Nog geen projecten aangemaakt.</p>
					{:else}
						<div class="mt-4 space-y-3">
							{#each recentProjects as project (project.id)}
								<a
									href="/projects/{project.id}"
									class="block rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
								>
									<div class="flex items-start justify-between">
										<p class="text-sm font-medium text-gray-900">{project.name}</p>
										<span class="rounded-badge px-2 py-0.5 text-xs font-medium {PHASE_BADGE_COLORS[project.current_phase] ?? 'bg-gray-100 text-gray-700'}">
											{phaseLabel(project.current_phase)}
										</span>
									</div>
									<div class="mt-2 flex items-center justify-between">
										<span class="text-xs text-gray-500">
											{#if project.deadline_date}
												{@const days = daysUntil(project.deadline_date)}
												<span class="{days <= 3 ? 'text-error-600 font-medium' : days <= 7 ? 'text-warning-600' : ''}">
													{new Date(project.deadline_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
												</span>
											{:else}
												<span class="text-gray-300">Geen deadline</span>
											{/if}
										</span>
										<div class="flex items-center gap-2">
											<div class="w-16">
												<ProgressBar value={project.progress} size="sm" showPercentage={false} />
											</div>
											<span class="text-xs text-gray-500">{project.progress}%</span>
										</div>
									</div>
								</a>
							{/each}
						</div>
						{#if metrics.total_projects > 5}
							<div class="mt-4 border-t border-gray-100 pt-3">
								<a href="/projects" class="text-sm font-medium text-primary-600 hover:text-primary-700">
									Alle {metrics.total_projects} projecten bekijken →
								</a>
							</div>
						{/if}
					{/if}
				</div>
			</div>

			<!-- Bottom row: Progress gauge + Sections per status + Deadlines -->
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<!-- Left: Average progress gauge -->
				<div class="rounded-card bg-white p-6 shadow-card">
					<h2 class="text-base font-semibold text-gray-900">Projectvoortgang</h2>
					<p class="mt-1 text-sm text-gray-500">Gemiddeld percentage afgerond</p>
					<div class="mt-6 flex items-center justify-center">
						<div class="relative h-36 w-36">
							<svg viewBox="0 0 120 120" class="h-full w-full -rotate-90" role="img" aria-label="Voortgang {metrics.average_progress}%">
								<circle
									cx="60" cy="60" r="50"
									fill="none"
									stroke-width="10"
									class="stroke-gray-100"
								/>
								<circle
									cx="60" cy="60" r="50"
									fill="none"
									stroke-width="10"
									stroke-linecap="round"
									class="stroke-primary-600 transition-all duration-500"
									stroke-dasharray="{Math.PI * 100}"
									stroke-dashoffset="{Math.PI * 100 * (1 - metrics.average_progress / 100)}"
								/>
							</svg>
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="text-3xl font-bold text-gray-900">{metrics.average_progress}%</span>
							</div>
						</div>
					</div>
					<p class="mt-4 text-center text-sm text-gray-500">
						{metrics.active_projects} actieve {metrics.active_projects === 1 ? 'project' : 'projecten'}
					</p>
				</div>

				<!-- Center: Sections per status -->
				<div class="rounded-card bg-white p-6 shadow-card">
					<h2 class="text-base font-semibold text-gray-900">Secties per status</h2>
					{#if metrics.total_sections === 0}
						<p class="mt-4 text-sm text-gray-500">Nog geen secties gegenereerd.</p>
					{:else}
						<div class="mt-4 space-y-3">
							{#each Object.entries(metrics.sections_by_status) as [status, count]}
								{@const percentage = metrics.total_sections > 0 ? Math.round((count / metrics.total_sections) * 100) : 0}
								<div>
									<div class="mb-1 flex items-center justify-between text-sm">
										<span class="text-gray-600">{SECTION_STATUS_LABELS[status] ?? status}</span>
										<span class="font-medium text-gray-900">{count}</span>
									</div>
									<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
										<div
											class="h-2 rounded-full transition-all duration-300 {SECTION_STATUS_COLORS[status] ?? 'bg-gray-300'}"
											style="width: {percentage}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
							Totaal: {metrics.total_sections} secties
						</div>
					{/if}
				</div>

				<!-- Right: Upcoming deadlines (milestones + activities combined) -->
				<div class="rounded-card bg-white p-6 shadow-card">
					<div class="flex items-center justify-between">
						<h2 class="text-base font-semibold text-gray-900">Deadlines deze week</h2>
						{#if hasCombinedDeadlines}
							<span class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
								{combinedDeadlines.length}
							</span>
						{/if}
					</div>
					{#if !hasCombinedDeadlines && upcomingDeadlines.length === 0}
						<div class="mt-6 flex flex-col items-center justify-center py-8 text-center">
							<svg class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<p class="mt-3 text-sm text-gray-500">Geen deadlines deze week</p>
						</div>
					{:else if hasCombinedDeadlines}
						<div class="mt-4 space-y-2">
							{#each combinedDeadlines.slice(0, 6) as deadline (deadline.id)}
								<a
									href="/projects/{deadline.project_id}/planning"
									class="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
								>
									<span class="inline-block h-2 w-2 shrink-0 rounded-full
										{deadline.days_remaining <= 0 ? 'bg-red-500' : deadline.days_remaining <= 3 ? 'bg-orange-500' : 'bg-green-500'}">
									</span>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-1.5">
											{#if deadline.is_critical}
												<svg class="h-3.5 w-3.5 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Kritiek">
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
											{/if}
											<p class="truncate text-sm font-medium text-gray-900">{deadline.title}</p>
										</div>
										<p class="truncate text-xs text-gray-500">
											{deadline.project_name} · {deadline.type === 'milestone' ? 'Milestone' : 'Activiteit'}
										</p>
									</div>
									<span class="shrink-0 rounded-badge px-2 py-1 text-xs font-medium
										{deadline.days_remaining <= 0 ? 'bg-error-100 text-error-700' : deadline.days_remaining <= 1 ? 'bg-warning-100 text-warning-700' : 'bg-primary-100 text-primary-700'}">
										{#if deadline.days_remaining === 0}
											Vandaag
										{:else if deadline.days_remaining === 1}
											Morgen
										{:else if deadline.days_remaining < 0}
											{Math.abs(deadline.days_remaining)}d verlopen
										{:else}
											Nog {deadline.days_remaining}d
										{/if}
									</span>
								</a>
							{/each}
						</div>
						{#if combinedDeadlines.length > 6}
							<div class="mt-3 border-t border-gray-100 pt-3">
								<a href="/planning" class="text-sm font-medium text-primary-600 hover:text-primary-700">
									Alle deadlines bekijken →
								</a>
							</div>
						{/if}
					{:else}
						<div class="mt-4 space-y-3">
							{#each upcomingDeadlines as project (project.id)}
								{@const days = daysUntil(project.deadline_date ?? '')}
								<a
									href="/projects/{project.id}"
									class="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
								>
									<div>
										<p class="text-sm font-medium text-gray-900">{project.name}</p>
										<p class="text-xs text-gray-500">
											{new Date(project.deadline_date ?? '').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' })}
										</p>
									</div>
									<span class="rounded-badge px-2 py-1 text-xs font-medium
										{days <= 1 ? 'bg-error-100 text-error-700' : days <= 3 ? 'bg-warning-100 text-warning-700' : 'bg-primary-100 text-primary-700'}">
										{#if days === 0}
											Vandaag
										{:else if days === 1}
											Morgen
										{:else}
											Nog {days} dagen
										{/if}
									</span>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
