<script lang="ts">
	import { PROJECT_ROLE_LABELS, type ProjectRole } from '$lib/types/enums.js';
	import { invalidateAll } from '$app/navigation';
	import TeamTable from './TeamTable.svelte';
	import TeamDrawer from './TeamDrawer.svelte';
	import TeamAddForm from './TeamAddForm.svelte';
	import type { TeamMember } from './types.js';

	export let projectId: string;
	export let members: TeamMember[] = [];
	export let organizationMembers: {
		profile_id: string;
		profile: { first_name: string; last_name: string; email: string };
	}[] = [];

	type Tab = 'active' | 'inactive';

	let activeTab: Tab = 'active';
	let searchQuery = '';
	export let showAddForm = false;
	let selectedMember: TeamMember | null = null;
	let loading = false;

	const existingEmails = new Set(members.map((m) => m.profile?.email));
	$: availableMembers = organizationMembers.filter(
		(om) => !existingEmails.has(om.profile?.email)
	);

	$: filteredMembers = filterMembers(members, searchQuery);

	function filterMembers(list: TeamMember[], query: string): TeamMember[] {
		if (!query.trim()) return list;
		const q = query.toLowerCase();
		return list.filter((m) => {
			const name = `${m.profile.first_name} ${m.profile.last_name}`.toLowerCase();
			const email = m.profile.email.toLowerCase();
			const role = m.roles.map((r: { role: ProjectRole }) => PROJECT_ROLE_LABELS[r.role]).join(' ').toLowerCase();
			return name.includes(q) || email.includes(q) || role.includes(q);
		});
	}

	function handleRowClick(member: TeamMember): void {
		selectedMember = member;
	}

	function handleCloseDrawer(): void {
		selectedMember = null;
	}

	async function handleRemove(member: TeamMember): Promise<void> {
		if (!confirm('Weet je zeker dat je dit lid wilt verwijderen?')) return;
		loading = true;
		selectedMember = null;

		await fetch(`/api/projects/${projectId}/members/${member.id}`, {
			method: 'DELETE'
		});

		await invalidateAll();
		loading = false;
	}
</script>

<!-- Add member form -->
{#if showAddForm}
	<div class="mb-4">
		<TeamAddForm {projectId} {availableMembers} onClose={() => (showAddForm = false)} />
	</div>
{/if}

<!-- Tabs -->
<div class="border-b border-gray-200">
	<nav class="-mb-px flex gap-6" aria-label="Teamstatus tabs">
		<button
			type="button"
			on:click={() => (activeTab = 'active')}
			class="whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors
				{activeTab === 'active'
					? 'border-primary-600 text-primary-600'
					: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
			aria-selected={activeTab === 'active'}
			role="tab"
		>
			Actief
			<span class="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
				{members.length}
			</span>
		</button>
		<button
			type="button"
			on:click={() => (activeTab = 'inactive')}
			class="whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors
				{activeTab === 'inactive'
					? 'border-primary-600 text-primary-600'
					: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
			aria-selected={activeTab === 'inactive'}
			role="tab"
		>
			Inactief
			<span class="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
				0
			</span>
		</button>
	</nav>
</div>

<!-- Search bar -->
<div class="mt-3">
	<div class="relative">
		<svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
		<input
			type="search"
			bind:value={searchQuery}
			placeholder="Zoek op naam, e-mail of rol..."
			class="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			aria-label="Zoek teamleden"
		/>
	</div>
</div>

<!-- Table -->
<div class="mt-3">
	{#if activeTab === 'active'}
		<TeamTable members={filteredMembers} onRowClick={handleRowClick} />
	{:else}
		<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center">
			<p class="text-sm text-gray-500">Geen inactieve teamleden.</p>
		</div>
	{/if}
</div>

<!-- Drawer -->
<TeamDrawer
	member={selectedMember}
	{projectId}
	onClose={handleCloseDrawer}
	onEdit={() => (selectedMember = null)}
	onRemove={handleRemove}
/>
