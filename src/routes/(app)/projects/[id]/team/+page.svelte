<script lang="ts">
	import type { PageData } from './$types';
	import TeamManager from '$components/TeamManager.svelte';
	import ReviewerInvite from '$components/ReviewerInvite.svelte';

	export let data: PageData;

	$: project = data.project;
	$: members = data.members as {
		id: string;
		profile: { first_name: string; last_name: string; email: string };
		roles: { role: import('$types').ProjectRole }[];
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

<div class="space-y-8">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Team</h1>
		<p class="mt-1 text-sm text-gray-500">Beheer teamleden en kennishouders voor {project.name}</p>
	</div>

	<!-- Team members -->
	<section>
		<h2 class="mb-4 text-lg font-semibold text-gray-900">Teamleden</h2>
		<TeamManager
			projectId={project.id}
			{members}
			{organizationMembers}
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
