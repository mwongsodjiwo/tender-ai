<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	// Form field constraints
	const NAME_MAX_LENGTH = 50;
	const JOB_TITLE_MAX_LENGTH = 100;
	const PHONE_MAX_LENGTH = 20;

	// Form state
	let firstName = data.profile?.first_name ?? '';
	let lastName = data.profile?.last_name ?? '';
	let jobTitle = data.profile?.job_title ?? '';
	let phone = data.profile?.phone ?? '';

	// UI state
	let saving = false;
	let successMessage = '';
	let errorMessage = '';

	// Validation state
	let validationErrors: Record<string, string> = {};

	function validateForm(): boolean {
		validationErrors = {};

		if (firstName.trim().length < 1) {
			validationErrors['first_name'] = 'Voornaam is verplicht';
		}
		if (firstName.length > NAME_MAX_LENGTH) {
			validationErrors['first_name'] = `Voornaam mag maximaal ${NAME_MAX_LENGTH} tekens bevatten`;
		}
		if (lastName.trim().length < 1) {
			validationErrors['last_name'] = 'Achternaam is verplicht';
		}
		if (lastName.length > NAME_MAX_LENGTH) {
			validationErrors['last_name'] = `Achternaam mag maximaal ${NAME_MAX_LENGTH} tekens bevatten`;
		}
		if (jobTitle.length > JOB_TITLE_MAX_LENGTH) {
			validationErrors['job_title'] = `Functietitel mag maximaal ${JOB_TITLE_MAX_LENGTH} tekens bevatten`;
		}
		if (phone.length > PHONE_MAX_LENGTH) {
			validationErrors['phone'] = `Telefoonnummer mag maximaal ${PHONE_MAX_LENGTH} tekens bevatten`;
		}

		return Object.keys(validationErrors).length === 0;
	}

	function clearMessages(): void {
		successMessage = '';
		errorMessage = '';
	}

	async function handleSubmit(): Promise<void> {
		clearMessages();

		if (!validateForm()) {
			return;
		}

		saving = true;

		try {
			const response = await fetch('/api/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					first_name: firstName.trim(),
					last_name: lastName.trim(),
					job_title: jobTitle.trim() || undefined,
					phone: phone.trim() || undefined
				})
			});

			if (!response.ok) {
				const result = await response.json();
				errorMessage = result.message ?? 'Er is een fout opgetreden bij het opslaan.';
				return;
			}

			successMessage = 'Profiel succesvol bijgewerkt.';
			await invalidateAll();
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Profiel — Instellingen — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-medium text-gray-900">Profiel</h2>
		<p class="mt-1 text-sm text-gray-500">
			Beheer uw persoonlijke gegevens en contactinformatie.
		</p>
	</div>

	{#if !data.profile}
		<!-- Error state -->
		<div class="rounded-badge bg-error-50 p-4" role="alert">
			<p class="text-sm text-error-700">
				Profiel kon niet worden geladen. Ververs de pagina of neem contact op met support.
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

		<form
			on:submit|preventDefault={handleSubmit}
			class="rounded-card border border-gray-200 bg-white shadow-card transition hover:shadow-card-hover"
		>
			<div class="space-y-6 p-6">
				<!-- First name -->
				<div>
					<label for="first-name" class="block text-sm font-medium text-gray-700">
						Voornaam
					</label>
					<input
						id="first-name"
						type="text"
						bind:value={firstName}
						required
						minlength={1}
						maxlength={NAME_MAX_LENGTH}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
							{validationErrors['first_name'] ? 'border-error-300' : ''}"
						aria-describedby={validationErrors['first_name'] ? 'first-name-error' : undefined}
						aria-invalid={validationErrors['first_name'] ? 'true' : undefined}
					/>
					{#if validationErrors['first_name']}
						<p id="first-name-error" class="mt-1 text-sm text-error-600">{validationErrors['first_name']}</p>
					{/if}
				</div>

				<!-- Last name -->
				<div>
					<label for="last-name" class="block text-sm font-medium text-gray-700">
						Achternaam
					</label>
					<input
						id="last-name"
						type="text"
						bind:value={lastName}
						required
						minlength={1}
						maxlength={NAME_MAX_LENGTH}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
							{validationErrors['last_name'] ? 'border-error-300' : ''}"
						aria-describedby={validationErrors['last_name'] ? 'last-name-error' : undefined}
						aria-invalid={validationErrors['last_name'] ? 'true' : undefined}
					/>
					{#if validationErrors['last_name']}
						<p id="last-name-error" class="mt-1 text-sm text-error-600">{validationErrors['last_name']}</p>
					{/if}
				</div>

				<!-- Email (readonly) -->
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">
						E-mailadres
					</label>
					<input
						id="email"
						type="email"
						value={data.profile.email}
						readonly
						disabled
						class="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 shadow-sm sm:text-sm"
						aria-describedby="email-help"
					/>
					<p id="email-help" class="mt-1 text-xs text-gray-500">
						Het e-mailadres kan niet worden gewijzigd.
					</p>
				</div>

				<!-- Job title -->
				<div>
					<label for="job-title" class="block text-sm font-medium text-gray-700">
						Functietitel
					</label>
					<input
						id="job-title"
						type="text"
						bind:value={jobTitle}
						maxlength={JOB_TITLE_MAX_LENGTH}
						placeholder="bijv. Inkoopadviseur"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
							{validationErrors['job_title'] ? 'border-error-300' : ''}"
						aria-describedby={validationErrors['job_title'] ? 'job-title-error' : undefined}
						aria-invalid={validationErrors['job_title'] ? 'true' : undefined}
					/>
					{#if validationErrors['job_title']}
						<p id="job-title-error" class="mt-1 text-sm text-error-600">{validationErrors['job_title']}</p>
					{/if}
				</div>

				<!-- Phone -->
				<div>
					<label for="phone" class="block text-sm font-medium text-gray-700">
						Telefoonnummer
					</label>
					<input
						id="phone"
						type="tel"
						bind:value={phone}
						maxlength={PHONE_MAX_LENGTH}
						placeholder="bijv. +31 6 12345678"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
							{validationErrors['phone'] ? 'border-error-300' : ''}"
						aria-describedby={validationErrors['phone'] ? 'phone-error' : undefined}
						aria-invalid={validationErrors['phone'] ? 'true' : undefined}
					/>
					{#if validationErrors['phone']}
						<p id="phone-error" class="mt-1 text-sm text-error-600">{validationErrors['phone']}</p>
					{/if}
				</div>
			</div>

			<!-- Form footer -->
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
		</form>
	{/if}
</div>
