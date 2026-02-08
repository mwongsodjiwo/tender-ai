<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import TiptapEditor from '$components/TiptapEditor.svelte';
	import StepperSidebar from '$lib/components/StepperSidebar.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import {
		CONTRACT_TYPE_LABELS,
		GENERAL_CONDITIONS_LABELS,
		GENERAL_CONDITIONS_DESCRIPTIONS
	} from '$types';
	import type { ContractType, GeneralConditionsType } from '$types';
	import type { PageData } from './$types';

	export let data: PageData;

	// Reactive data
	$: project = data.project;
	$: documentType = data.documentType;
	$: artifacts = data.artifacts;
	$: templateSections = data.templateSections as { key: string; title: string; description: string }[];

	// Current section
	let currentSectionIndex = data.activeIndex;
	$: activeArtifact = artifacts[currentSectionIndex] ?? null;

	// Editor state
	let editedContent = data.activeArtifact?.content ?? '';
	let savedContent = editedContent;
	let saving = false;
	let saveMessage = '';
	let previewMode = false;

	$: hasChanges = editedContent !== savedContent;

	// Contract settings — use data.project directly (reactive $: project is not yet assigned at init)
	let contractType: ContractType | null = (data.project?.contract_type as ContractType) ?? null;
	let generalConditions: GeneralConditionsType | null = (data.project?.general_conditions as GeneralConditionsType) ?? null;
	let settingsSaving = false;

	// AI generation
	let generating = false;
	let generatingMessage = '';

	// Standard text
	let insertingStandard = false;

	// Chat state
	let conversationId = data.conversationId;
	let chatMessages = [...(data.chatMessages ?? [])];
	let chatInput = '';
	let chatLoading = false;
	let chatContainer: HTMLElement;
	let chatOpen = false;

	// Progress
	$: approvedCount = artifacts.filter((a) => a.status === 'approved').length;
	$: totalCount = artifacts.length;
	$: requiredEmpty = artifacts.filter((a) => !a.content || a.content.trim() === '').length;

	// Stepper steps — with warning for empty required articles
	$: steps = artifacts.map((a, i) => ({
		label: a.title,
		status: (a.status === 'approved'
			? 'completed'
			: i === currentSectionIndex
				? 'active'
				: 'pending') as 'completed' | 'active' | 'pending',
		hasWarning: !a.content || a.content.trim() === ''
	}));

	// Sync when server data changes
	let lastLoadedArtifactId = data.activeArtifact?.id ?? '';
	$: if (data.activeArtifact) {
		const newId = data.activeArtifact.id;
		if (newId !== lastLoadedArtifactId) {
			lastLoadedArtifactId = newId;
			editedContent = data.activeArtifact.content ?? '';
			savedContent = editedContent;
			conversationId = data.conversationId;
			chatMessages = [...(data.chatMessages ?? [])];
			currentSectionIndex = data.activeIndex;
			previewMode = false;
		}
	}

	// Template section info for the active article
	$: activeSectionInfo = activeArtifact
		? templateSections.find((s) => s.key === activeArtifact.section_key)
		: null;

	async function saveContent() {
		if (!activeArtifact || !hasChanges || saving) return;
		saving = true;
		saveMessage = '';

		const response = await fetch(`/api/projects/${project.id}/artifacts/${activeArtifact.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: editedContent })
		});

		if (response.ok) {
			saveMessage = 'Opgeslagen';
			savedContent = editedContent;
			setTimeout(() => { saveMessage = ''; }, 2000);
		} else {
			saveMessage = 'Fout bij opslaan';
		}

		saving = false;
	}

	async function navigateToSection(index: number) {
		if (index === currentSectionIndex) return;
		if (index < 0 || index >= artifacts.length) return;

		if (hasChanges) {
			await saveContent();
		}

		const targetArtifact = artifacts[index];
		await goto(
			`/projects/${project.id}/contract?section=${targetArtifact.id}`,
			{ replaceState: true, invalidateAll: true }
		);
	}

	async function handleStepClick(index: number) {
		await navigateToSection(index);
	}

	async function goNext() {
		if (currentSectionIndex < artifacts.length - 1) {
			await navigateToSection(currentSectionIndex + 1);
		}
	}

	async function goPrevious() {
		if (currentSectionIndex > 0) {
			await navigateToSection(currentSectionIndex - 1);
		}
	}

	async function saveSettings() {
		settingsSaving = true;
		await fetch(`/api/projects/${project.id}/contract/settings`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contract_type: contractType,
				general_conditions: generalConditions
			})
		});
		settingsSaving = false;
	}

	async function generateArticle() {
		if (!activeArtifact || generating) return;
		generating = true;
		generatingMessage = '';

		const response = await fetch(
			`/api/projects/${project.id}/contract/generate/${activeArtifact.section_key}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			}
		);

		if (response.ok) {
			const result = await response.json();
			editedContent = result.data.content;
			generatingMessage = result.data.fallback
				? 'Standaardtekst ingevoegd (AI niet beschikbaar)'
				: 'Artikel gegenereerd';
			setTimeout(() => { generatingMessage = ''; }, 3000);
		} else {
			generatingMessage = 'Generatie mislukt';
			setTimeout(() => { generatingMessage = ''; }, 3000);
		}

		generating = false;
	}

	async function insertStandardText() {
		if (!activeArtifact || insertingStandard) return;
		insertingStandard = true;

		const response = await fetch(
			`/api/projects/${project.id}/contract/standard-text/${activeArtifact.section_key}`
		);

		if (response.ok) {
			const result = await response.json();
			editedContent = result.data.content;
		}

		insertingStandard = false;
	}

	// Chat functions
	async function scrollChatToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	async function sendChatMessage() {
		if (!chatInput.trim() || chatLoading || !activeArtifact) return;

		const userMessage = chatInput.trim();
		chatInput = '';
		chatLoading = true;

		chatMessages = [
			...chatMessages,
			{
				id: `user-${Date.now()}`,
				role: 'user',
				content: userMessage,
				created_at: new Date().toISOString()
			}
		];
		await scrollChatToBottom();

		const response = await fetch(`/api/projects/${project.id}/section-chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				artifact_id: activeArtifact.id,
				conversation_id: conversationId ?? undefined,
				message: userMessage
			})
		});

		const result = await response.json();

		if (!response.ok) {
			chatMessages = [
				...chatMessages,
				{
					id: `error-${Date.now()}`,
					role: 'assistant',
					content: `Fout: ${result.message ?? 'Er is een fout opgetreden'}`,
					created_at: new Date().toISOString()
				}
			];
			chatLoading = false;
			await scrollChatToBottom();
			return;
		}

		conversationId = result.data.conversation_id;

		chatMessages = [
			...chatMessages,
			{
				id: result.data.message_id,
				role: 'assistant',
				content: result.data.content,
				created_at: new Date().toISOString()
			}
		];

		if (result.data.has_update && result.data.updated_artifact) {
			editedContent = result.data.updated_artifact.content ?? editedContent;
			savedContent = editedContent;
		}

		chatLoading = false;
		await scrollChatToBottom();
	}

	function handleChatKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendChatMessage();
		}
	}
</script>

<svelte:head>
	<title>Conceptovereenkomst — {project.name} — Tendermanager</title>
</svelte:head>

<!-- Fullscreen wizard overlay -->
<div class="fixed inset-0 z-[60] flex flex-col bg-[#F5F5F5]">
	<!-- Header -->
	<header class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
		<div class="flex items-center gap-4">
			<a
				href="/projects/{project.id}/documents"
				class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Terug
			</a>
			<h1 class="text-lg font-semibold text-gray-900">Conceptovereenkomst</h1>
		</div>
		<div class="flex items-center gap-3">
			{#if requiredEmpty > 0}
				<span class="hidden text-xs text-warning-600 sm:inline">
					{requiredEmpty} verplicht{requiredEmpty === 1 ? '' : 'e'} artikel{requiredEmpty === 1 ? '' : 'en'} leeg
				</span>
			{/if}
			<span class="hidden text-sm text-gray-500 sm:inline">
				{approvedCount}/{totalCount} verplichte artikelen
			</span>
			<div class="w-32 sm:w-48">
				<ProgressBar value={approvedCount} max={totalCount || 1} showPercentage={true} size="sm" />
			</div>
		</div>
	</header>

	<!-- Main content -->
	<div class="flex min-h-0 flex-1 overflow-hidden">
		<!-- Left sidebar: articles + settings -->
		<aside class="hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white lg:flex">
			<!-- Contract settings -->
			<div class="border-b border-gray-200 p-4">
				<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Instellingen</h3>

				<!-- Type opdracht -->
				<label for="contract-type" class="mt-3 block text-xs font-medium text-gray-700">
					Type opdracht
				</label>
				<select
					id="contract-type"
					bind:value={contractType}
					on:change={saveSettings}
					disabled={settingsSaving}
					class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
				>
					<option value={null}>Selecteer...</option>
					{#each Object.entries(CONTRACT_TYPE_LABELS) as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>

				<!-- Algemene voorwaarden -->
				<label for="general-conditions" class="mt-3 block text-xs font-medium text-gray-700">
					Algemene voorwaarden
				</label>
				<select
					id="general-conditions"
					bind:value={generalConditions}
					on:change={saveSettings}
					disabled={settingsSaving}
					class="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
				>
					<option value={null}>Selecteer...</option>
					{#each Object.entries(GENERAL_CONDITIONS_LABELS) as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>
				{#if generalConditions && generalConditions !== 'custom'}
					<p class="mt-1 text-[10px] text-gray-400">
						{GENERAL_CONDITIONS_DESCRIPTIONS[generalConditions] ?? ''}
					</p>
				{/if}
			</div>

			<!-- Article list stepper -->
			<div class="flex-1 overflow-y-auto p-4">
				<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Artikelen</h3>
				<nav aria-label="Artikelen" class="w-full">
					<ol class="space-y-1">
						{#each artifacts as artifact, index}
							{@const isEmpty = !artifact.content || artifact.content.trim() === ''}
							<li class="relative">
								{#if index < artifacts.length - 1}
									<div
										class="absolute left-4 top-8 h-full w-0.5 -translate-x-1/2 {artifact.status === 'approved'
											? 'bg-success-600'
											: index === currentSectionIndex
												? 'bg-primary-600'
												: 'bg-gray-200'}"
										aria-hidden="true"
									></div>
								{/if}
								<button
									type="button"
									class="group relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
									aria-current={index === currentSectionIndex ? 'step' : undefined}
									on:click={() => handleStepClick(index)}
								>
									<span
										class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium {artifact.status === 'approved'
											? 'bg-success-600 text-white'
											: index === currentSectionIndex
												? 'bg-primary-600 text-white ring-2 ring-primary-200'
												: 'bg-gray-200 text-gray-500'}"
										aria-hidden="true"
									>
										{#if artifact.status === 'approved'}
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
											</svg>
										{:else}
											{index + 1}
										{/if}
									</span>
									<span class="min-w-0 flex-1 truncate text-xs {index === currentSectionIndex
										? 'font-semibold text-primary-700'
										: artifact.status === 'approved'
											? 'text-gray-700'
											: 'text-gray-400'}">
										{artifact.title}
									</span>
									{#if isEmpty}
										<svg class="h-3.5 w-3.5 shrink-0 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Verplicht artikel is leeg">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
										</svg>
									{/if}
								</button>
							</li>
						{/each}
					</ol>
				</nav>
			</div>
		</aside>

		<!-- Editor area -->
		<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
			{#if artifacts.length === 0}
				<!-- Empty state -->
				<div class="flex flex-1 items-center justify-center p-8">
					<div class="text-center">
						<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<h3 class="mt-3 text-sm font-semibold text-gray-900">Geen artikelen beschikbaar</h3>
						<p class="mt-1 text-sm text-gray-500">
							Voltooi eerst de briefing om de conceptovereenkomst te laten genereren.
						</p>
					</div>
				</div>
			{:else if activeArtifact}
				<!-- Article header -->
				<div class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
					<div class="flex items-center gap-3">
						<span class="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
							{currentSectionIndex + 1}
						</span>
						<h2 class="text-base font-semibold text-gray-900">{activeArtifact.title}</h2>
						<StatusBadge status={activeArtifact.status} />
						{#if !activeArtifact.content || activeArtifact.content.trim() === ''}
							<span class="rounded-badge bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
								Verplicht
							</span>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						{#if saveMessage}
							<span class="text-sm text-green-600">{saveMessage}</span>
						{/if}
						{#if generatingMessage}
							<span class="text-sm text-primary-600">{generatingMessage}</span>
						{/if}
						{#if hasChanges}
							<span class="text-xs text-amber-600">Niet-opgeslagen wijzigingen</span>
						{/if}
						<!-- Editor/Preview toggle -->
						<div class="flex rounded-md border border-gray-300">
							<button
								type="button"
								class="px-3 py-1 text-xs font-medium {!previewMode ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}"
								on:click={() => { previewMode = false; }}
							>
								Bewerken
							</button>
							<button
								type="button"
								class="border-l border-gray-300 px-3 py-1 text-xs font-medium {previewMode ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}"
								on:click={() => { previewMode = true; }}
							>
								Voorbeeld
							</button>
						</div>
					</div>
				</div>

				<!-- AI Assistant block -->
				<div class="shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-2.5 sm:px-6">
					<div class="flex items-center gap-3">
						<div class="flex items-center gap-2">
							<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							<span class="text-xs font-medium text-gray-700">AI Assistent</span>
						</div>
						<button
							type="button"
							on:click={generateArticle}
							disabled={generating}
							class="rounded-md bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
						>
							{generating ? 'Genereren...' : 'Genereer artikel'}
						</button>
						{#if generalConditions && generalConditions !== 'custom'}
							<button
								type="button"
								on:click={insertStandardText}
								disabled={insertingStandard}
								class="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								{insertingStandard ? 'Laden...' : 'Standaardtekst invoegen'}
							</button>
						{/if}
						{#if activeSectionInfo?.description}
							<span class="hidden text-[10px] text-gray-400 xl:inline">{activeSectionInfo.description}</span>
						{/if}
					</div>
				</div>

				<!-- Editor or Preview -->
				<div class="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6">
					{#if previewMode}
						<div class="flex-1 overflow-y-auto rounded-lg bg-white p-6 shadow-sm">
							<div class="prose prose-sm max-w-none">
								{@html editedContent || '<p class="text-gray-400">Nog geen inhoud voor dit artikel.</p>'}
							</div>
						</div>
					{:else}
						<div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg shadow-sm">
							<TiptapEditor
								content={editedContent}
								placeholder="Begin hier met het bewerken van het artikel..."
								on:change={(e) => {
									const isInitialLoad = editedContent === (activeArtifact?.content ?? '');
									editedContent = e.detail;
									if (isInitialLoad) savedContent = editedContent;
								}}
							/>
						</div>
					{/if}
				</div>

				<!-- Footer navigation -->
				<div class="flex shrink-0 items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
					<div>
						{#if currentSectionIndex > 0}
							<button
								on:click={goPrevious}
								class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
								type="button"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
								</svg>
								Vorig artikel
							</button>
						{:else}
							<div></div>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<button
							on:click={saveContent}
							disabled={!hasChanges || saving}
							class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							type="button"
						>
							{saving ? 'Opslaan...' : 'Opslaan'}
						</button>
						{#if currentSectionIndex < artifacts.length - 1}
							<button
								on:click={goNext}
								class="inline-flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
								type="button"
							>
								Volgend artikel
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</button>
						{:else}
							<a
								href="/projects/{project.id}/documents"
								class="inline-flex items-center gap-1 rounded-md bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700"
							>
								Afronden
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							</a>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Chat button (floating) -->
	{#if activeArtifact}
		<button
			type="button"
			class="fixed bottom-20 right-6 z-[70] inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
			on:click={() => { chatOpen = !chatOpen; }}
			aria-label="Chat met AI"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
			</svg>
			{#if !chatOpen}
				<span class="hidden sm:inline">Chat met AI</span>
			{/if}
		</button>
	{/if}

	<!-- Chat panel -->
	{#if chatOpen && activeArtifact}
		<div class="fixed inset-x-0 bottom-0 z-[70] flex flex-col bg-white shadow-2xl lg:inset-x-auto lg:right-0 lg:top-0 lg:w-96 lg:border-l lg:border-gray-200 lg:shadow-none">
			<!-- Chat header -->
			<div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
				<div>
					<h3 class="text-sm font-semibold text-gray-900">AI-assistent</h3>
					<p class="text-xs text-gray-500">{activeArtifact.title}</p>
				</div>
				<button
					on:click={() => { chatOpen = false; }}
					class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					aria-label="Chat sluiten"
					type="button"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Chat messages -->
			<div
				bind:this={chatContainer}
				class="flex-1 overflow-y-auto p-4"
				style="max-height: 60vh;"
				role="log"
				aria-label="Artikel-chat"
			>
				{#if chatMessages.length === 0}
					<div class="flex h-full items-center justify-center">
						<div class="text-center">
							<p class="text-sm font-medium text-gray-900">AI-assistent</p>
							<p class="mt-1 text-xs text-gray-500">
								Stel vragen over dit artikel of vraag om juridische verbeteringen.
							</p>
						</div>
					</div>
				{:else}
					<div class="space-y-3">
						{#each chatMessages as msg (msg.id)}
							<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
								<div
									class="max-w-[90%] rounded-lg px-3 py-2 {msg.role === 'user'
										? 'bg-primary-600 text-white'
										: 'bg-gray-100 text-gray-900'}"
								>
									<div class="whitespace-pre-wrap text-xs">{msg.content}</div>
								</div>
							</div>
						{/each}

						{#if chatLoading}
							<div class="flex justify-start">
								<div class="rounded-lg bg-gray-100 px-3 py-2">
									<div class="flex space-x-1">
										<div class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></div>
										<div class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay: 0.1s"></div>
										<div class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay: 0.2s"></div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Chat input -->
			<div class="shrink-0 border-t border-gray-200 p-3">
				<div class="flex gap-2">
					<textarea
						bind:value={chatInput}
						on:keydown={handleChatKeydown}
						disabled={chatLoading}
						rows="2"
						placeholder="Stel een juridische vraag over dit artikel..."
						class="flex-1 resize-none rounded border border-gray-300 px-3 py-1.5 text-xs focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
						aria-label="Chatbericht invoeren"
					></textarea>
					<button
						on:click={sendChatMessage}
						disabled={chatLoading || !chatInput.trim()}
						class="self-end rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
						aria-label="Chatbericht versturen"
						type="button"
					>
						Stuur
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Mobile stepper (bottom sheet) -->
<div class="fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white p-2 lg:hidden">
	<div class="flex items-center justify-between px-2">
		<span class="text-xs text-gray-500">
			Artikel {currentSectionIndex + 1} van {totalCount}
		</span>
		<div class="flex gap-1">
			{#each artifacts as _, i}
				<button
					on:click={() => navigateToSection(i)}
					class="h-2 w-2 rounded-full {i === currentSectionIndex
						? 'bg-primary-600'
						: artifacts[i].status === 'approved'
							? 'bg-success-600'
							: 'bg-gray-300'}"
					aria-label="Ga naar artikel {i + 1}"
					type="button"
				></button>
			{/each}
		</div>
	</div>
</div>
