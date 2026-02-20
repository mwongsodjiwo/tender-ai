<script lang="ts">
	import type { PageData } from './$types';
	import type { ProjectRole } from '$lib/types/enums.js';
	import TeamPage from '$lib/components/team/TeamPage.svelte';
	import ReviewerInvite from '$lib/components/ReviewerInvite.svelte';

	export let data: PageData;

	let showAddForm = false;

	$: project = data.project;
	$: members = data.members as {
		id: string;
		profile: {
			first_name: string;
			last_name: string;
			email: string;
			phone: string | null;
			job_title: string | null;
		};
		roles: { role: ProjectRole }[];
	}[];
	$: organizationMembers = (data.organizationMembers as {
		profile_id: string;
		profile: { first_name: string; last_name: string; email: string } | { first_name: string; last_name: string; email: string }[];
	}[]).map((m) => ({
		profile_id: m.profile_id,
		profile: Array.isArray(m.profile) ? m.profile[0] : m.profile
	})) as {
		profile_id: string;
		profile: { first_name: string; last_name: string; email: string };
	}[];
	$: artifacts = data.artifacts as { id: string; title: string; section_key: string }[];
	$: reviewers = data.reviewers as {
		id: string;
		email: string;
		name: string;
		review_status: string;
		token: string;
		artifact: { id: string; title: string } | null;
	}[];
</script>

<svelte:head>
	<title>Team — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Team</h1>
		<button
			type="button"
			on:click={() => (showAddForm = !showAddForm)}
			class="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			{showAddForm ? 'Annuleren' : 'Teamlid toevoegen'}
		</button>
	</div>

	<!-- Team members -->
	<section>
		<TeamPage
			projectId={project.id}
			{members}
			{organizationMembers}
			bind:showAddForm
		/>
	</section>

	<!-- Kennishouders (reviewers) -->
	<section>
		<h2 class="mb-4 text-lg font-semibold text-gray-900">Kennishouders</h2>
		<ReviewerInvite
			projectId={project.id}
			{artifacts}
			{reviewers}
		/>
	</section>
</div>
