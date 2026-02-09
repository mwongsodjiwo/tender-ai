<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { ProjectProfile, Document } from '$types';
	import { PROCEDURE_TYPE_LABELS, DOCUMENT_CATEGORY_LABELS } from '$types';
	import InfoBanner from '$lib/components/InfoBanner.svelte';

	export let data: PageData;

	$: project = data.project;
	$: profile = data.profile as ProjectProfile | null;
	$: documents = (data.documents ?? []) as Document[];
	$: isConfirmed = project.profile_confirmed;

	// Tab state
	type ProfileTab = 'opdrachtgever' | 'project' | 'financieel' | 'planning' | 'documenten';
	let activeTab: ProfileTab = 'opdrachtgever';

	const TABS: { id: ProfileTab; label: string }[] = [
		{ id: 'opdrachtgever', label: 'Opdrachtgever' },
		{ id: 'project', label: 'Project' },
		{ id: 'financieel', label: 'Financieel' },
		{ id: 'planning', label: 'Planning' },
		{ id: 'documenten', label: 'Documenten' }
	];

	let editing = false;
	let saving = false;
	let confirming = false;
	let error = '';
	let success = '';



	// Form state — initialized from profile or empty
	let form = {
		contracting_authority: '',
		department: '',
		contact_name: '',
		contact_email: '',
		contact_phone: '',
		project_goal: '',
		scope_description: '',
		estimated_value: null as number | null,
		currency: 'EUR',
		cpv_codes: '' as string,
		nuts_codes: '' as string,
		timeline_start: '',
		timeline_end: ''
	};

	// Sync form from profile whenever profile changes
	$: if (profile) {
		form = {
			contracting_authority: profile.contracting_authority ?? '',
			department: profile.department ?? '',
			contact_name: profile.contact_name ?? '',
			contact_email: profile.contact_email ?? '',
			contact_phone: profile.contact_phone ?? '',
			project_goal: profile.project_goal ?? '',
			scope_description: profile.scope_description ?? '',
			estimated_value: profile.estimated_value,
			currency: profile.currency ?? 'EUR',
			cpv_codes: (profile.cpv_codes ?? []).join(', '),
			nuts_codes: (profile.nuts_codes ?? []).join(', '),
			timeline_start: profile.timeline_start ?? '',
			timeline_end: profile.timeline_end ?? ''
		};
	}

	function startEditing() {
		editing = true;
		error = '';
		success = '';
	}

	function cancelEditing() {
		editing = false;
		error = '';
		// Reset form from profile
		if (profile) {
			form = {
				contracting_authority: profile.contracting_authority ?? '',
				department: profile.department ?? '',
				contact_name: profile.contact_name ?? '',
				contact_email: profile.contact_email ?? '',
				contact_phone: profile.contact_phone ?? '',
				project_goal: profile.project_goal ?? '',
				scope_description: profile.scope_description ?? '',
				estimated_value: profile.estimated_value,
				currency: profile.currency ?? 'EUR',
				cpv_codes: (profile.cpv_codes ?? []).join(', '),
				nuts_codes: (profile.nuts_codes ?? []).join(', '),
				timeline_start: profile.timeline_start ?? '',
				timeline_end: profile.timeline_end ?? ''
			};
		}
	}

	function parseCodes(value: string): string[] {
		return value.split(',').map((s) => s.trim()).filter(Boolean);
	}

	async function saveProfile() {
		saving = true;
		error = '';
		success = '';

		const payload = {
			contracting_authority: form.contracting_authority,
			department: form.department,
			contact_name: form.contact_name,
			contact_email: form.contact_email || undefined,
			contact_phone: form.contact_phone,
			project_goal: form.project_goal,
			scope_description: form.scope_description,
			estimated_value: form.estimated_value ?? undefined,
			currency: form.currency,
			cpv_codes: parseCodes(form.cpv_codes),
			nuts_codes: parseCodes(form.nuts_codes),
			timeline_start: form.timeline_start || undefined,
			timeline_end: form.timeline_end || undefined
		};

		const method = profile ? 'PATCH' : 'POST';
		const res = await fetch(`/api/projects/${project.id}/profile`, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const json = await res.json();

		if (!res.ok) {
			error = json.message ?? 'Er is iets misgegaan bij het opslaan.';
			saving = false;
			return;
		}

		saving = false;
		editing = false;
		success = 'Projectprofiel opgeslagen.';
		await invalidateAll();
	}

	async function confirmProfile() {
		confirming = true;
		error = '';
		success = '';

		const res = await fetch(`/api/projects/${project.id}/profile/confirm`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ confirmed: true })
		});

		const json = await res.json();

		if (!res.ok) {
			error = json.message ?? 'Er is iets misgegaan bij het bevestigen.';
			confirming = false;
			return;
		}

		confirming = false;
		success = 'Projectprofiel bevestigd.';
		await invalidateAll();
	}

	const FIELD_LABELS: Record<string, string> = {
		contracting_authority: 'Opdrachtgever',
		department: 'Afdeling',
		contact_name: 'Contactpersoon',
		contact_email: 'E-mail',
		contact_phone: 'Telefoon',
		project_goal: 'Projectdoel',
		scope_description: 'Scope / omschrijving',
		estimated_value: 'Geschatte waarde',
		currency: 'Valuta',
		cpv_codes: 'CPV-codes',
		nuts_codes: 'NUTS-codes',
		timeline_start: 'Startdatum',
		timeline_end: 'Einddatum'
	};
</script>

<svelte:head>
	<title>Projectprofiel — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page header -->
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold text-gray-900">Projectprofiel</h1>
		<div class="flex items-center gap-3">
			{#if isConfirmed}
				<span class="rounded-badge bg-success-100 px-3 py-1 text-sm font-medium text-success-700">
					Bevestigd
				</span>
			{:else}
				<span class="rounded-badge bg-warning-100 px-3 py-1 text-sm font-medium text-warning-700">
					Concept
				</span>
			{/if}
			{#if !editing}
				<button
					on:click={startEditing}
					class="rounded-card border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Bewerken
				</button>
			{/if}
		</div>
	</div>

	<!-- Tab navigation -->
	<div>
		<nav class="flex gap-2" aria-label="Profiel tabbladen">
			{#each TABS as tab (tab.id)}
				<button
					on:click={() => (activeTab = tab.id)}
					class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors
						{activeTab === tab.id
							? 'border border-gray-900 text-gray-900'
							: 'text-gray-500 hover:text-gray-700'}"
					aria-selected={activeTab === tab.id}
					role="tab"
				>
					{tab.label}
				</button>
			{/each}
		</nav>
		<div class="mt-4 border-t border-gray-200"></div>
	</div>

	<!-- Messages -->
	{#if error}
		<InfoBanner type="warning" message={error} />
	{/if}
	{#if success}
		<InfoBanner type="info" message={success} />
	{/if}

	<!-- Confirmation banner -->
	{#if !isConfirmed && profile && !editing}
		<div class="rounded-card border-2 border-dashed border-warning-300 bg-warning-50 p-6">
			<div class="flex items-start gap-4">
				<svg class="mt-0.5 h-6 w-6 shrink-0 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<div class="flex-1">
					<h3 class="text-sm font-semibold text-warning-800">Profiel nog niet bevestigd</h3>
					<p class="mt-1 text-sm text-warning-700">
						Controleer de gegevens hieronder. Na bevestiging wordt dit profiel de single source of truth voor alle AI-acties in dit project.
					</p>
					<button
						on:click={confirmProfile}
						disabled={confirming}
						class="mt-4 rounded-card bg-warning-600 px-4 py-2 text-sm font-medium text-white hover:bg-warning-700 disabled:opacity-50"
					>
						{confirming ? 'Bevestigen...' : 'Profiel bevestigen'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- No profile yet -->
	{#if !profile && !editing}
		<div class="rounded-card bg-white p-8 shadow-card text-center">
			<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
			</svg>
			<h2 class="mt-4 text-lg font-semibold text-gray-900">Nog geen projectprofiel</h2>
			<p class="mt-2 text-sm text-gray-500">Vul het projectprofiel in om te beginnen met de voorbereiding.</p>
			<button
				on:click={startEditing}
				class="mt-6 rounded-card bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
			>
				Profiel invullen
			</button>
		</div>
	{:else if editing}
		<!-- Edit form — tab content in single card -->
		<form on:submit|preventDefault={saveProfile}>
			<div class="rounded-card bg-white shadow-card">
				<!-- Section title -->
				<div class="border-b border-gray-100 px-6 pt-6 pb-4">
					<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400">
						{TABS.find((t) => t.id === activeTab)?.label ?? ''}
					</h2>
				</div>

				<!-- Tab content -->
				<div class="px-6 py-6">
					{#if activeTab === 'opdrachtgever'}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="contracting_authority" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.contracting_authority}</label>
								<input
									id="contracting_authority"
									type="text"
									bind:value={form.contracting_authority}
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									placeholder="Naam organisatie"
								/>
							</div>
							<div>
								<label for="department" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.department}</label>
								<input
									id="department"
									type="text"
									bind:value={form.department}
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									placeholder="Afdeling"
								/>
							</div>
							<div>
								<label for="contact_name" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.contact_name}</label>
								<input
									id="contact_name"
									type="text"
									bind:value={form.contact_name}
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									placeholder="Naam contactpersoon"
								/>
							</div>
							<div>
								<label for="contact_email" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.contact_email}</label>
								<input
									id="contact_email"
									type="email"
									bind:value={form.contact_email}
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									placeholder="email@voorbeeld.nl"
								/>
							</div>
							<div>
								<label for="contact_phone" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.contact_phone}</label>
								<input
									id="contact_phone"
									type="tel"
									bind:value={form.contact_phone}
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									placeholder="+31 6 12345678"
								/>
							</div>
						</div>
					{:else if activeTab === 'project'}
						<div class="space-y-4">
							<div>
								<label for="project_goal" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.project_goal}</label>
								<textarea
									id="project_goal"
									bind:value={form.project_goal}
									rows="3"
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									placeholder="Wat is het doel van dit project?"
								></textarea>
							</div>
							<div>
								<label for="scope_description" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.scope_description}</label>
								<textarea
									id="scope_description"
									bind:value={form.scope_description}
									rows="4"
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									placeholder="Beschrijf de scope en omvang van de opdracht"
								></textarea>
							</div>
						</div>
					{:else if activeTab === 'financieel'}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="estimated_value" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.estimated_value}</label>
								<div class="relative mt-1">
									<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">&euro;</span>
									<input
										id="estimated_value"
										type="number"
										bind:value={form.estimated_value}
										class="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
										placeholder="0"
										min="0"
										step="1000"
									/>
								</div>
							</div>
							<div>
								<label for="cpv_codes" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.cpv_codes}</label>
								<input
									id="cpv_codes"
									type="text"
									bind:value={form.cpv_codes}
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									placeholder="72000000-5, 72200000-7"
								/>
								<p class="mt-1 text-xs text-gray-400">Kommagescheiden CPV-codes</p>
							</div>
							<div>
								<label for="nuts_codes" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.nuts_codes}</label>
								<input
									id="nuts_codes"
									type="text"
									bind:value={form.nuts_codes}
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									placeholder="NL329"
								/>
								<p class="mt-1 text-xs text-gray-400">Kommagescheiden NUTS-codes</p>
							</div>
						</div>
					{:else if activeTab === 'planning'}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="timeline_start" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.timeline_start}</label>
								<input
									id="timeline_start"
									type="date"
									bind:value={form.timeline_start}
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
								/>
							</div>
							<div>
								<label for="timeline_end" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.timeline_end}</label>
								<input
									id="timeline_end"
									type="date"
									bind:value={form.timeline_end}
									class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
								/>
							</div>
						</div>
					{:else if activeTab === 'documenten'}
						<p class="text-sm text-gray-500">Documenten worden beheerd via de documentenpagina.</p>
						<a
							href="/projects/{project.id}/documents"
							class="mt-4 inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
						>
							Naar documenten
						</a>
					{/if}
				</div>
			</div>

			<!-- Form actions -->
			<div class="mt-6 flex items-center justify-between">
				<button
					type="button"
					on:click={cancelEditing}
					class="rounded-card border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Annuleren
				</button>
				<button
					type="submit"
					disabled={saving}
					class="rounded-card bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{saving ? 'Opslaan...' : 'Profiel opslaan'}
				</button>
			</div>
		</form>
	{:else}
		<!-- View mode — tab content in single card -->
		<div class="rounded-card bg-white shadow-card">
			<!-- Section title -->
			<div class="border-b border-gray-100 px-6 pt-6 pb-4">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400">
					{TABS.find((t) => t.id === activeTab)?.label ?? ''}
				</h2>
			</div>

			<!-- Tab content -->
			<div class="px-6 py-6">
				{#if activeTab === 'opdrachtgever'}
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
						{#if profile?.contracting_authority}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.contracting_authority}</dt>
								<dd class="mt-1 text-sm text-gray-900">{profile.contracting_authority}</dd>
							</div>
						{/if}
						{#if profile?.department}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.department}</dt>
								<dd class="mt-1 text-sm text-gray-900">{profile.department}</dd>
							</div>
						{/if}
						{#if profile?.contact_name}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.contact_name}</dt>
								<dd class="mt-1 text-sm text-gray-900">{profile.contact_name}</dd>
							</div>
						{/if}
						{#if profile?.contact_email}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.contact_email}</dt>
								<dd class="mt-1 text-sm text-gray-900">{profile.contact_email}</dd>
							</div>
						{/if}
						{#if profile?.contact_phone}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.contact_phone}</dt>
								<dd class="mt-1 text-sm text-gray-900">{profile.contact_phone}</dd>
							</div>
						{/if}
					</dl>
					{#if !profile?.contracting_authority && !profile?.department && !profile?.contact_name}
						<p class="text-sm text-gray-400">Geen gegevens ingevuld.</p>
					{/if}
				{:else if activeTab === 'project'}
					<dl class="space-y-4">
						{#if profile?.project_goal}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.project_goal}</dt>
								<dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profile.project_goal}</dd>
							</div>
						{/if}
						{#if profile?.scope_description}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.scope_description}</dt>
								<dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profile.scope_description}</dd>
							</div>
						{/if}
					</dl>
					{#if !profile?.project_goal && !profile?.scope_description}
						<p class="text-sm text-gray-400">Geen gegevens ingevuld.</p>
					{/if}
				{:else if activeTab === 'financieel'}
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
						{#if profile?.estimated_value}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.estimated_value}</dt>
								<dd class="mt-1 text-sm text-gray-900">&euro;{profile.estimated_value.toLocaleString('nl-NL')}</dd>
							</div>
						{/if}
						{#if project.procedure_type}
							<div>
								<dt class="text-sm font-medium text-gray-500">Procedure</dt>
								<dd class="mt-1 text-sm text-gray-900">{PROCEDURE_TYPE_LABELS[project.procedure_type] ?? project.procedure_type}</dd>
							</div>
						{/if}
						{#if profile?.cpv_codes && profile.cpv_codes.length > 0}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.cpv_codes}</dt>
								<dd class="mt-1 flex flex-wrap gap-1">
									{#each profile.cpv_codes as code}
										<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{code}</span>
									{/each}
								</dd>
							</div>
						{/if}
						{#if profile?.nuts_codes && profile.nuts_codes.length > 0}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.nuts_codes}</dt>
								<dd class="mt-1 flex flex-wrap gap-1">
									{#each profile.nuts_codes as code}
										<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{code}</span>
									{/each}
								</dd>
							</div>
						{/if}
					</dl>
					{#if !profile?.estimated_value && !project.procedure_type && (!profile?.cpv_codes || profile.cpv_codes.length === 0)}
						<p class="text-sm text-gray-400">Geen gegevens ingevuld.</p>
					{/if}
				{:else if activeTab === 'planning'}
					<dl class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
						{#if profile?.timeline_start}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.timeline_start}</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{new Date(profile.timeline_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
								</dd>
							</div>
						{/if}
						{#if profile?.timeline_end}
							<div>
								<dt class="text-sm font-medium text-gray-500">{FIELD_LABELS.timeline_end}</dt>
								<dd class="mt-1 text-sm text-gray-900">
									{new Date(profile.timeline_end).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
								</dd>
							</div>
						{/if}
					</dl>
					{#if !profile?.timeline_start && !profile?.timeline_end}
						<p class="text-sm text-gray-400">Geen gegevens ingevuld.</p>
					{/if}
				{:else if activeTab === 'documenten'}
					{#if documents.length === 0}
						<div class="text-center py-8">
							<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
							</svg>
							<p class="mt-2 text-sm text-gray-500">Nog geen documenten geüpload.</p>
							<a
								href="/projects/{project.id}/documents"
								class="mt-4 inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
							>
								Documenten uploaden
							</a>
						</div>
					{:else}
						<div class="space-y-3">
							{#each documents as doc (doc.id)}
								<div class="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
									<div class="flex items-center gap-3 min-w-0">
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
											<svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
											</svg>
										</div>
										<div class="min-w-0">
											<p class="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
											<div class="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
												<span class="rounded-badge bg-gray-100 px-2 py-0.5 font-medium text-gray-600">{DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}</span>
												<span>{(doc.file_size / 1024).toFixed(0)} KB</span>
												<span>{new Date(doc.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-4 flex justify-end">
							<a
								href="/projects/{project.id}/documents"
								class="text-sm font-medium text-primary-600 hover:text-primary-700"
							>
								Alle documenten bekijken &rarr;
							</a>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>
