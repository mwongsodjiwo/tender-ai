<script lang="ts">
	import type { PageData } from './$types';
	import type { Project } from '$types';
	import { PROCEDURE_TYPE_LABELS } from '$types';

	export let data: PageData;

	$: projects = data.projects as Project[];

	const STATUS_LABELS: Record<string, string> = {
		draft: 'Concept',
		briefing: 'Briefing',
		generating: 'Genereren',
		review: 'Review',
		approved: 'Goedgekeurd',
		published: 'Gepubliceerd',
		archived: 'Gearchiveerd'
	};

	const STATUS_COLORS: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-800',
		briefing: 'bg-blue-100 text-blue-800',
		generating: 'bg-yellow-100 text-yellow-800',
		review: 'bg-purple-100 text-purple-800',
		approved: 'bg-green-100 text-green-800',
		published: 'bg-green-200 text-green-900',
		archived: 'bg-gray-200 text-gray-600'
	};
</script>

<svelte:head>
	<title>Dashboard — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	{#if !data.hasOrganization}
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
			<svg class="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
			</svg>
			<h3 class="mt-2 text-sm font-semibold text-blue-900">Nog niet gekoppeld aan een organisatie</h3>
			<p class="mt-1 text-sm text-blue-700">
				Je bent nog niet gekoppeld aan een organisatie. Neem contact op met de Tendermanager-beheerder.
			</p>
		</div>
	{:else}
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Projecten</h1>
		<a
			href="/projects/new"
			class="rounded-full border border-[#7A83FF] bg-[#3362E6] px-[17px] py-2.5 text-sm font-normal text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
		>
			Nieuw project
		</a>
	</div>

	{#if projects.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<svg
				class="mx-auto h-12 w-12 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
			<h3 class="mt-2 text-sm font-semibold text-gray-900">Geen projecten</h3>
			<p class="mt-1 text-sm text-gray-500">
				Begin met het aanmaken van uw eerste aanbestedingsproject.
			</p>
			<a
				href="/projects/new"
				class="mt-4 inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
			>
				Nieuw project aanmaken
			</a>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each projects as project (project.id)}
				<a
					href="/projects/{project.id}"
					class="block rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
				>
					<div class="flex items-start justify-between">
						<h3 class="text-lg font-medium text-gray-900">{project.name}</h3>
						<span
							class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-800'}"
						>
							{STATUS_LABELS[project.status] ?? project.status}
						</span>
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
		</div>
	{/if}
	{/if}
</div>
