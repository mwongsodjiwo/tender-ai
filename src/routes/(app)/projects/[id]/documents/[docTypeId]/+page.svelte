<script lang="ts">
	import { tick } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import TiptapEditor from '$components/TiptapEditor.svelte';
	import StepperSidebar from '$lib/components/StepperSidebar.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	// Current section index
	let currentSectionIndex = data.activeIndex;

	// Reactive data
	$: artifacts = data.artifacts;
	$: documentType = data.documentType;
	$: project = data.project;
	$: activeArtifact = artifacts[currentSectionIndex] ?? null;

	// Editor state
	let editedContent = data.activeArtifact?.content ?? '';
	let savedContent = editedContent;
	let saving = false;
	let saveMessage = '';

	$: hasChanges = editedContent !== savedContent;

	// Chat state
	let conversationId = data.conversationId;
	let chatMessages = [...(data.chatMessages ?? [])];
	let chatInput = '';
	let chatLoading = false;
	let chatContainer: HTMLElement;
	let chatOpen = false;

	// Progress calculation
	$: approvedCount = artifacts.filter((a) => a.status === 'approved').length;
	$: totalCount = artifacts.length;
	$: progressPercentage = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

	// Stepper steps
	$: steps = artifacts.map((a, i) => ({
		label: a.title,
		status: (a.status === 'approved'
			? 'completed'
			: i === currentSectionIndex
				? 'active'
				: 'pending') as 'completed' | 'active' | 'pending'
	}));

	// Sync state when data changes from server
	$: if (data.activeArtifact) {
		// Only reset when the active artifact actually changes (different id)
		const newId = data.activeArtifact.id;
		if (newId !== lastLoadedArtifactId) {
			lastLoadedArtifactId = newId;
			editedContent = data.activeArtifact.content ?? '';
			savedContent = editedContent;
			conversationId = data.conversationId;
			chatMessages = [...(data.chatMessages ?? [])];
			currentSectionIndex = data.activeIndex;
		}
	}
	let lastLoadedArtifactId = data.activeArtifact?.id ?? '';

	async function scrollChatToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

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
			setTimeout(() => {
				saveMessage = '';
			}, 2000);
		} else {
			saveMessage = 'Fout bij opslaan';
		}

		saving = false;
	}

	async function navigateToSection(index: number) {
		if (index === currentSectionIndex) return;
		if (index < 0 || index >= artifacts.length) return;

		// Save first if there are changes
		if (hasChanges) {
			await saveContent();
		}

		const targetArtifact = artifacts[index];
		await goto(
			`/projects/${project.id}/documents/${documentType.id}?section=${targetArtifact.id}`,
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

		// If AI updated the artifact, refresh editor content
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
	<title>{documentType.name} — {project.name} — Tendermanager</title>
</svelte:head>

<!-- Fullscreen wizard overlay — z-[60] to cover the app Navigation sidebar (z-50) -->
<div class="fixed inset-0 z-[60] flex flex-col bg-[#F5F5F5]">
	<!-- Header -->
	<header class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
		<div class="flex items-center gap-4">
			<a
				href="/projects/{project.id}/documents"
				class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Terug
			</a>
			<h1 class="text-lg font-semibold text-gray-900">{documentType.name}</h1>
		</div>
		<div class="flex items-center gap-3">
			<span class="hidden text-sm text-gray-500 sm:inline">
				{currentSectionIndex + 1}/{totalCount}
			</span>
			<div class="w-32 sm:w-48">
				<ProgressBar value={approvedCount} max={totalCount || 1} showPercentage={true} size="sm" />
			</div>
		</div>
	</header>

	<!-- Main content -->
	<div class="flex min-h-0 flex-1 overflow-hidden">
		<!-- Stepper sidebar -->
		<aside class="hidden w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4 lg:block">
			<StepperSidebar
				{steps}
				currentStep={currentSectionIndex}
				onStepClick={handleStepClick}
			/>
		</aside>

		<!-- Editor area -->
		<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
			{#if activeArtifact}
				<!-- Section header -->
				<div class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
					<div class="flex items-center gap-3">
						<h2 class="text-base font-semibold text-gray-900">{activeArtifact.title}</h2>
						<StatusBadge status={activeArtifact.status} />
					</div>
					<div class="flex items-center gap-2">
						{#if saveMessage}
							<span class="text-sm text-success-600">{saveMessage}</span>
						{/if}
						{#if hasChanges}
							<span class="text-xs text-amber-600">Niet-opgeslagen wijzigingen</span>
						{/if}
					</div>
				</div>

				<!-- Editor -->
				<div class="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6">
					<div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg shadow-sm">
						<TiptapEditor
							content={editedContent}
							placeholder="Begin hier met het bewerken van de sectie-inhoud..."
							on:change={(e) => {
								const isInitialLoad = editedContent === (activeArtifact?.content ?? '');
								editedContent = e.detail;
								if (isInitialLoad) savedContent = editedContent;
							}}
						/>
					</div>
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
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
								</svg>
								Vorige
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
								Volgende
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</button>
						{:else}
							<a
								href="/projects/{project.id}/documents"
								class="inline-flex items-center gap-1 rounded-md bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700"
							>
								Afronden
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							</a>
						{/if}
					</div>
				</div>
			{:else}
				<div class="flex flex-1 items-center justify-center">
					<p class="text-gray-500">Geen secties gevonden voor dit documenttype.</p>
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

	<!-- Chat panel (slide-up overlay) -->
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
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
				aria-label="Sectie-chat"
			>
				{#if chatMessages.length === 0}
					<div class="flex h-full items-center justify-center">
						<div class="text-center">
							<p class="text-sm font-medium text-gray-900">AI-assistent</p>
							<p class="mt-1 text-xs text-gray-500">
								Stel vragen over deze sectie of vraag om verbeteringen.
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
						placeholder="Stel een vraag over deze sectie..."
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

<!-- Mobile stepper (bottom sheet trigger) -->
<div class="fixed bottom-0 left-0 right-0 z-[60] border-t border-gray-200 bg-white p-2 lg:hidden">
	<div class="flex items-center justify-between px-2">
		<span class="text-xs text-gray-500">
			Stap {currentSectionIndex + 1} van {totalCount}
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
					aria-label="Ga naar stap {i + 1}"
					type="button"
				></button>
			{/each}
		</div>
	</div>
</div>
