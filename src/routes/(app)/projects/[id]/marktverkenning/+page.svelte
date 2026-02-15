<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { DeskresearchResult } from '$types';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	export let data: PageData;

	// Safe accessor — data.savedContent may be undefined during SSR hydration
	$: _sc = ((data as Record<string, unknown>).savedContent ?? {}) as Record<string, string>;
	$: project = data.project;
	$: profile = data.profile;
	$: projectId = $page.params.id;

	// Tab management via URL query parameter
	const TABS = [
		{ key: 'deskresearch', label: 'Deskresearch' },
		{ key: 'rfi', label: 'RFI' },
		{ key: 'consultatie', label: 'Marktconsultatie' },
		{ key: 'gesprekken', label: 'Gesprekken' },
		{ key: 'rapport', label: 'Rapport' }
	] as const;

	type TabKey = (typeof TABS)[number]['key'];

	$: activeTab = (($page.url.searchParams.get('tab') as TabKey) || 'deskresearch') as TabKey;

	function setTab(tab: TabKey) {
		goto(`?tab=${tab}`, { replaceState: true, noScroll: true });
	}

	// ==========================================================================
	// Deskresearch state
	// ==========================================================================
	let deskresearchResults: DeskresearchResult[] = [];
	let deskresearchSummary = '';
	let deskresearchLoading = false;
	let deskresearchError = '';

	async function runDeskresearch() {
		deskresearchLoading = true;
		deskresearchError = '';
		try {
			const res = await fetch(`/api/projects/${projectId}/market-research/deskresearch`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			const json = await res.json();
			if (!res.ok) {
				deskresearchError = json.message || 'Deskresearch mislukt';
				return;
			}
			deskresearchResults = json.data.results;
			deskresearchSummary = json.data.ai_summary || '';
		} catch {
			deskresearchError = 'Netwerkfout bij deskresearch';
		} finally {
			deskresearchLoading = false;
		}
	}

	// ==========================================================================
	// RFI state
	// ==========================================================================
	let rfiContent = '';
	let rfiLoading = false;
	let rfiError = '';
	let rfiSaving = false;
	let rfiSaved = false;

	async function generateRfi() {
		rfiLoading = true;
		rfiError = '';
		try {
			const res = await fetch(`/api/projects/${projectId}/market-research/rfi/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			const json = await res.json();
			if (!res.ok) {
				rfiError = json.message || 'RFI-generatie mislukt';
				return;
			}
			rfiContent = json.data.content;
		} catch {
			rfiError = 'Netwerkfout bij RFI-generatie';
		} finally {
			rfiLoading = false;
		}
	}

	// ==========================================================================
	// Market consultation state
	// ==========================================================================
	let consultContent = '';
	let consultSaving = false;
	let consultSaved = false;

	// ==========================================================================
	// Conversations state
	// ==========================================================================
	let conversationsContent = '';
	let conversationsSaving = false;
	let conversationsSaved = false;

	// ==========================================================================
	// Report state
	// ==========================================================================
	let reportContent = '';
	let reportLoading = false;
	let reportError = '';
	let reportSaving = false;
	let reportSaved = false;

	async function generateReport() {
		reportLoading = true;
		reportError = '';
		try {
			const res = await fetch(`/api/projects/${projectId}/market-research/report/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			const json = await res.json();
			if (!res.ok) {
				reportError = json.message || 'Rapportgeneratie mislukt';
				return;
			}
			reportContent = json.data.content;
		} catch {
			reportError = 'Netwerkfout bij rapportgeneratie';
		} finally {
			reportLoading = false;
		}
	}

	// ==========================================================================
	// Generic save function
	// ==========================================================================
	async function saveContent(activityType: string, content: string): Promise<boolean> {
		try {
			const res = await fetch(`/api/projects/${projectId}/market-research/save`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ activity_type: activityType, content })
			});
			return res.ok;
		} catch {
			return false;
		}
	}

	async function saveRfi() {
		rfiSaving = true;
		rfiSaved = false;
		const ok = await saveContent('rfi', rfiContent);
		rfiSaving = false;
		rfiSaved = ok;
		if (ok) setTimeout(() => (rfiSaved = false), 3000);
	}

	async function saveConsult() {
		consultSaving = true;
		consultSaved = false;
		const ok = await saveContent('market_consultation', consultContent);
		consultSaving = false;
		consultSaved = ok;
		if (ok) setTimeout(() => (consultSaved = false), 3000);
	}

	async function saveConversations() {
		conversationsSaving = true;
		conversationsSaved = false;
		const ok = await saveContent('conversations', conversationsContent);
		conversationsSaving = false;
		conversationsSaved = ok;
		if (ok) setTimeout(() => (conversationsSaved = false), 3000);
	}

	async function saveReport() {
		reportSaving = true;
		reportSaved = false;
		const ok = await saveContent('report', reportContent);
		reportSaving = false;
		reportSaved = ok;
		if (ok) setTimeout(() => (reportSaved = false), 3000);
	}

	// Reactive: update editor content when _sc changes
	$: if (_sc['rfi'] && !rfiContent) rfiContent = _sc['rfi'];
	$: if (_sc['market_consultation'] && !consultContent) consultContent = _sc['market_consultation'];
	$: if (_sc['conversations'] && !conversationsContent) conversationsContent = _sc['conversations'];
	$: if (_sc['report'] && !reportContent) reportContent = _sc['report'];
</script>

<svelte:head>
	<title>Marktverkenning — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<BackButton />

	<!-- Page header -->
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold text-gray-900">Marktverkenning</h1>
	</div>

	<!-- Profile check -->
	{#if !profile}
		<InfoBanner
			type="warning"
			title="Projectprofiel ontbreekt"
			message="Vul eerst het projectprofiel in voordat u de marktverkenning kunt starten. Het profiel bevat de CPV-codes en projectscope die nodig zijn voor de deskresearch."
		/>
		<div class="flex">
			<a
				href="/projects/{projectId}/profile"
				class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
			>
				Projectprofiel invullen
			</a>
		</div>
	{:else}
		<!-- Tab navigation -->
		<div>
			<nav class="flex gap-2" aria-label="Marktverkenning tabs">
				{#each TABS as tab (tab.key)}
					<button
						on:click={() => setTab(tab.key)}
						class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors
							{activeTab === tab.key
								? 'border border-gray-900 text-gray-900'
								: 'text-gray-500 hover:text-gray-700'}"
						aria-current={activeTab === tab.key ? 'page' : undefined}
					>
						{tab.label}
					</button>
				{/each}
			</nav>
			<div class="mt-4 border-t border-gray-200"></div>
		</div>

		<!-- Tab content -->
		<div class="rounded-card bg-white shadow-card">
			<!-- Section title -->
			<div class="border-b border-gray-100 px-6 pt-6 pb-4">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">
					{TABS.find((t) => t.key === activeTab)?.label ?? ''}
				</h2>
			</div>

			<div class="px-6 py-6">
			<!-- ================================================================ -->
			<!-- TAB: Deskresearch -->
			<!-- ================================================================ -->
			{#if activeTab === 'deskresearch'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<p class="text-sm text-gray-500">
							Doorzoek de kennisbank op vergelijkbare aanbestedingen op basis van uw projectprofiel (CPV-codes: {(profile.cpv_codes ?? []).join(', ') || 'geen'}).
						</p>
						<button
							on:click={runDeskresearch}
							disabled={deskresearchLoading}
							class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if deskresearchLoading}
								<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
								Zoeken...
							{:else}
								Zoek in kennisbank
							{/if}
						</button>
					</div>

					{#if deskresearchError}
						<InfoBanner type="error" message={deskresearchError} />
					{/if}

					{#if deskresearchLoading}
						<LoadingSpinner label="Kennisbank doorzoeken..." />
					{:else if deskresearchResults.length > 0}
						<!-- AI Summary -->
						{#if deskresearchSummary}
							<div class="rounded-lg border border-primary-200 bg-primary-50 p-4">
								<h3 class="text-sm font-semibold text-primary-800">AI Samenvatting</h3>
								<div class="mt-2 text-sm text-primary-700 whitespace-pre-wrap">{deskresearchSummary}</div>
							</div>
						{/if}

						<!-- Results -->
						<div class="space-y-3">
							<h3 class="text-sm font-semibold text-gray-700">{deskresearchResults.length} resultaten gevonden</h3>
							{#each deskresearchResults as result (result.id)}
								<div class="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
									<div class="flex items-start justify-between">
										<h4 class="text-sm font-medium text-gray-900">{result.title}</h4>
										<span class="ml-2 shrink-0 rounded-badge bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
											{Math.round(result.relevance * 100)}% relevant
										</span>
									</div>
									{#if result.contracting_authority}
										<p class="mt-1 text-xs text-gray-500">Opdrachtgever: {result.contracting_authority}</p>
									{/if}
									<div class="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
										{#if result.cpv_codes.length > 0}
											<span>CPV: {result.cpv_codes.join(', ')}</span>
										{/if}
										{#if result.estimated_value}
											<span>Waarde: &euro;{result.estimated_value.toLocaleString('nl-NL')}</span>
										{/if}
										{#if result.publication_date}
											<span>Publicatie: {new Date(result.publication_date).toLocaleDateString('nl-NL')}</span>
										{/if}
									</div>
									{#if result.snippet}
										<p class="mt-2 text-sm text-gray-600 line-clamp-2">{result.snippet}</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else if !deskresearchError}
						<div class="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
							<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
							</svg>
							<p class="mt-2 text-sm text-gray-500">Klik op "Zoek in kennisbank" om vergelijkbare aanbestedingen te vinden.</p>
						</div>
					{/if}
				</div>

			<!-- ================================================================ -->
			<!-- TAB: RFI -->
			<!-- ================================================================ -->
			{:else if activeTab === 'rfi'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<p class="text-sm text-gray-500">Genereer een concept RFI-vragenlijst op basis van uw projectprofiel.</p>
						<div class="flex items-center gap-2">
							{#if rfiSaved}
								<span class="text-sm text-success-600">Opgeslagen</span>
							{/if}
							<StatusBadge status={_sc['rfi'] ? 'in_progress' : 'not_started'} />
						</div>
					</div>

					{#if rfiError}
						<InfoBanner type="error" message={rfiError} />
					{/if}

					<div class="flex gap-2">
						<button
							on:click={generateRfi}
							disabled={rfiLoading}
							class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if rfiLoading}
								<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
								Genereren...
							{:else}
								Genereer RFI
							{/if}
						</button>
						{#if rfiContent}
							<button
								on:click={saveRfi}
								disabled={rfiSaving}
								class="inline-flex items-center rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								{rfiSaving ? 'Opslaan...' : 'Opslaan'}
							</button>
						{/if}
					</div>

					{#if rfiLoading}
						<LoadingSpinner label="RFI-vragenlijst genereren..." />
					{:else}
						<textarea
							bind:value={rfiContent}
							rows="20"
							class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 font-mono"
							placeholder="De gegenereerde RFI-vragenlijst verschijnt hier. U kunt de tekst ook handmatig invoeren."
						></textarea>
					{/if}
				</div>

			<!-- ================================================================ -->
			<!-- TAB: Marktconsultatie -->
			<!-- ================================================================ -->
			{:else if activeTab === 'consultatie'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<p class="text-sm text-gray-500">Voer hier de publicatietekst, reacties en notities van de marktconsultatie in.</p>
						<div class="flex items-center gap-2">
							{#if consultSaved}
								<span class="text-sm text-success-600">Opgeslagen</span>
							{/if}
							<StatusBadge status={_sc['market_consultation'] ? 'in_progress' : 'not_started'} />
						</div>
					</div>

					<textarea
						bind:value={consultContent}
						rows="20"
						class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 font-mono"
						placeholder="Voer hier de marktconsultatie-tekst, reacties van marktpartijen en uw notities in..."
					></textarea>

					<div class="flex justify-end">
						<button
							on:click={saveConsult}
							disabled={consultSaving || !consultContent}
							class="inline-flex items-center rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							{consultSaving ? 'Opslaan...' : 'Opslaan'}
						</button>
					</div>
				</div>

			<!-- ================================================================ -->
			<!-- TAB: Gesprekken -->
			<!-- ================================================================ -->
			{:else if activeTab === 'gesprekken'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<p class="text-sm text-gray-500">Voer hier de verslagen van gevoerde gesprekken met marktpartijen in.</p>
						<div class="flex items-center gap-2">
							{#if conversationsSaved}
								<span class="text-sm text-success-600">Opgeslagen</span>
							{/if}
							<StatusBadge status={_sc['conversations'] ? 'in_progress' : 'not_started'} />
						</div>
					</div>

					<textarea
						bind:value={conversationsContent}
						rows="20"
						class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 font-mono"
						placeholder="Voer hier de gespreksverslagen in. Gebruik een duidelijke structuur per gesprek: datum, deelnemer(s), onderwerp, bevindingen..."
					></textarea>

					<div class="flex justify-end">
						<button
							on:click={saveConversations}
							disabled={conversationsSaving || !conversationsContent}
							class="inline-flex items-center rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							{conversationsSaving ? 'Opslaan...' : 'Opslaan'}
						</button>
					</div>
				</div>

			<!-- ================================================================ -->
			<!-- TAB: Rapport -->
			<!-- ================================================================ -->
			{:else if activeTab === 'rapport'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<p class="text-sm text-gray-500">Genereer een concept rapport op basis van alle marktverkenning-input.</p>
						<div class="flex items-center gap-2">
							{#if reportSaved}
								<span class="text-sm text-success-600">Opgeslagen</span>
							{/if}
							<StatusBadge status={_sc['report'] ? 'in_progress' : 'not_started'} />
						</div>
					</div>

					{#if reportError}
						<InfoBanner type="error" message={reportError} />
					{/if}

					<div class="flex gap-2">
						<button
							on:click={generateReport}
							disabled={reportLoading}
							class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if reportLoading}
								<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
								Genereren...
							{:else}
								Genereer rapport
							{/if}
						</button>
						{#if reportContent}
							<button
								on:click={saveReport}
								disabled={reportSaving}
								class="inline-flex items-center rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								{reportSaving ? 'Opslaan...' : 'Opslaan'}
							</button>
						{/if}
					</div>

					{#if reportLoading}
						<LoadingSpinner label="Marktverkenningsrapport genereren..." />
					{:else}
						<textarea
							bind:value={reportContent}
							rows="25"
							class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 font-mono"
							placeholder="Het gegenereerde rapport verschijnt hier. U kunt de tekst ook handmatig invoeren of aanpassen."
						></textarea>
					{/if}
				</div>
			{/if}
			</div>
		</div>
	{/if}
</div>
