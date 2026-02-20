<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { ProjectProfile, Document, Organization, ProjectDocumentRole } from '$types';
	import { PROCEDURE_TYPE_LABELS, DOCUMENT_CATEGORY_LABELS } from '$types';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import DocumentUpload from '$lib/components/DocumentUpload.svelte';
	import CodeLookup from '$lib/components/CodeLookup.svelte';
	import ProcedureAdvisor from '$lib/components/ProcedureAdvisor.svelte';
	import DocumentRoles from '$lib/components/DocumentRoles.svelte';
	import OrganizationTab from '$lib/components/OrganizationTab.svelte';
	import type { ContractingAuthorityType } from '$types';

	export let data: PageData;

	$: project = data.project;
	$: profile = data.profile as ProjectProfile | null;
	$: documents = (data.documents ?? []) as Document[];
	$: documentRoles = (data.documentRoles ?? []) as ProjectDocumentRole[];
	$: organization = (data.organization ?? null) as Partial<Organization> | null;
	$: isConfirmed = project.profile_confirmed;

	// Tab state
	type ProfileTab = 'organisatie' | 'project' | 'financieel' | 'planning' | 'rollen' | 'documenten';
	let activeTab: ProfileTab = 'organisatie';

	const TABS: { id: ProfileTab; label: string }[] = [
		{ id: 'organisatie', label: 'Organisatie' },
		{ id: 'project', label: 'Project' },
		{ id: 'financieel', label: 'Financieel' },
		{ id: 'planning', label: 'Planning' },
		{ id: 'rollen', label: 'Documentrollen' },
		{ id: 'documenten', label: 'Documenten' }
	];

	let editing = false;
	let saving = false;
	let confirming = false;
	let error = '';
	let success = '';
	let showUploadPopup = false;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && editing) {
			cancelEditing();
		}
	}

	function handleUploadComplete(): void {
		showUploadPopup = false;
		invalidateAll();
	}



	$: organizationNutsCodes = (data.organizationNutsCodes ?? []) as string[];
	$: authorityType = (data.authorityType ?? 'decentraal') as ContractingAuthorityType;
	$: orgThresholds = data.orgThresholds ?? null;

	let deviationJustification = '';

	// Form state — initialized from profile or empty (pre-fill NUTS from org)
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
		cpv_codes: [] as string[],
		nuts_codes: [...(data.organizationNutsCodes ?? [])] as string[],
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
			cpv_codes: [...(profile.cpv_codes ?? [])],
			nuts_codes: [...(profile.nuts_codes ?? [])],
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
				cpv_codes: [...(profile.cpv_codes ?? [])],
				nuts_codes: [...(profile.nuts_codes ?? [])],
				timeline_start: profile.timeline_start ?? '',
				timeline_end: profile.timeline_end ?? ''
			};
		}
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
			cpv_codes: form.cpv_codes,
			nuts_codes: form.nuts_codes,
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

	const MIME_TYPE_LABELS: Record<string, string> = {
		'application/pdf': 'PDF',
		'application/msword': 'DOC',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
		'application/vnd.ms-excel': 'XLS',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
		'text/plain': 'TXT',
		'text/csv': 'CSV'
	};

	function formatFileType(mimeType: string): string {
		return MIME_TYPE_LABELS[mimeType] ?? mimeType.split('/').pop()?.toUpperCase() ?? '—';
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
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

<svelte:window on:keydown={handleKeydown} />

<div class="space-y-6">
	<!-- Simplified page header -->
	<h1 class="text-xl font-bold text-gray-900">Projectprofiel</h1>

	<!-- Underline-style tab navigation -->
	<nav class="-mb-px flex gap-6 border-b border-gray-200" aria-label="Profiel tabbladen">
		{#each TABS as tab (tab.id)}
			<button
				on:click={() => (activeTab = tab.id)}
				class="whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors
					{activeTab === tab.id
						? 'border-primary-600 text-primary-600'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
				aria-selected={activeTab === tab.id}
				role="tab"
			>
				{tab.label}
			</button>
		{/each}
	</nav>

	<!-- Messages -->
	{#if error}
		<InfoBanner type="warning" message={error} />
	{/if}
	{#if success}
		<InfoBanner type="info" message={success} />
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
		<!-- Edit mode — two-column layout -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Main card (form) -->
			<form on:submit|preventDefault={saveProfile} class="lg:col-span-2">
				<div class="rounded-card bg-white shadow-card">
					<!-- Section title with icon + save button -->
					<div class="flex items-center justify-between border-b border-gray-100 px-6 pt-6 pb-4">
						<div class="flex items-center gap-3">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
								<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
								</svg>
							</div>
							<h2 class="text-base font-semibold text-gray-900">
								{TABS.find((t) => t.id === activeTab)?.label ?? ''} bewerken
							</h2>
						</div>
						<button type="submit" disabled={saving}
							class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
							title={saving ? 'Opslaan...' : 'Opslaan'} aria-label="Opslaan">
							{#if saving}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{:else}
								<!-- Lucide: Save -->
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
									<polyline points="17 21 17 13 7 13 7 21"/>
									<polyline points="7 3 7 8 15 8"/>
								</svg>
							{/if}
						</button>
					</div>

					<!-- Form fields -->
					<div class="px-6 py-6">
						{#if activeTab === 'organisatie'}
							<OrganizationTab {organization} />
						{:else if activeTab === 'project'}
							<div class="space-y-5">
								<div>
									<label for="project_goal" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.project_goal}</label>
									<textarea id="project_goal" bind:value={form.project_goal} rows="3"
										class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
										placeholder="Wat is het doel van dit project?"></textarea>
								</div>
								<div>
									<label for="scope_description" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.scope_description}</label>
									<textarea id="scope_description" bind:value={form.scope_description} rows="4"
										class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
										placeholder="Beschrijf de scope en omvang van de opdracht"></textarea>
								</div>
							</div>
						{:else if activeTab === 'financieel'}
							<div class="space-y-5">
								<div>
									<label for="estimated_value" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.estimated_value}</label>
									<div class="relative mt-1">
										<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">&euro;</span>
										<input id="estimated_value" type="number" bind:value={form.estimated_value}
											class="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
											placeholder="0" min="0" step="1000" />
									</div>
								</div>
								<div>
									<CodeLookup
										label={FIELD_LABELS.cpv_codes}
										apiUrl="/api/cpv"
										selected={form.cpv_codes}
										placeholder="Zoek CPV-code of omschrijving..."
										on:change={(e) => { form.cpv_codes = e.detail; }}
									/>
								</div>
								<div>
									<CodeLookup
										label={FIELD_LABELS.nuts_codes}
										apiUrl="/api/nuts"
										selected={form.nuts_codes}
										placeholder="Zoek NUTS-code of regio..."
										on:change={(e) => { form.nuts_codes = e.detail; }}
									/>
								</div>

								<!-- Procedure advice -->
								<ProcedureAdvisor
									estimatedValue={form.estimated_value}
									{authorityType}
									settings={orgThresholds}
									chosenProcedure={project.procedure_type}
									bind:deviationJustification
									{editing}
								/>
							</div>
						{:else if activeTab === 'planning'}
							<div class="space-y-5">
								<div>
									<label for="timeline_start" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.timeline_start}</label>
									<input id="timeline_start" type="date" bind:value={form.timeline_start}
										class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
								</div>
								<div>
									<label for="timeline_end" class="block text-sm font-medium text-gray-700">{FIELD_LABELS.timeline_end}</label>
									<input id="timeline_end" type="date" bind:value={form.timeline_end}
										class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
								</div>
							</div>
						{:else if activeTab === 'rollen'}
							<DocumentRoles
								projectId={project.id}
								roles={documentRoles}
								disabled={isConfirmed}
							/>
						{:else if activeTab === 'documenten'}
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm text-gray-500">Documenten worden beheerd via de documentenpagina.</p>
									<a href="/projects/{project.id}/documents"
										class="mt-4 inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
										Naar documenten
									</a>
								</div>
								<button type="button" on:click={() => (showUploadPopup = true)}
									class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white shadow-md hover:bg-primary-700 transition-colors"
									title="Document uploaden" aria-label="Document uploaden">
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
									</svg>
								</button>
							</div>
						{/if}
					</div>

				</div>
			</form>

			<!-- Sidebar -->
			<div class="space-y-4">
				<!-- Status card -->
				<div class="rounded-card bg-white p-6 shadow-card">
					<div class="flex items-center gap-2">
						{#if isConfirmed}
							<span class="h-2.5 w-2.5 rounded-full bg-success-500"></span>
							<span class="text-sm font-medium text-gray-900">Bevestigd</span>
						{:else}
							<span class="h-2.5 w-2.5 rounded-full bg-warning-500"></span>
							<span class="text-sm font-medium text-gray-900">Concept</span>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- View mode — two-column layout like Remote.com -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Main card with key-value rows -->
			<div class="lg:col-span-2">
				{#if activeTab === 'organisatie'}
					<!-- Organization tab — always read-only -->
					<OrganizationTab {organization} />
				{:else if activeTab === 'rollen'}
					<!-- Document roles tab -->
					<div class="rounded-card bg-white p-6 shadow-card">
						<DocumentRoles
							projectId={project.id}
							roles={documentRoles}
						/>
					</div>
				{:else if activeTab === 'documenten'}
					<!-- Documents tab — full-width card with table -->
					<div class="rounded-card bg-white shadow-card">
						<div class="flex items-center justify-between border-b border-gray-100 px-6 pt-6 pb-4">
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
									<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
									</svg>
								</div>
								<h2 class="text-base font-semibold text-gray-900">Documenten</h2>
							</div>
							<button type="button" on:click={() => (showUploadPopup = true)}
								class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm hover:bg-primary-700 transition-colors"
								title="Document uploaden" aria-label="Document uploaden">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
								</svg>
							</button>
						</div>
						<div class="px-6 py-6">
							{#if documents.length === 0}
								<div class="text-center py-8">
									<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
									</svg>
									<p class="mt-2 text-sm text-gray-500">Nog geen documenten geüpload.</p>
									<a href="/projects/{project.id}/documents"
										class="mt-4 inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
										Documenten bekijken
									</a>
								</div>
							{:else}
								<div class="rounded-lg overflow-hidden border border-gray-200">
									<table class="w-full">
										<thead>
											<tr class="border-b border-gray-200">
												<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Categorie</th>
												<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Naam</th>
												<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</th>
												<th class="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Grootte</th>
												<th class="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Datum</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-gray-100">
											{#each documents as doc (doc.id)}
												<tr class="group transition-colors hover:bg-gray-50">
													<td class="px-6 py-4">
														<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
															{DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}
														</span>
													</td>
													<td class="px-6 py-4 max-w-[240px]">
														<span class="block truncate text-sm font-medium text-gray-900">{doc.name}</span>
													</td>
													<td class="px-6 py-4">
														<span class="text-sm text-gray-500">{formatFileType(doc.mime_type)}</span>
													</td>
													<td class="px-6 py-4 text-right">
														<span class="text-sm text-gray-500">{formatFileSize(doc.file_size)}</span>
													</td>
													<td class="px-6 py-4 text-right">
														<span class="text-sm text-gray-500">{formatDate(doc.created_at)}</span>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<!-- Profile data tabs — Remote-style key-value card -->
					<div class="rounded-card bg-white shadow-card">
						<!-- Card header with section icon + title + edit button -->
						<div class="flex items-center justify-between border-b border-gray-100 px-6 pt-6 pb-4">
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
								{#if activeTab === 'project'}
									<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
									</svg>
								{:else if activeTab === 'financieel'}
									<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
									</svg>
								{:else}
									<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
									</svg>
								{/if}
							</div>
							<h2 class="text-base font-semibold text-gray-900">
								{TABS.find((t) => t.id === activeTab)?.label ?? ''}
							</h2>
							</div>
						<button on:click={startEditing}
							class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm hover:bg-primary-700 transition-colors"
							title="Bewerken" aria-label="Bewerken">
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<circle cx="12" cy="5" r="2" />
								<circle cx="12" cy="12" r="2" />
								<circle cx="12" cy="19" r="2" />
							</svg>
						</button>
						</div>

						<!-- Key-value rows separated by dividers -->
						<dl class="divide-y divide-gray-100">
							{#if activeTab === 'project'}
								<div class="px-6 py-4">
									<dt class="text-sm text-gray-500">{FIELD_LABELS.project_goal}</dt>
									<dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profile?.project_goal || '—'}</dd>
								</div>
								<div class="px-6 py-4">
									<dt class="text-sm text-gray-500">{FIELD_LABELS.scope_description}</dt>
									<dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profile?.scope_description || '—'}</dd>
								</div>
							{:else if activeTab === 'financieel'}
								<div class="flex items-center justify-between px-6 py-4">
									<dt class="text-sm text-gray-500">{FIELD_LABELS.estimated_value}</dt>
									<dd class="text-sm text-gray-900">
										{#if profile?.estimated_value}
											&euro;{profile.estimated_value.toLocaleString('nl-NL')}
										{:else}
											—
										{/if}
									</dd>
								</div>
								<div class="flex items-center justify-between px-6 py-4">
									<dt class="text-sm text-gray-500">Procedure</dt>
									<dd class="text-sm text-gray-900">
										{project.procedure_type ? (PROCEDURE_TYPE_LABELS[project.procedure_type as keyof typeof PROCEDURE_TYPE_LABELS] ?? project.procedure_type) : '—'}
									</dd>
								</div>
								<div class="flex items-center justify-between px-6 py-4">
									<dt class="text-sm text-gray-500">{FIELD_LABELS.cpv_codes}</dt>
									<dd class="flex flex-wrap gap-1">
										{#if profile?.cpv_codes && profile.cpv_codes.length > 0}
											{#each profile.cpv_codes as code}
												<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{code}</span>
											{/each}
										{:else}
											<span class="text-sm text-gray-900">—</span>
										{/if}
									</dd>
								</div>
								<div class="flex items-center justify-between px-6 py-4">
									<dt class="text-sm text-gray-500">{FIELD_LABELS.nuts_codes}</dt>
									<dd class="flex flex-wrap gap-1">
										{#if profile?.nuts_codes && profile.nuts_codes.length > 0}
											{#each profile.nuts_codes as code}
												<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{code}</span>
											{/each}
										{:else}
											<span class="text-sm text-gray-900">—</span>
										{/if}
									</dd>
								</div>

								<!-- Procedure advice (view mode) -->
								<div class="px-6 py-4">
									<ProcedureAdvisor
										estimatedValue={profile?.estimated_value ?? null}
										{authorityType}
										settings={orgThresholds}
										chosenProcedure={project.procedure_type}
										bind:deviationJustification
										editing={false}
									/>
								</div>
							{:else if activeTab === 'planning'}
								<div class="flex items-center justify-between px-6 py-4">
									<dt class="text-sm text-gray-500">{FIELD_LABELS.timeline_start}</dt>
									<dd class="text-sm text-gray-900">
										{#if profile?.timeline_start}
											{new Date(profile.timeline_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
										{:else}
											—
										{/if}
									</dd>
								</div>
								<div class="flex items-center justify-between px-6 py-4">
									<dt class="text-sm text-gray-500">{FIELD_LABELS.timeline_end}</dt>
									<dd class="text-sm text-gray-900">
										{#if profile?.timeline_end}
											{new Date(profile.timeline_end).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
										{:else}
											—
										{/if}
									</dd>
								</div>
							{/if}
						</dl>

					</div>
				{/if}
			</div>

			<!-- Right sidebar -->
			<div class="space-y-4">
				<!-- Status card -->
				<div class="rounded-card bg-white p-6 shadow-card">
					<p class="text-sm font-medium text-gray-500">Profielstatus</p>
					<div class="mt-2 flex items-center gap-2">
						{#if isConfirmed}
							<span class="h-2.5 w-2.5 rounded-full bg-success-500"></span>
							<span class="text-sm font-semibold text-gray-900">Bevestigd</span>
						{:else}
							<span class="h-2.5 w-2.5 rounded-full bg-warning-500"></span>
							<span class="text-sm font-semibold text-gray-900">Concept</span>
						{/if}
					</div>

					{#if project.procedure_type}
						<p class="mt-4 text-sm font-medium text-gray-500">Procedure</p>
						<p class="mt-1 text-sm text-gray-900">{PROCEDURE_TYPE_LABELS[project.procedure_type as keyof typeof PROCEDURE_TYPE_LABELS] ?? project.procedure_type}</p>
					{/if}

					{#if profile?.estimated_value}
						<p class="mt-4 text-sm font-medium text-gray-500">Geschatte waarde</p>
						<p class="mt-1 text-sm text-gray-900">&euro;{profile.estimated_value.toLocaleString('nl-NL')}</p>
					{/if}

					{#if project.deadline_date}
						<p class="mt-4 text-sm font-medium text-gray-500">Deadline</p>
						<p class="mt-1 text-sm text-gray-900">
							{new Date(project.deadline_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
						</p>
					{/if}
				</div>

				<!-- Action buttons -->
				{#if !isConfirmed && profile}
					<button on:click={confirmProfile} disabled={confirming}
						class="flex w-full items-center gap-3 rounded-card bg-white p-4 shadow-card transition-colors hover:bg-gray-50 disabled:opacity-50">
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-50">
							<svg class="h-5 w-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div class="text-left">
							<p class="text-sm font-semibold text-gray-900">{confirming ? 'Bevestigen...' : 'Profiel bevestigen'}</p>
							<p class="text-xs text-gray-500">Bevestig als single source of truth</p>
						</div>
					</button>
				{/if}

			</div>
		</div>
	{/if}
</div>

<!-- Upload popup modal -->
{#if showUploadPopup}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label="Document uploaden"
		on:keydown={(e) => { if (e.key === 'Escape') showUploadPopup = false; }}
	>
		<button
			type="button"
			class="absolute inset-0 bg-black/40 backdrop-blur-sm"
			on:click={() => (showUploadPopup = false)}
			aria-label="Sluiten"
			tabindex="-1"
		></button>
		<div class="relative w-full max-w-lg mx-4 animate-in">
			<!-- Close button -->
			<button
				type="button"
				on:click={() => (showUploadPopup = false)}
				class="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-md hover:text-gray-600 transition-colors"
				aria-label="Sluiten"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<!-- Upload component -->
			<DocumentUpload
				projectId={project.id}
				organizationId={project.organization_id}
				onUploadComplete={handleUploadComplete}
			/>
		</div>
	</div>
{/if}
