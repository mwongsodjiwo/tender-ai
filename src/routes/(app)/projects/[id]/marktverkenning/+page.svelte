<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { DeskresearchResult } from '$types';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import MarktverkenningSearch from '$lib/components/marktverkenning/MarktverkenningSearch.svelte';
	import MarktverkenningDetail from '$lib/components/marktverkenning/MarktverkenningDetail.svelte';

	export let data: PageData;

	$: _sc = ((data as Record<string, unknown>).savedContent ?? {}) as Record<string, string>;
	$: profile = data.profile;
	$: projectId = $page.params.id;

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

	// Deskresearch state
	let deskresearchResults: DeskresearchResult[] = [];
	let deskresearchSummary = '';
	let deskresearchLoading = false;
	let deskresearchError = '';

	// RFI state
	let rfiContent = '';
	let rfiLoading = false;
	let rfiError = '';
	let rfiSaving = false;
	let rfiSaved = false;

	// Consultation state
	let consultContent = '';
	let consultSaving = false;
	let consultSaved = false;

	// Conversations state
	let conversationsContent = '';
	let conversationsSaving = false;
	let conversationsSaved = false;

	// Report state
	let reportContent = '';
	let reportLoading = false;
	let reportError = '';
	let reportSaving = false;
	let reportSaved = false;

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
			if (!res.ok) { deskresearchError = json.message || 'Deskresearch mislukt'; return; }
			deskresearchResults = json.data.results;
			deskresearchSummary = json.data.ai_summary || '';
		} catch { deskresearchError = 'Netwerkfout bij deskresearch'; }
		finally { deskresearchLoading = false; }
	}

	async function generateContent(endpoint: string): Promise<string | null> {
		const res = await fetch(`/api/projects/${projectId}/market-research/${endpoint}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});
		const json = await res.json();
		if (!res.ok) throw new Error(json.message || 'Generatie mislukt');
		return json.data.content;
	}

	async function saveContent(activityType: string, content: string): Promise<boolean> {
		try {
			const res = await fetch(`/api/projects/${projectId}/market-research/save`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ activity_type: activityType, content })
			});
			return res.ok;
		} catch { return false; }
	}

	async function handleGenerate(type: 'rfi' | 'report') {
		if (type === 'rfi') {
			rfiLoading = true; rfiError = '';
			try { rfiContent = (await generateContent('rfi/generate')) ?? ''; }
			catch (e) { rfiError = e instanceof Error ? e.message : 'Netwerkfout bij RFI-generatie'; }
			finally { rfiLoading = false; }
		} else {
			reportLoading = true; reportError = '';
			try { reportContent = (await generateContent('report/generate')) ?? ''; }
			catch (e) { reportError = e instanceof Error ? e.message : 'Netwerkfout bij rapportgeneratie'; }
			finally { reportLoading = false; }
		}
	}

	async function handleSave(type: string, content: string, setters: { saving: (v: boolean) => void; saved: (v: boolean) => void }) {
		setters.saving(true);
		const ok = await saveContent(type, content);
		setters.saving(false);
		setters.saved(ok);
		if (ok) setTimeout(() => setters.saved(false), 3000);
	}

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
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold text-gray-900">Marktverkenning</h1>
	</div>

	{#if !profile}
		<InfoBanner type="warning" title="Projectprofiel ontbreekt" message="Vul eerst het projectprofiel in voordat u de marktverkenning kunt starten. Het profiel bevat de CPV-codes en projectscope die nodig zijn voor de deskresearch." />
		<div class="flex">
			<a href="/projects/{projectId}/profile" class="inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Projectprofiel invullen</a>
		</div>
	{:else}
		<div>
			<nav class="flex gap-2" aria-label="Marktverkenning tabs">
				{#each TABS as tab (tab.key)}
					<button on:click={() => setTab(tab.key)} class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {activeTab === tab.key ? 'border border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-700'}" aria-current={activeTab === tab.key ? 'page' : undefined}>{tab.label}</button>
				{/each}
			</nav>
			<div class="mt-4 border-t border-gray-200"></div>
		</div>

		<div class="rounded-card bg-white shadow-card">
			<div class="border-b border-gray-100 px-6 pt-6 pb-4">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">{TABS.find((t) => t.key === activeTab)?.label ?? ''}</h2>
			</div>
			<div class="px-6 py-6">
				{#if activeTab === 'deskresearch'}
					<MarktverkenningSearch cpvCodes={profile.cpv_codes ?? []} loading={deskresearchLoading} error={deskresearchError} results={deskresearchResults} summary={deskresearchSummary} on:search={runDeskresearch} />
				{:else if activeTab === 'rfi'}
					<MarktverkenningDetail description="Genereer een concept RFI-vragenlijst op basis van uw projectprofiel." content={rfiContent} placeholder="De gegenereerde RFI-vragenlijst verschijnt hier. U kunt de tekst ook handmatig invoeren." status={_sc['rfi'] ? 'in_progress' : 'not_started'} loading={rfiLoading} error={rfiError} saving={rfiSaving} saved={rfiSaved} canGenerate={true} generateLabel="Genereer RFI" loadingLabel="RFI-vragenlijst genereren..." on:generate={() => handleGenerate('rfi')} on:save={() => handleSave('rfi', rfiContent, { saving: (v) => rfiSaving = v, saved: (v) => rfiSaved = v })} on:input={(e) => rfiContent = e.detail} />
				{:else if activeTab === 'consultatie'}
					<MarktverkenningDetail description="Voer hier de publicatietekst, reacties en notities van de marktconsultatie in." content={consultContent} placeholder="Voer hier de marktconsultatie-tekst, reacties van marktpartijen en uw notities in..." status={_sc['market_consultation'] ? 'in_progress' : 'not_started'} saving={consultSaving} saved={consultSaved} on:save={() => handleSave('market_consultation', consultContent, { saving: (v) => consultSaving = v, saved: (v) => consultSaved = v })} on:input={(e) => consultContent = e.detail} />
				{:else if activeTab === 'gesprekken'}
					<MarktverkenningDetail description="Voer hier de verslagen van gevoerde gesprekken met marktpartijen in." content={conversationsContent} placeholder="Voer hier de gespreksverslagen in. Gebruik een duidelijke structuur per gesprek: datum, deelnemer(s), onderwerp, bevindingen..." status={_sc['conversations'] ? 'in_progress' : 'not_started'} saving={conversationsSaving} saved={conversationsSaved} on:save={() => handleSave('conversations', conversationsContent, { saving: (v) => conversationsSaving = v, saved: (v) => conversationsSaved = v })} on:input={(e) => conversationsContent = e.detail} />
				{:else if activeTab === 'rapport'}
					<MarktverkenningDetail description="Genereer een concept rapport op basis van alle marktverkenning-input." content={reportContent} placeholder="Het gegenereerde rapport verschijnt hier. U kunt de tekst ook handmatig invoeren of aanpassen." status={_sc['report'] ? 'in_progress' : 'not_started'} loading={reportLoading} error={reportError} saving={reportSaving} saved={reportSaved} canGenerate={true} generateLabel="Genereer rapport" loadingLabel="Marktverkenningsrapport genereren..." rows={25} on:generate={() => handleGenerate('report')} on:save={() => handleSave('report', reportContent, { saving: (v) => reportSaving = v, saved: (v) => reportSaved = v })} on:input={(e) => reportContent = e.detail} />
				{/if}
			</div>
		</div>
	{/if}
</div>
