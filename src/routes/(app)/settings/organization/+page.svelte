<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { OrganizationRole } from '$types';

	export let data: PageData;

	// Form field constraints
	const ORG_NAME_MIN_LENGTH = 2;
	const ORG_NAME_MAX_LENGTH = 200;
	const ORG_DESCRIPTION_MAX_LENGTH = 1000;

	// Role labels in Dutch
	const ROLE_LABELS: Record<OrganizationRole, string> = {
		owner: 'Eigenaar',
		admin: 'Beheerder',
		member: 'Lid'
	};

	// Roles that are allowed to edit the organization
	const EDITABLE_ROLES: ReadonlyArray<string> = ['owner', 'admin'];

	// Whether current user can edit organization settings (owner/admin/superadmin)
	$: canEditOrg = (data.currentMemberRole !== null && EDITABLE_ROLES.includes(data.currentMemberRole)) || data.isSuperadmin;

	// Whether current user can manage members (superadmin only)
	$: canManageMembers = data.isSuperadmin === true;

	// Organization form state
	let orgName = data.organization?.name ?? '';
	let orgDescription = data.organization?.description ?? '';

	// UI state
	let saving = false;
	let successMessage = '';
	let errorMessage = '';
	let validationErrors: Record<string, string> = {};

	// Invite form state
	let inviteEmail = '';
	let inviteRole: OrganizationRole = 'member';
	let inviting = false;
	let inviteSuccess = '';
	let inviteError = '';

	function validateOrgForm(): boolean {
		validationErrors = {};

		if (orgName.trim().length < ORG_NAME_MIN_LENGTH) {
			validationErrors['name'] = `Naam moet minimaal ${ORG_NAME_MIN_LENGTH} tekens bevatten`;
		}
		if (orgName.length > ORG_NAME_MAX_LENGTH) {
			validationErrors['name'] = `Naam mag maximaal ${ORG_NAME_MAX_LENGTH} tekens bevatten`;
		}
		if (orgDescription.length > ORG_DESCRIPTION_MAX_LENGTH) {
			validationErrors['description'] = `Beschrijving mag maximaal ${ORG_DESCRIPTION_MAX_LENGTH} tekens bevatten`;
		}

		return Object.keys(validationErrors).length === 0;
	}

	function clearMessages(): void {
		successMessage = '';
		errorMessage = '';
	}

	function clearInviteMessages(): void {
		inviteSuccess = '';
		inviteError = '';
	}

	async function handleSaveOrg(): Promise<void> {
		if (!data.organization) return;
		clearMessages();

		if (!validateOrgForm()) return;

		saving = true;

		try {
			const response = await fetch(`/api/organizations/${data.organization.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: orgName.trim(),
					description: orgDescription.trim() || undefined
				})
			});

			if (!response.ok) {
				const result = await response.json();
				errorMessage = result.message ?? 'Er is een fout opgetreden bij het opslaan.';
				return;
			}

			successMessage = 'Organisatie succesvol bijgewerkt.';
			await invalidateAll();
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		} finally {
			saving = false;
		}
	}

	async function handleInviteMember(): Promise<void> {
		if (!data.organization) return;
		clearInviteMessages();

		if (!inviteEmail.trim()) {
			inviteError = 'E-mailadres is verplicht.';
			return;
		}

		inviting = true;

		try {
			const response = await fetch(`/api/organizations/${data.organization.id}/members`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: inviteEmail.trim(),
					role: inviteRole
				})
			});

			if (!response.ok) {
				const result = await response.json();
				inviteError = result.message ?? 'Er is een fout opgetreden bij het uitnodigen.';
				return;
			}

			inviteSuccess = `${inviteEmail.trim()} is uitgenodigd als ${ROLE_LABELS[inviteRole].toLowerCase()}.`;
			inviteEmail = '';
			inviteRole = 'member';
			await invalidateAll();
		} catch {
			inviteError = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		} finally {
			inviting = false;
		}
	}
</script>

<svelte:head>
	<title>Organisatie — Instellingen — Tendermanager</title>
</svelte:head>

<div class="space-y-8">
	<div>
		<h2 class="text-lg font-medium text-gray-900">Organisatie</h2>
		<p class="mt-1 text-sm text-gray-500">
			Beheer uw organisatiegegevens en teamleden.
		</p>
	</div>

	{#if !data.organization}
		<!-- Empty state -->
		<div class="rounded-card border-2 border-dashed border-gray-300 p-12 text-center">
			<svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
			</svg>
			<h3 class="mt-2 text-sm font-semibold text-gray-900">Geen organisatie</h3>
			<p class="mt-1 text-sm text-gray-500">
				U bent nog niet aan een organisatie gekoppeld. Neem contact op met uw beheerder.
			</p>
		</div>
	{:else}
		<!-- Success message -->
		{#if successMessage}
			<div class="rounded-badge bg-success-50 p-4" role="status">
				<div class="flex">
					<svg class="h-5 w-5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
					<p class="ml-3 text-sm text-success-700">{successMessage}</p>
				</div>
			</div>
		{/if}

		<!-- Error message -->
		{#if errorMessage}
			<div class="rounded-badge bg-error-50 p-4" role="alert">
				<div class="flex">
					<svg class="h-5 w-5 text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
					<p class="ml-3 text-sm text-error-700">{errorMessage}</p>
				</div>
			</div>
		{/if}

		<!-- Organization details form -->
		<form
			on:submit|preventDefault={handleSaveOrg}
		class="rounded-card border border-gray-200 bg-white shadow-card transition hover:shadow-card-hover"
	>
		<div class="space-y-6 p-6">
			<h3 class="text-base font-medium text-gray-900">Organisatiegegevens</h3>

				<!-- Organization name -->
				<div>
					<label for="org-name" class="block text-sm font-medium text-gray-700">
						Naam
					</label>
					<input
						id="org-name"
						type="text"
						bind:value={orgName}
						required
						disabled={!canEditOrg}
						minlength={ORG_NAME_MIN_LENGTH}
						maxlength={ORG_NAME_MAX_LENGTH}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
							{!canEditOrg ? 'bg-gray-50 text-gray-500' : ''}
							{validationErrors['name'] ? 'border-error-300' : ''}"
						aria-describedby={validationErrors['name'] ? 'org-name-error' : undefined}
						aria-invalid={validationErrors['name'] ? 'true' : undefined}
					/>
					{#if validationErrors['name']}
						<p id="org-name-error" class="mt-1 text-sm text-error-600">{validationErrors['name']}</p>
					{/if}
				</div>

				<!-- Organization slug (readonly) -->
				<div>
					<label for="org-slug" class="block text-sm font-medium text-gray-700">
						Slug
					</label>
					<input
						id="org-slug"
						type="text"
						value={data.organization.slug}
						readonly
						disabled
						class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm sm:text-sm"
						aria-describedby="org-slug-help"
					/>
					<p id="org-slug-help" class="mt-1 text-xs text-gray-500">
						De slug kan niet worden gewijzigd na aanmaak.
					</p>
				</div>

				<!-- Organization description -->
				<div>
					<label for="org-description" class="block text-sm font-medium text-gray-700">
						Beschrijving
					</label>
					<textarea
						id="org-description"
						bind:value={orgDescription}
						disabled={!canEditOrg}
						maxlength={ORG_DESCRIPTION_MAX_LENGTH}
						rows="3"
						placeholder="Korte beschrijving van uw organisatie"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
							{!canEditOrg ? 'bg-gray-50 text-gray-500' : ''}
							{validationErrors['description'] ? 'border-error-300' : ''}"
						aria-describedby={validationErrors['description'] ? 'org-description-error' : undefined}
						aria-invalid={validationErrors['description'] ? 'true' : undefined}
					></textarea>
					{#if validationErrors['description']}
						<p id="org-description-error" class="mt-1 text-sm text-error-600">{validationErrors['description']}</p>
					{/if}
				</div>
			</div>

			{#if canEditOrg}
				<div class="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-3">
					<button
						type="submit"
						disabled={saving}
						class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if saving}
							<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
							Opslaan...
						{:else}
							Opslaan
						{/if}
					</button>
				</div>
			{/if}
		</form>

		<!-- Members section -->
		<div class="rounded-card border border-gray-200 bg-white shadow-card transition hover:shadow-card-hover">
			<div class="p-6">
				<h3 class="text-base font-medium text-gray-900">Teamleden</h3>
				<p class="mt-1 text-sm text-gray-500">
					Beheer de leden van uw organisatie.
				</p>
			</div>

			<!-- Members list -->
			{#if data.members.length === 0}
				<div class="border-t border-gray-200 px-6 py-8 text-center">
					<p class="text-sm text-gray-500">Geen teamleden gevonden.</p>
				</div>
			{:else}
				<div class="border-t border-gray-200">
					<ul class="divide-y divide-gray-200" role="list" aria-label="Teamleden">
						{#each data.members as member (member.id)}
							<li class="flex items-center justify-between px-6 py-4">
								<div class="flex items-center">
									<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
										{member.profile?.first_name?.charAt(0)?.toUpperCase() ?? '?'}
									</div>
									<div class="ml-4">
										<p class="text-sm font-medium text-gray-900">
											{member.profile?.first_name ?? ''} {member.profile?.last_name ?? ''}
										</p>
										<p class="text-sm text-gray-500">
											{member.profile?.email ?? ''}
										</p>
									</div>
								</div>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
										{member.role === 'owner' ? 'bg-yellow-100 text-yellow-800' :
										 member.role === 'admin' ? 'bg-primary-100 text-primary-800' :
										 'bg-gray-100 text-gray-800'}"
								>
									{ROLE_LABELS[member.role]}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Invite member form (only for superadmin) -->
			{#if canManageMembers}
				<div class="border-t border-gray-200 bg-gray-50 p-6">
					<h4 class="text-sm font-medium text-gray-900">Lid uitnodigen</h4>

					{#if inviteSuccess}
						<div class="mt-3 rounded-badge bg-success-50 p-3" role="status">
							<p class="text-sm text-success-700">{inviteSuccess}</p>
						</div>
					{/if}

					{#if inviteError}
						<div class="mt-3 rounded-badge bg-error-50 p-3" role="alert">
							<p class="text-sm text-error-700">{inviteError}</p>
						</div>
					{/if}

					<form on:submit|preventDefault={handleInviteMember} class="mt-4 flex gap-3">
						<div class="flex-1">
							<label for="invite-email" class="sr-only">E-mailadres</label>
							<input
								id="invite-email"
								type="email"
								bind:value={inviteEmail}
								required
								placeholder="E-mailadres van nieuw lid"
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
							/>
						</div>
						<div>
							<label for="invite-role" class="sr-only">Rol</label>
							<select
								id="invite-role"
								bind:value={inviteRole}
								class="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
							>
								<option value="member">Lid</option>
								<option value="admin">Beheerder</option>
							</select>
						</div>
						<button
							type="submit"
							disabled={inviting}
							class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if inviting}
								Uitnodigen...
							{:else}
								Uitnodigen
							{/if}
						</button>
					</form>
				</div>
			{/if}
		</div>
	{/if}
</div>
