<script lang="ts">
	import { PROJECT_ROLE_LABELS, type ProjectRole, PROJECT_ROLES } from '$types';
	import { invalidateAll } from '$app/navigation';

	export let projectId: string;
	export let members: {
		id: string;
		profile: { first_name: string; last_name: string; email: string };
		roles: { role: ProjectRole }[];
	}[];
	export let organizationMembers: { profile_id: string; profile: { first_name: string; last_name: string; email: string } }[];

	let showAddForm = false;
	let selectedProfileId = '';
	let selectedRoles: ProjectRole[] = [];
	let loading = false;
	let errorMessage = '';
	let editingMemberId = '';
	let editRoles: ProjectRole[] = [];

	const existingProfileIds = new Set(members.map((m) => m.profile?.email));
	$: availableMembers = organizationMembers.filter(
		(om) => !existingProfileIds.has(om.profile?.email)
	);

	function toggleRole(role: ProjectRole) {
		if (selectedRoles.includes(role)) {
			selectedRoles = selectedRoles.filter((r) => r !== role);
		} else {
			selectedRoles = [...selectedRoles, role];
		}
	}

	function toggleEditRole(role: ProjectRole) {
		if (editRoles.includes(role)) {
			editRoles = editRoles.filter((r) => r !== role);
		} else {
			editRoles = [...editRoles, role];
		}
	}

	async function addMember() {
		if (!selectedProfileId || selectedRoles.length === 0) return;
		loading = true;
		errorMessage = '';

		const response = await fetch(`/api/projects/${projectId}/members`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ profile_id: selectedProfileId, roles: selectedRoles })
		});

		if (response.ok) {
			showAddForm = false;
			selectedProfileId = '';
			selectedRoles = [];
			await invalidateAll();
		} else {
			const data = await response.json();
			errorMessage = data.message ?? 'Er is een fout opgetreden';
		}

		loading = false;
	}

	async function updateRoles(memberId: string) {
		if (editRoles.length === 0) return;
		loading = true;

		const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ roles: editRoles })
		});

		if (response.ok) {
			editingMemberId = '';
			editRoles = [];
			await invalidateAll();
		}

		loading = false;
	}

	async function removeMember(memberId: string) {
		if (!confirm('Weet je zeker dat je dit lid wilt verwijderen?')) return;
		loading = true;

		await fetch(`/api/projects/${projectId}/members/${memberId}`, {
			method: 'DELETE'
		});

		await invalidateAll();
		loading = false;
	}

	function startEdit(member: typeof members[0]) {
		editingMemberId = member.id;
		editRoles = member.roles.map((r) => r.role);
	}
</script>

<div class="rounded-card border border-gray-200 bg-white shadow-card transition hover:shadow-sm">
	<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
		<h3 class="text-base font-semibold text-gray-900">Teamleden</h3>
		<button
			on:click={() => (showAddForm = !showAddForm)}
			class="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
		>
			{showAddForm ? 'Annuleren' : 'Lid toevoegen'}
		</button>
	</div>

	{#if showAddForm}
		<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
			<div class="space-y-3">
				<div>
					<label for="member-select" class="block text-sm font-medium text-gray-700">
						Organisatielid selecteren
					</label>
					<select
						id="member-select"
						bind:value={selectedProfileId}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					>
						<option value="">Selecteer een lid...</option>
						{#each availableMembers as om}
							<option value={om.profile_id}>
								{om.profile.first_name} {om.profile.last_name} ({om.profile.email})
							</option>
						{/each}
					</select>
				</div>

				<fieldset>
					<legend class="block text-sm font-medium text-gray-700">Rollen</legend>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each PROJECT_ROLES as role}
							<button
								type="button"
								on:click={() => toggleRole(role)}
								class="rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedRoles.includes(role)
									? 'bg-primary-100 text-primary-800 ring-1 ring-primary-300'
									: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
							>
								{PROJECT_ROLE_LABELS[role]}
							</button>
						{/each}
					</div>
				</fieldset>

				{#if errorMessage}
					<p class="text-sm text-error-600" role="alert">{errorMessage}</p>
				{/if}

				<button
					on:click={addMember}
					disabled={!selectedProfileId || selectedRoles.length === 0 || loading}
					class="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{loading ? 'Bezig...' : 'Toevoegen'}
				</button>
			</div>
		</div>
	{/if}

	{#if members.length === 0}
		<div class="px-6 py-8 text-center">
			<p class="text-sm text-gray-500">Nog geen teamleden toegevoegd.</p>
		</div>
	{:else}
		<ul class="divide-y divide-gray-200">
			{#each members as member}
				<li class="px-6 py-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="font-medium text-gray-900">{member.profile.first_name} {member.profile.last_name}</p>
							<p class="text-sm text-gray-500">{member.profile.email}</p>
						</div>
						<div class="flex items-center gap-2">
							{#if editingMemberId === member.id}
								<div class="flex flex-wrap gap-1">
									{#each PROJECT_ROLES as role}
										<button
											type="button"
											on:click={() => toggleEditRole(role)}
											class="rounded-full px-2 py-0.5 text-xs font-medium transition-colors {editRoles.includes(role)
												? 'bg-primary-100 text-primary-800 ring-1 ring-primary-300'
												: 'bg-gray-100 text-gray-500 hover:bg-gray-200'}"
										>
											{PROJECT_ROLE_LABELS[role]}
										</button>
									{/each}
								</div>
								<button
									on:click={() => updateRoles(member.id)}
									disabled={editRoles.length === 0 || loading}
									class="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
								>
									Opslaan
								</button>
								<button
									on:click={() => (editingMemberId = '')}
									class="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
								>
									Annuleren
								</button>
							{:else}
								<div class="flex flex-wrap gap-1">
									{#each member.roles as { role }}
										<span class="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
											{PROJECT_ROLE_LABELS[role]}
										</span>
									{/each}
								</div>
								<button
									on:click={() => startEdit(member)}
									class="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
									aria-label="Rollen bewerken voor {member.profile.first_name} {member.profile.last_name}"
								>
									Bewerken
								</button>
								<button
									on:click={() => removeMember(member.id)}
									class="rounded px-2 py-1 text-xs font-medium text-error-500 hover:bg-error-50"
									aria-label="Verwijder {member.profile.first_name} {member.profile.last_name}"
								>
									Verwijderen
								</button>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
