<script lang="ts">
	import { tick } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	$: artifact = data.artifact;
	$: project = data.project;
	$: versions = data.versions;

	const STATUS_LABELS: Record<string, string> = {
		draft: 'Concept',
		generated: 'Gegenereerd',
		review: 'In review',
		approved: 'Goedgekeurd',
		rejected: 'Afgewezen'
	};

	const STATUS_COLORS: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700',
		generated: 'bg-blue-100 text-blue-700',
		review: 'bg-purple-100 text-purple-700',
		approved: 'bg-green-100 text-green-700',
		rejected: 'bg-red-100 text-red-700'
	};

	// Editor state
	let editedContent = artifact.content ?? '';
	let saving = false;
	let saveMessage = '';
	let hasChanges = false;

	$: hasChanges = editedContent !== (artifact.content ?? '');

	// Chat state
	let conversationId = data.conversationId;
	let chatMessages = [...data.messages];
	let chatInput = '';
	let chatLoading = false;
	let chatContainer: HTMLElement;

	// Panel state
	let activePanel: 'chat' | 'versions' = 'chat';

	// Regeneration state
	let regenerating = false;
	let regenerateInstructions = '';
	let showRegenerateForm = false;

	// Version viewer state
	let viewingVersion: { version: number; content: string; title: string; created_at: string } | null = null;

	async function scrollChatToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	async function saveContent() {
		if (!hasChanges || saving) return;
		saving = true;
		saveMessage = '';

		const response = await fetch(`/api/projects/${project.id}/artifacts/${artifact.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: editedContent })
		});

		if (response.ok) {
			saveMessage = 'Opgeslagen';
			await invalidateAll();
			editedContent = data.artifact.content ?? '';
			setTimeout(() => { saveMessage = ''; }, 2000);
		} else {
			saveMessage = 'Fout bij opslaan';
		}

		saving = false;
	}

	async function updateStatus(status: string) {
		const response = await fetch(`/api/projects/${project.id}/artifacts/${artifact.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status })
		});

		if (response.ok) {
			await invalidateAll();
		}
	}

	async function sendChatMessage() {
		if (!chatInput.trim() || chatLoading) return;

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
				artifact_id: artifact.id,
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

		// If AI updated the artifact, refresh
		if (result.data.has_update && result.data.updated_artifact) {
			await invalidateAll();
			editedContent = data.artifact.content ?? '';
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

	async function handleRegenerate() {
		if (regenerating) return;
		regenerating = true;

		const response = await fetch(`/api/projects/${project.id}/regenerate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				artifact_id: artifact.id,
				instructions: regenerateInstructions || undefined
			})
		});

		if (response.ok) {
			showRegenerateForm = false;
			regenerateInstructions = '';
			await invalidateAll();
			editedContent = data.artifact.content ?? '';
		}

		regenerating = false;
	}

	function restoreVersion(version: { version: number; content: string }) {
		editedContent = version.content;
		viewingVersion = null;
		activePanel = 'chat';
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{artifact.title} — {project.name} — Tendermanager</title>
</svelte:head>

<div class="flex h-[calc(100vh-8rem)] flex-col">
	<!-- Header -->
	<div class="mb-4 flex items-center justify-between">
		<div>
			<a href="/projects/{project.id}" class="text-sm text-gray-500 hover:text-gray-700">
				&larr; Terug naar project
			</a>
			<h1 class="mt-1 text-xl font-bold text-gray-900">{artifact.title}</h1>
			<p class="text-sm text-gray-500">
				{(artifact as Record<string, unknown>).document_type
					? ((artifact as Record<string, unknown>).document_type as { name: string }).name
					: ''} &middot; Versie {artifact.version}
			</p>
		</div>
		<div class="flex items-center gap-3">
			{#if saveMessage}
				<span class="text-sm text-green-600">{saveMessage}</span>
			{/if}
			<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {STATUS_COLORS[artifact.status] ?? 'bg-gray-100 text-gray-700'}">
				{STATUS_LABELS[artifact.status] ?? artifact.status}
			</span>
			<button
				on:click={saveContent}
				disabled={!hasChanges || saving}
				class="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
			>
				{saving ? 'Opslaan...' : 'Opslaan'}
			</button>
		</div>
	</div>

	<!-- Main content area -->
	<div class="flex flex-1 gap-4 overflow-hidden">
		<!-- Editor panel -->
		<div class="flex flex-1 flex-col overflow-hidden">
			<!-- Editor toolbar -->
			<div class="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-4 py-2">
				<div class="flex gap-2">
					<button
						on:click={() => { showRegenerateForm = !showRegenerateForm; }}
						class="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-white"
					>
						Hergenereren
					</button>
					{#if artifact.status !== 'approved'}
						<button
							on:click={() => updateStatus('review')}
							class="rounded border border-purple-300 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50"
						>
							Naar review
						</button>
					{/if}
					{#if artifact.status === 'review'}
						<button
							on:click={() => updateStatus('approved')}
							class="rounded border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
						>
							Goedkeuren
						</button>
						<button
							on:click={() => updateStatus('rejected')}
							class="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
						>
							Afwijzen
						</button>
					{/if}
				</div>
				{#if hasChanges}
					<span class="text-xs text-amber-600">Niet-opgeslagen wijzigingen</span>
				{/if}
			</div>

			<!-- Regenerate form -->
			{#if showRegenerateForm}
				<div class="border-x border-gray-200 bg-amber-50 px-4 py-3">
					<p class="mb-2 text-sm font-medium text-amber-800">
						Hergenereer deze sectie met AI
					</p>
					<textarea
						bind:value={regenerateInstructions}
						rows="2"
						placeholder="Optioneel: specifieke instructies voor de hergeneratie..."
						class="mb-2 w-full resize-none rounded border border-amber-200 px-3 py-2 text-sm focus:border-amber-400 focus:ring-amber-400"
					></textarea>
					<div class="flex gap-2">
						<button
							on:click={handleRegenerate}
							disabled={regenerating}
							class="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
						>
							{regenerating ? 'Bezig met genereren...' : 'Hergenereren'}
						</button>
						<button
							on:click={() => { showRegenerateForm = false; }}
							class="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-white"
						>
							Annuleren
						</button>
					</div>
				</div>
			{/if}

			<!-- Text editor -->
			<textarea
				bind:value={editedContent}
				class="flex-1 resize-none rounded-b-lg border border-gray-200 p-4 font-mono text-sm leading-relaxed text-gray-900 focus:border-primary-500 focus:ring-primary-500"
				placeholder="Sectie-inhoud..."
				aria-label="Sectie-inhoud bewerken"
			></textarea>
		</div>

		<!-- Side panel -->
		<div class="flex w-96 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
			<!-- Panel tabs -->
			<div class="flex border-b border-gray-200">
				<button
					on:click={() => { activePanel = 'chat'; }}
					class="flex-1 px-4 py-2.5 text-sm font-medium {activePanel === 'chat'
						? 'border-b-2 border-primary-600 text-primary-600'
						: 'text-gray-500 hover:text-gray-700'}"
				>
					AI-assistent
				</button>
				<button
					on:click={() => { activePanel = 'versions'; }}
					class="flex-1 px-4 py-2.5 text-sm font-medium {activePanel === 'versions'
						? 'border-b-2 border-primary-600 text-primary-600'
						: 'text-gray-500 hover:text-gray-700'}"
				>
					Versies ({versions.length})
				</button>
			</div>

			<!-- Chat panel -->
			{#if activePanel === 'chat'}
				<div
					bind:this={chatContainer}
					class="flex-1 overflow-y-auto p-4"
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
				<div class="border-t border-gray-200 p-3">
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
						>
							Stuur
						</button>
					</div>
				</div>
			{/if}

			<!-- Versions panel -->
			{#if activePanel === 'versions'}
				<div class="flex-1 overflow-y-auto">
					{#if versions.length === 0}
						<div class="flex h-full items-center justify-center">
							<p class="text-sm text-gray-500">Nog geen eerdere versies</p>
						</div>
					{:else}
						<!-- Current version -->
						<div class="border-b border-gray-200 bg-primary-50 px-4 py-3">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-medium text-primary-900">
										Versie {artifact.version}
										<span class="ml-1 text-xs text-primary-600">(huidige)</span>
									</p>
								</div>
							</div>
						</div>

						{#each versions as version}
							<div class="border-b border-gray-200 px-4 py-3 hover:bg-gray-50">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-sm font-medium text-gray-900">Versie {version.version}</p>
										<p class="text-xs text-gray-500">{formatDate(version.created_at)}</p>
									</div>
									<div class="flex gap-1">
										<button
											on:click={() => { viewingVersion = version; }}
											class="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
										>
											Bekijk
										</button>
										<button
											on:click={() => restoreVersion(version)}
											class="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50"
										>
											Herstel
										</button>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Version viewer modal -->
	{#if viewingVersion}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
			<div class="mx-4 flex max-h-[80vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
					<h3 class="text-lg font-semibold text-gray-900">
						Versie {viewingVersion.version} — {viewingVersion.title}
					</h3>
					<button
						on:click={() => { viewingVersion = null; }}
						class="text-gray-400 hover:text-gray-600"
						aria-label="Sluiten"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div class="flex-1 overflow-y-auto p-6">
					<div class="whitespace-pre-wrap font-mono text-sm text-gray-800">{viewingVersion.content}</div>
				</div>
				<div class="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
					<button
						on:click={() => { viewingVersion = null; }}
						class="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Sluiten
					</button>
					<button
						on:click={() => { if (viewingVersion) restoreVersion(viewingVersion); }}
						class="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
					>
						Deze versie herstellen
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
