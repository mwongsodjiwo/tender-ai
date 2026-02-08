<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	$: reviewer = data.reviewer;
	$: artifact = data.artifact;
	$: project = data.project;

	let feedback = reviewer.feedback ?? '';
	let submitting = false;
	let submitted = reviewer.review_status !== 'pending';
	let errorMessage = '';

	// Chat state
	let chatMessages: { role: string; content: string }[] = [];
	let chatInput = '';
	let chatLoading = false;
	let conversationId = '';
	let showChat = false;

	async function submitReview(status: 'approved' | 'rejected') {
		submitting = true;
		errorMessage = '';

		const response = await fetch(`/api/review/${reviewer.token}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ review_status: status, feedback: feedback || undefined })
		});

		if (response.ok) {
			submitted = true;
			reviewer = { ...reviewer, review_status: status, feedback };
		} else {
			const data = await response.json();
			errorMessage = data.message ?? 'Er is een fout opgetreden';
		}

		submitting = false;
	}

	async function sendMessage() {
		if (!chatInput.trim() || chatLoading) return;

		const message = chatInput.trim();
		chatInput = '';
		chatMessages = [...chatMessages, { role: 'user', content: message }];
		chatLoading = true;

		const response = await fetch(`/api/review/${reviewer.token}/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				token: reviewer.token,
				conversation_id: conversationId || undefined,
				message
			})
		});

		if (response.ok) {
			const result = await response.json();
			chatMessages = [...chatMessages, { role: 'assistant', content: result.data.content }];
			conversationId = result.data.conversation_id;

			if (result.data.has_update && result.data.updated_artifact) {
				artifact = { ...artifact, content: result.data.updated_artifact.content };
			}
		} else {
			chatMessages = [
				...chatMessages,
				{ role: 'assistant', content: 'Er is een fout opgetreden. Probeer het opnieuw.' }
			];
		}

		chatLoading = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
</script>

<svelte:head>
	<title>Review: {artifact.title} — Tendermanager</title>
</svelte:head>

<div class="min-h-screen bg-[#F5F5F5]">
	<!-- Header -->
	<header class="border-b border-gray-200 bg-white">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-500">Review voor project</p>
					<h1 class="text-lg font-semibold text-gray-900">{project.name}</h1>
				</div>
				<div class="text-right">
					<p class="text-sm font-medium text-gray-900">{reviewer.name}</p>
					<p class="text-xs text-gray-500">{reviewer.email}</p>
				</div>
			</div>
		</div>
	</header>

	<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Main content: section to review -->
			<div class="lg:col-span-2">
			<div class="rounded-lg border border-gray-200 bg-white transition hover:shadow-sm">
				<div class="border-b border-gray-200 px-6 py-4">
					<h2 class="text-lg font-semibold text-gray-900">{artifact.title}</h2>
						<p class="mt-1 text-sm text-gray-500">Versie {artifact.version}</p>
					</div>
					<div class="prose max-w-none px-6 py-6">
						{@html artifact.content.replace(/\n/g, '<br>')}
					</div>
				</div>

				<!-- Review form -->
				{#if submitted}
				<div class="mt-4 rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-sm">
					<div class="text-center">
							{#if reviewer.review_status === 'approved'}
								<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
									<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
									</svg>
								</div>
								<h3 class="text-lg font-semibold text-gray-900">Review ingediend: Goedgekeurd</h3>
							{:else}
								<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
									<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</div>
								<h3 class="text-lg font-semibold text-gray-900">Review ingediend: Afgewezen</h3>
							{/if}
							{#if reviewer.feedback}
								<p class="mt-2 text-sm text-gray-600">Feedback: {reviewer.feedback}</p>
							{/if}
							<p class="mt-2 text-sm text-gray-500">Bedankt voor uw beoordeling.</p>
						</div>
					</div>
				{:else}
				<div class="mt-4 rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-sm">
					<h3 class="text-base font-semibold text-gray-900">Uw beoordeling</h3>
						<p class="mt-1 text-sm text-gray-500">
							Geef uw feedback op de bovenstaande sectie.
						</p>

						<div class="mt-4">
							<label for="review-feedback" class="block text-sm font-medium text-gray-700">
								Feedback (optioneel)
							</label>
							<textarea
								id="review-feedback"
								bind:value={feedback}
								rows="4"
								placeholder="Uw opmerkingen over deze sectie..."
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
							></textarea>
						</div>

						{#if errorMessage}
							<p class="mt-2 text-sm text-red-600" role="alert">{errorMessage}</p>
						{/if}

						<div class="mt-4 flex gap-3">
							<button
								on:click={() => submitReview('approved')}
								disabled={submitting}
								class="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
							>
								{submitting ? 'Bezig...' : 'Goedkeuren'}
							</button>
							<button
								on:click={() => submitReview('rejected')}
								disabled={submitting}
								class="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
							>
								{submitting ? 'Bezig...' : 'Afwijzen'}
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Sidebar: AI chat -->
			<div class="lg:col-span-1">
				<div class="sticky top-6 rounded-lg border border-gray-200 bg-white transition hover:shadow-sm">
					<button
						on:click={() => (showChat = !showChat)}
						class="flex w-full items-center justify-between border-b border-gray-200 px-4 py-3 text-left"
					>
						<h3 class="text-sm font-semibold text-gray-900">AI-assistent</h3>
						<span class="text-xs text-gray-500">{showChat ? 'Verbergen' : 'Tonen'}</span>
					</button>

					{#if showChat}
						<div class="flex h-96 flex-col">
							<!-- Chat messages -->
							<div class="flex-1 overflow-y-auto px-4 py-3">
								{#if chatMessages.length === 0}
									<p class="text-center text-sm text-gray-400">
										Stel een vraag over deze sectie aan de AI-assistent.
									</p>
								{/if}
								{#each chatMessages as msg}
									<div class="mb-3 {msg.role === 'user' ? 'text-right' : 'text-left'}">
										<div
											class="inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm {msg.role === 'user'
												? 'bg-primary-100 text-primary-900'
												: 'bg-gray-100 text-gray-900'}"
										>
											{msg.content}
										</div>
									</div>
								{/each}
								{#if chatLoading}
									<div class="mb-3 text-left">
										<div class="inline-block rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
											Bezig met nadenken...
										</div>
									</div>
								{/if}
							</div>

							<!-- Chat input -->
							<div class="border-t border-gray-200 px-4 py-3">
								<div class="flex gap-2">
									<textarea
										bind:value={chatInput}
										on:keydown={handleKeydown}
										rows="2"
										placeholder="Stel een vraag..."
										class="block w-full resize-none rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
										disabled={chatLoading}
									></textarea>
									<button
										on:click={sendMessage}
										disabled={!chatInput.trim() || chatLoading}
										class="self-end rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
										aria-label="Verstuur bericht"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
										</svg>
									</button>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
