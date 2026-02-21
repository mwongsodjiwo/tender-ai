<script lang="ts">
	import type { PageData } from './$types';
	import type { ProjectRole } from '$lib/types/enums.js';
	import type { DocumentRoleKey } from '$lib/types/enums.js';
	import TeamPage from '$lib/components/team/TeamPage.svelte';

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
	$: documentRoles = (data.documentRoles ?? []) as {
		id: string;
		role_key: DocumentRoleKey;
		role_label: string;
		project_member_id: string | null;
	}[];
</script>

<svelte:head>
	<title>Team — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold text-gray-900">Team</h1>
		<button
			type="button"
			on:click={() => (showAddForm = true)}
			class="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors"
		>
			Toevoegen
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M2 21a8 8 0 0 1 13.292-6"/>
				<circle cx="10" cy="8" r="5"/>
				<path d="M19 16v6"/>
				<path d="M22 19h-6"/>
			</svg>
		</button>
	</div>

	<!-- Team members -->
	<section>
		<TeamPage
			projectId={project.id}
			{members}
			{organizationMembers}
			{documentRoles}
			bind:showAddForm
		/>
	</section>
</div>
