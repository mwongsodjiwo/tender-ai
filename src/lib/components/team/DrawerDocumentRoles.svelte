<script lang="ts">
	import { DOCUMENT_ROLE_KEYS, DOCUMENT_ROLE_LABELS } from '$lib/types/enums.js';
	import type { DocumentRoleKey } from '$lib/types/enums.js';
	import type { ProjectDocumentRole } from '$lib/types/db/document-roles.js';

	export let projectId: string;
	export let memberId: string;
	export let memberName: string;

	let roles: ProjectDocumentRole[] = [];
	let loading = false;
	let saving: DocumentRoleKey | null = null;
	let error = '';

	$: assignedKeys = new Set(
		roles.filter((r) => r.project_member_id === memberId).map((r) => r.role_key)
	);

	async function loadRoles(): Promise<void> {
		loading = true;
		error = '';
		const res = await fetch(`/api/projects/${projectId}/roles`);
		if (res.ok) {
			const json = await res.json();
			roles = json.data ?? [];
		} else {
			error = 'Kon documentrollen niet laden';
		}
		loading = false;
	}

	async function toggleRole(key: DocumentRoleKey): Promise<void> {
		saving = key;
		error = '';
		const isAssigned = assignedKeys.has(key);

		if (isAssigned) {
			await unassignRole(key);
		} else {
			await assignRole(key);
		}
		saving = null;
	}

	async function assignRole(key: DocumentRoleKey): Promise<void> {
		const res = await fetch(`/api/projects/${projectId}/roles`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				role_key: key,
				role_label: DOCUMENT_ROLE_LABELS[key],
				project_member_id: memberId
			})
		});
		if (res.ok) {
			await loadRoles();
		} else {
			error = `Kon rol "${DOCUMENT_ROLE_LABELS[key]}" niet toewijzen`;
		}
	}

	async function unassignRole(key: DocumentRoleKey): Promise<void> {
		const res = await fetch(`/api/projects/${projectId}/roles/${key}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project_member_id: null })
		});
		if (res.ok) {
			await loadRoles();
		} else {
			error = `Kon rol "${DOCUMENT_ROLE_LABELS[key]}" niet ontkoppelen`;
		}
	}

	// Load roles on mount
	loadRoles();
</script>

<div class="border-t border-gray-200 px-6 py-6">
	<h4 class="text-xs font-medium uppercase tracking-wider text-gray-500">
		Documentrollen
	</h4>
	<p class="mt-1 text-xs text-gray-400">
		Koppel {memberName} aan documentrollen voor dit project
	</p>

	{#if loading}
		<div class="mt-3 flex items-center gap-2 text-sm text-gray-400">
			<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
			Laden...
		</div>
	{:else}
		{#if error}
			<p class="mt-2 text-xs text-error-600">{error}</p>
		{/if}

		<!-- Badges for assigned roles -->
		{#if assignedKeys.size > 0}
			<div class="mt-3 flex flex-wrap gap-1.5">
				{#each DOCUMENT_ROLE_KEYS.filter((k) => assignedKeys.has(k)) as key (key)}
					<span class="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
						{DOCUMENT_ROLE_LABELS[key]}
					</span>
				{/each}
			</div>
		{/if}

		<!-- Checkboxes -->
		<div class="mt-3 space-y-2">
			{#each DOCUMENT_ROLE_KEYS as key (key)}
				<label class="flex items-center gap-2.5 text-sm text-gray-700">
					<input
						type="checkbox"
						checked={assignedKeys.has(key)}
						disabled={saving !== null}
						on:change={() => toggleRole(key)}
						class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
					/>
					<span class:opacity-50={saving === key}>
						{DOCUMENT_ROLE_LABELS[key]}
					</span>
					{#if saving === key}
						<svg class="h-3.5 w-3.5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
					{/if}
				</label>
			{/each}
		</div>
	{/if}
</div>
