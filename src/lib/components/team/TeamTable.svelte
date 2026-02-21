<script lang="ts">
	import { PROJECT_ROLE_LABELS, type ProjectRole } from '$lib/types/enums.js';
	import type { DocumentRoleKey } from '$lib/types/enums.js';
	import type { DataTableColumn } from '$lib/types/data-table.js';
	import DataTable from '$lib/components/DataTable.svelte';
	import type { TeamMember } from './types.js';

	export let members: TeamMember[] = [];
	export let documentRoles: {
		id: string;
		role_key: DocumentRoleKey;
		role_label: string;
		project_member_id: string | null;
	}[] = [];
	export let onRowClick: ((member: TeamMember) => void) | null = null;

	function primaryRole(roles: { role: ProjectRole }[]): string {
		if (roles.length === 0) return '—';
		return PROJECT_ROLE_LABELS[roles[0].role];
	}

	function initials(member: TeamMember): string {
		return `${member.profile.first_name.charAt(0)}${member.profile.last_name.charAt(0)}`;
	}

	function fullName(member: TeamMember): string {
		return `${member.profile.first_name} ${member.profile.last_name}`;
	}

	function memberDocRoles(memberId: string): { role_key: DocumentRoleKey; role_label: string }[] {
		return documentRoles.filter((r) => r.project_member_id === memberId);
	}

	const columns: DataTableColumn<TeamMember>[] = [
		{ key: 'name', label: 'Naam', className: 'w-[25%]', accessor: (r) => fullName(r) },
		{ key: 'email', label: 'E-mail', className: 'w-[20%]', accessor: (r) => r.profile.email },
		{ key: 'phone', label: 'Telefoon', className: 'w-[12%]', visibleFrom: 'md', accessor: (r) => r.profile.phone ?? '—' },
		{ key: 'job_title', label: 'Functie', className: 'w-[13%]', visibleFrom: 'lg', accessor: (r) => r.profile.job_title ?? '—' },
		{ key: 'role', label: 'Rol', className: 'w-[13%]', accessor: (r) => primaryRole(r.roles) },
		{ key: 'doc_roles', label: 'Documentrollen', className: 'w-[12%]', visibleFrom: 'lg', accessor: () => '' },
		{ key: 'actions', label: 'Bekijken', srOnly: true, className: 'w-[5%]' }
	];
</script>

<DataTable {columns} rows={members} {onRowClick} ariaLabel="Teamleden overzicht" emptyIcon="people" emptyMessage="Geen teamleden gevonden.">
	<svelte:fragment slot="cell" let:row let:column let:value>
		{#if column.key === 'name'}
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
					{initials(row)}
				</div>
				<span class="text-sm font-medium text-gray-900">{value}</span>
			</div>
		{:else if column.key === 'doc_roles'}
			{@const docRoles = memberDocRoles(row.id)}
			{#if docRoles.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each docRoles as dr (dr.role_key)}
						<span class="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
							{dr.role_label}
						</span>
					{/each}
				</div>
			{:else}
				<span class="text-xs text-gray-400">—</span>
			{/if}
		{:else if column.key === 'actions'}
			<svg class="ml-auto h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		{:else}
			<span class="text-sm text-gray-600">{value}</span>
		{/if}
	</svelte:fragment>
</DataTable>
