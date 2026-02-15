<script lang="ts">
	import { tick, createEventDispatcher } from 'svelte';

	export let projectId: string;
	export let pendingSelection: {
		artifactId: string;
		text: string;
		from: number;
		to: number;
	} | null = null;
	export let conversationId: string | null = null;

	const dispatch = createEventDispatcher<{
		complete: {
			artifactId: string;
			content: string;
			conversationId: string;
			hasUpdate: boolean;
			updatedContent: string | null;
			from: number;
			to: number;
		};
		cancel: void;
	}>();

	let rewriting = false;
	let input = '';

	$: if (pendingSelection) {
		input = '';
		tick().then(() => {
			document.getElementById('ai-rewrite-input')?.focus();
		});
	}

	async function submit() {
		if (!pendingSelection || !input.trim() || rewriting) return;
		rewriting = true;

		const { artifactId, text, from, to } = pendingSelection;
		const prompt = `Herschrijf het volgende stuk tekst volgens deze instructie: "${input.trim()}"\n\nTekst om te herschrijven:\n"${text}"\n\nGeef ALLEEN de herschreven tekst terug, zonder uitleg.`;

		const response = await fetch(`/api/projects/${projectId}/section-chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				artifact_id: artifactId,
				conversation_id: conversationId ?? undefined,
				message: prompt
			})
		});

		const result = await response.json();
		rewriting = false;

		if (response.ok && result.data) {
			dispatch('complete', {
				artifactId,
				content: result.data.content ?? text,
				conversationId: result.data.conversation_id,
				hasUpdate: result.data.has_update ?? false,
				updatedContent: result.data.updated_artifact?.content ?? null,
				from,
				to
			});
		}
	}

	function cancel() {
		input = '';
		dispatch('cancel');
	}
</script>

{#if pendingSelection}
	<div class="shrink-0 border-b border-gray-200 p-3">
		<div class="mb-2 flex items-center gap-2">
			<img src="/avatar.png" alt="AI" class="h-6 w-6 rounded-full" />
			<span class="text-xs font-semibold text-gray-900">AI herschrijven</span>
		</div>
		<div class="mb-2 rounded bg-blue-50 px-2.5 py-1.5">
			<p class="text-[10px] font-medium uppercase tracking-wide text-blue-600">Geselecteerde tekst</p>
			<p class="mt-0.5 line-clamp-3 text-xs italic text-gray-700">"{pendingSelection.text}"</p>
		</div>
		<textarea
			id="ai-rewrite-input"
			bind:value={input}
			on:keydown={(e) => {
				if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
				if (e.key === 'Escape') cancel();
			}}
			rows="3"
			placeholder="Beschrijf hoe je de tekst wilt aanpassen..."
			class="w-full resize-none rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			aria-label="AI instructie invoeren"
			disabled={rewriting}
		></textarea>
		<div class="mt-2 flex items-center justify-between">
			<button on:click={cancel} class="text-xs text-gray-500 hover:text-gray-700" type="button" disabled={rewriting}>Annuleren</button>
			<button
				on:click={submit}
				disabled={!input.trim() || rewriting}
				class="flex items-center gap-1.5 rounded bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				type="button"
			>
				{#if rewriting}
					<svg class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
					</svg>
					Bezig...
				{:else}
					<img src="/avatar.png" alt="" class="h-3.5 w-3.5 rounded-full" />
					Herschrijven
				{/if}
			</button>
		</div>
	</div>
{/if}
