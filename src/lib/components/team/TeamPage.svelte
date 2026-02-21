<script lang="ts">
	import { PROJECT_ROLE_LABELS, type ProjectRole } from '$lib/types/enums.js';
	import type { DocumentRoleKey } from '$lib/types/enums.js';
	import { invalidateAll } from '$app/navigation';
	import DataTableCard from '$lib/components/DataTableCard.svelte';
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
	export let documentRoles: {
		id: string;
		role_key: DocumentRoleKey;
		role_label: string;
		project_member_id: string | null;
	}[] = [];

	type Tab = 'active' | 'inactive';

	let activeTab: Tab = 'active';
	let searchQuery = '';
	export let showAddForm = false;
	let selectedMember: TeamMember | null = null;
	let loading = false;
	let showFilter = false;

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

<!-- Tabs — Remote style: "Active (1)" -->
<nav class="-mb-px flex gap-6 border-b border-gray-200" aria-label="Teamstatus tabs">
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
		Actief ({members.length})
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
		Inactief (0)
	</button>
</nav>

<!-- White card wrapping search + filter + table -->
<div class="mt-6">
	<DataTableCard
		bind:searchQuery
		searchPlaceholder="Zoeken"
		searchLabel="Zoek teamleden"
		bind:showFilter
		rowCount={filteredMembers.length}
	>
		{#if activeTab === 'active'}
			<TeamTable members={filteredMembers} {documentRoles} onRowClick={handleRowClick} />
		{:else}
			<div class="px-5 py-12 text-center">
				<p class="text-sm text-gray-500">Geen inactieve teamleden.</p>
			</div>
		{/if}
	</DataTableCard>
</div>

<!-- Add member modal -->
{#if showAddForm}
	<TeamAddForm {projectId} {availableMembers} onClose={() => (showAddForm = false)} />
{/if}

<!-- Drawer -->
<TeamDrawer
	member={selectedMember}
	{projectId}
	onClose={handleCloseDrawer}
	onEdit={() => (selectedMember = null)}
	onRemove={handleRemove}
/>
