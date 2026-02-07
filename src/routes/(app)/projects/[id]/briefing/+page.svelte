<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let conversationId = data.conversationId;
	let messages = [...data.messages];
	let inputMessage = '';
	let loading = false;
	let briefingComplete = false;
	let artifactsGenerated = 0;
	let chatContainer: HTMLElement;

	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	async function startBriefing() {
		loading = true;

		const response = await fetch('/api/briefing/start', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project_id: data.project.id })
		});

		const result = await response.json();

		if (!response.ok) {
			loading = false;
			return;
		}

		conversationId = result.data.conversation_id;
		messages = [
			...messages,
			{
				id: 'ai-start',
				role: 'assistant',
				content: result.data.content,
				created_at: new Date().toISOString()
			}
		];

		loading = false;
		await scrollToBottom();
	}

	async function sendMessage() {
		if (!inputMessage.trim() || !conversationId || loading) return;

		const userMessage = inputMessage.trim();
		inputMessage = '';
		loading = true;

		// Add user message to UI immediately
		messages = [
			...messages,
			{
				id: `user-${Date.now()}`,
				role: 'user',
				content: userMessage,
				created_at: new Date().toISOString()
			}
		];
		await scrollToBottom();

		const response = await fetch('/api/briefing/message', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				project_id: data.project.id,
				conversation_id: conversationId,
				message: userMessage
			})
		});

		const result = await response.json();

		if (!response.ok) {
			messages = [
				...messages,
				{
					id: `error-${Date.now()}`,
					role: 'assistant',
					content: `Fout: ${result.message ?? 'Er is een fout opgetreden'}`,
					created_at: new Date().toISOString()
				}
			];
			loading = false;
			await scrollToBottom();
			return;
		}

		// Add AI response
		messages = [
			...messages,
			{
				id: result.data.message_id,
				role: 'assistant',
				content: result.data.content,
				created_at: new Date().toISOString()
			}
		];

		if (result.data.briefing_complete) {
			briefingComplete = true;
			artifactsGenerated = result.data.artifacts_generated;
		}

		loading = false;
		await scrollToBottom();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
</script>

<svelte:head>
	<title>Briefing — {data.project.name} — Tendermanager</title>
</svelte:head>

<div class="flex h-[calc(100vh-8rem)] flex-col">
	<!-- Header -->
	<div class="mb-4 flex items-center justify-between">
		<div>
			<a href="/projects/{data.project.id}" class="text-sm text-gray-500 hover:text-gray-700">
				&larr; Terug naar project
			</a>
			<h1 class="mt-1 text-xl font-bold text-gray-900">Briefing: {data.project.name}</h1>
		</div>
		{#if briefingComplete}
			<span class="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
				Briefing voltooid — {artifactsGenerated} secties gegenereerd
			</span>
		{/if}
	</div>

	<!-- Chat area -->
	<div
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4"
		role="log"
		aria-label="Briefing gesprek"
	>
		{#if messages.length === 0 && !conversationId}
			<!-- Start state -->
			<div class="flex h-full items-center justify-center">
				<div class="text-center">
					<h2 class="text-lg font-semibold text-gray-900">Klaar om te beginnen</h2>
					<p class="mt-2 text-sm text-gray-500">
						De AI-assistent zal u stap voor stap door de briefing leiden.
					</p>
					<button
						on:click={startBriefing}
						disabled={loading}
						class="mt-4 rounded-md bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
					>
						{loading ? 'Bezig...' : 'Briefing starten'}
					</button>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				{#each messages as msg (msg.id)}
					<div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[80%] rounded-lg px-4 py-3 {msg.role === 'user'
								? 'bg-primary-600 text-white'
								: 'bg-gray-100 text-gray-900'}"
						>
							<div class="whitespace-pre-wrap text-sm">{msg.content}</div>
						</div>
					</div>
				{/each}

				{#if loading}
					<div class="flex justify-start">
						<div class="rounded-lg bg-gray-100 px-4 py-3">
							<div class="flex space-x-1">
								<div class="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
								<div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 0.1s"></div>
								<div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 0.2s"></div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Input area -->
	{#if conversationId && !briefingComplete}
		<div class="mt-4 flex gap-2">
			<textarea
				bind:value={inputMessage}
				on:keydown={handleKeydown}
				disabled={loading}
				rows="2"
				placeholder="Typ uw antwoord..."
				class="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
				aria-label="Bericht invoeren"
			></textarea>
			<button
				on:click={sendMessage}
				disabled={loading || !inputMessage.trim()}
				class="self-end rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				aria-label="Bericht versturen"
			>
				Verstuur
			</button>
		</div>
	{:else if briefingComplete}
		<div class="mt-4 rounded-lg bg-green-50 p-4 text-center">
			<p class="text-sm text-green-800">
				De briefing is voltooid. Er zijn {artifactsGenerated} documentsecties gegenereerd.
			</p>
			<a
				href="/projects/{data.project.id}"
				class="mt-2 inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
			>
				Bekijk gegenereerde documenten
			</a>
		</div>
	{/if}
</div>
