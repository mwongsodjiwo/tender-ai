<script lang="ts">
	import type { PageData } from './$types';
	import type { Project } from '$types';
	import { PROCEDURE_TYPE_LABELS } from '$types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';

	export let data: PageData;

	$: projects = data.projects as Project[];
	$: metrics = data.metrics as {
		totalProjects: number;
		activeProjects: number;
		completedProjects: number;
		inReviewCount: number;
		recentlyMovedToReview: number;
		averageProgress: number;
		sectionsByStatus: Record<string, number>;
		totalSections: number;
	};
	$: recentProjects = data.recentProjects as (Project & { progress: number })[];
	$: upcomingDeadlines = data.upcomingDeadlines as Project[];

	const STATUS_LABELS: Record<string, string> = {
		draft: 'Concept',
		briefing: 'Briefing',
		generating: 'Genereren',
		review: 'Review',
		approved: 'Goedgekeurd',
		published: 'Gepubliceerd',
		archived: 'Gearchiveerd'
	};

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

	function daysUntil(dateStr: string): number {
		const diff = new Date(dateStr).getTime() - new Date().getTime();
		return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

		<!-- Top row: Key metrics -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<MetricCard
				value={metrics.activeProjects}
				label="Actieve projecten"
			/>
			<MetricCard
				value={metrics.inReviewCount}
				label="Documenten in review"
				trend={metrics.recentlyMovedToReview > 0 ? `+${metrics.recentlyMovedToReview} deze week` : ''}
				trendDirection="up"
			/>
			<MetricCard
				value={metrics.completedProjects}
				label="Afgeronde projecten"
			/>
			<MetricCard
				value="{metrics.averageProgress}%"
				label="Gem. voortgang"
			/>
		</div>

		<!-- Middle row: Recent projects + Sections per status -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<!-- Recent projects table (spans 2 cols) -->
			<div class="rounded-card bg-white p-6 shadow-card lg:col-span-2">
				<h2 class="text-base font-semibold text-gray-900">Recente projecten</h2>
				{#if recentProjects.length === 0}
					<p class="mt-4 text-sm text-gray-500">Nog geen projecten aangemaakt.</p>
				{:else}
					<div class="mt-4 overflow-x-auto">
						<table class="w-full text-left text-sm">
							<thead>
								<tr class="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
									<th class="pb-3 pr-4">Project</th>
									<th class="pb-3 pr-4">Fase</th>
									<th class="pb-3 pr-4">Deadline</th>
									<th class="pb-3">Voortgang</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-50">
								{#each recentProjects as project}
									<tr class="group">
										<td class="py-3 pr-4">
											<a href="/projects/{project.id}" class="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
												{project.name}
											</a>
										</td>
										<td class="py-3 pr-4">
											<StatusBadge status={project.status} />
										</td>
										<td class="py-3 pr-4 text-gray-500">
											{#if project.deadline_date}
												{@const days = daysUntil(project.deadline_date)}
												<span class="{days <= 3 ? 'text-error-600 font-medium' : days <= 7 ? 'text-warning-600' : ''}">
													{new Date(project.deadline_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
													{#if days >= 0}
														<span class="text-xs">({days}d)</span>
													{/if}
												</span>
											{:else}
												<span class="text-gray-300">—</span>
											{/if}
										</td>
										<td class="py-3 w-32">
											<div class="flex items-center gap-2">
												<div class="flex-1">
													<ProgressBar value={project.progress} size="sm" showPercentage={false} />
												</div>
												<span class="text-xs text-gray-500 w-8 text-right">{project.progress}%</span>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					{#if projects.length > 5}
						<div class="mt-4 border-t border-gray-100 pt-3">
							<a href="/projects" class="text-sm font-medium text-primary-600 hover:text-primary-700">
								Alle {projects.length} projecten bekijken →
							</a>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Sections per status -->
			<div class="rounded-card bg-white p-6 shadow-card">
				<h2 class="text-base font-semibold text-gray-900">Secties per status</h2>
				{#if metrics.totalSections === 0}
					<p class="mt-4 text-sm text-gray-500">Nog geen secties gegenereerd.</p>
				{:else}
					<div class="mt-4 space-y-3">
						{#each Object.entries(metrics.sectionsByStatus) as [status, count]}
							{@const percentage = metrics.totalSections > 0 ? Math.round((count / metrics.totalSections) * 100) : 0}
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
						Totaal: {metrics.totalSections} secties
					</div>
				{/if}
			</div>
		</div>

		<!-- Bottom row: Progress gauge + Deadlines -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<!-- Average progress gauge -->
			<div class="rounded-card bg-white p-6 shadow-card">
				<h2 class="text-base font-semibold text-gray-900">Projectvoortgang</h2>
				<p class="mt-1 text-sm text-gray-500">Gemiddeld percentage afgerond van actieve projecten</p>
				<div class="mt-6 flex items-center justify-center">
					<div class="relative h-40 w-40">
						<svg viewBox="0 0 120 120" class="h-full w-full -rotate-90">
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
								stroke-dashoffset="{Math.PI * 100 * (1 - metrics.averageProgress / 100)}"
							/>
						</svg>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-3xl font-bold text-gray-900">{metrics.averageProgress}%</span>
						</div>
					</div>
				</div>
				<p class="mt-4 text-center text-sm text-gray-500">
					{metrics.activeProjects} actieve {metrics.activeProjects === 1 ? 'project' : 'projecten'}
				</p>
			</div>

			<!-- Upcoming deadlines -->
			<div class="rounded-card bg-white p-6 shadow-card">
				<h2 class="text-base font-semibold text-gray-900">Deadlines deze week</h2>
				{#if upcomingDeadlines.length === 0}
					<div class="mt-6 flex flex-col items-center justify-center py-8 text-center">
						<svg class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<p class="mt-3 text-sm text-gray-500">Geen deadlines deze week</p>
					</div>
				{:else}
					<div class="mt-4 space-y-3">
						{#each upcomingDeadlines as project}
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

		<!-- All projects grid -->
		<div>
			<h2 class="text-lg font-semibold text-gray-900">Alle projecten</h2>
			{#if projects.length === 0}
				<div class="mt-4">
					<EmptyState
						title="Geen projecten"
						description="Begin met het aanmaken van uw eerste aanbestedingsproject."
						actionLabel="Nieuw project aanmaken"
						actionHref="/projects/new"
						icon="document"
					/>
				</div>
			{:else}
				<div class="mt-4">
					<CardGrid columns={3}>
						{#each projects as project (project.id)}
							<a
								href="/projects/{project.id}"
								class="block rounded-card bg-white p-6 shadow-card transition-all hover:shadow-card-hover"
							>
								<div class="flex items-start justify-between">
									<h3 class="text-lg font-medium text-gray-900">{project.name}</h3>
									<StatusBadge status={project.status} />
								</div>
								{#if project.description}
									<p class="mt-2 line-clamp-2 text-sm text-gray-500">{project.description}</p>
								{/if}
								{#if project.procedure_type}
									<p class="mt-3 text-xs text-gray-400">
										{PROCEDURE_TYPE_LABELS[project.procedure_type] ?? project.procedure_type}
									</p>
								{/if}
								<p class="mt-2 text-xs text-gray-400">
									Laatst bijgewerkt: {new Date(project.updated_at).toLocaleDateString('nl-NL')}
								</p>
							</a>
						{/each}
					</CardGrid>
				</div>
			{/if}
		</div>
	{/if}
</div>
