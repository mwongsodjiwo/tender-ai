<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface DocumentComment {
		id: string;
		artifact_id: string;
		selected_text: string;
		comment_text: string;
		resolved: boolean;
		created_by: string;
		created_at: string;
		author?: { first_name: string; last_name: string; email: string };
	}

	export let comments: DocumentComment[] = [];
	export let artifacts: { id: string; title: string }[] = [];
	export let pendingCommentSelection: { artifactId: string; text: string } | null = null;
	export let showCommentInput = false;

	const dispatch = createEventDispatcher<{
		submitComment: string;
		cancelComment: void;
		resolveComment: string;
		deleteComment: string;
		scrollToSection: string;
	}>();

	let newCommentText = '';
	let activeCommentId: string | null = null;

	$: activeComments = comments.filter((c) => !c.resolved);
	$: resolvedComments = comments.filter((c) => c.resolved);

	function formatTime(iso: string): string {
		const d = new Date(iso);
		const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
		if (diffMin < 1) return 'Zojuist';
		if (diffMin < 60) return `${diffMin} min geleden`;
		const diffHours = Math.floor(diffMin / 60);
		if (diffHours < 24) return `${diffHours} uur geleden`;
		return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
	}

	function getTitle(artifactId: string): string {
		return artifacts.find((a) => a.id === artifactId)?.title ?? 'Onbekende sectie';
	}

	function handleSubmit() {
		if (!newCommentText.trim()) return;
		dispatch('submitComment', newCommentText.trim());
		newCommentText = '';
	}
</script>

<div class="flex flex-1 flex-col overflow-hidden">
	{#if showCommentInput && pendingCommentSelection}
		<div class="shrink-0 border-b border-gray-200 p-3">
			<div class="mb-2 rounded bg-amber-50 px-2.5 py-1.5">
				<p class="text-[10px] font-medium uppercase tracking-wide text-amber-600">Geselecteerde tekst</p>
				<p class="mt-0.5 line-clamp-3 text-xs italic text-gray-700">"{pendingCommentSelection.text}"</p>
			</div>
			<textarea
				id="new-comment-input"
				bind:value={newCommentText}
				on:keydown={(e) => {
					if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmit(); }
					if (e.key === 'Escape') dispatch('cancelComment');
				}}
				rows="3"
				placeholder="Schrijf je opmerking..."
				class="w-full resize-none rounded border border-gray-300 px-2.5 py-1.5 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
				aria-label="Opmerking invoeren"
			></textarea>
			<div class="mt-2 flex items-center justify-between">
				<button on:click={() => dispatch('cancelComment')} class="text-xs text-gray-500 hover:text-gray-700" type="button">Annuleren</button>
				<button on:click={handleSubmit} disabled={!newCommentText.trim()} class="rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50" type="button">Toevoegen</button>
			</div>
		</div>
	{/if}

	<div class="flex-1 overflow-y-auto">
		{#if activeComments.length === 0 && resolvedComments.length === 0}
			<div class="flex flex-col items-center justify-center px-4 py-12">
				<svg class="mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
				<p class="text-center text-xs text-gray-500">Nog geen opmerkingen.<br/>Selecteer tekst in het document om een opmerking toe te voegen.</p>
			</div>
		{:else}
			{#if activeComments.length > 0}
				<div class="px-3 pt-3">
					<p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Open ({activeComments.length})</p>
				</div>
				<div class="space-y-0.5">
					{#each activeComments as comment (comment.id)}
						<div
							role="button"
							tabindex="0"
							class="w-full cursor-pointer border-l-2 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 {activeCommentId === comment.id ? 'border-l-amber-500 bg-amber-50/50' : 'border-l-transparent'}"
							on:click={() => { activeCommentId = comment.id; dispatch('scrollToSection', comment.artifact_id); }}
							on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activeCommentId = comment.id; dispatch('scrollToSection', comment.artifact_id); } }}
						>
							<div class="mb-1 flex items-start justify-between gap-1">
								<span class="text-[10px] font-medium text-amber-600">{getTitle(comment.artifact_id)}</span>
								<span class="shrink-0 text-[10px] text-gray-500">{formatTime(comment.created_at)}</span>
							</div>
							<p class="mb-1 line-clamp-2 text-[11px] italic text-gray-500">"{comment.selected_text}"</p>
							<p class="text-xs text-gray-800">{comment.comment_text}</p>
							<div class="mt-1.5 flex items-center gap-2">
								<button on:click|stopPropagation={() => dispatch('resolveComment', comment.id)} class="flex items-center gap-0.5 text-[10px] text-success-600 hover:text-success-700" type="button">
									<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
									Oplossen
								</button>
								<button on:click|stopPropagation={() => dispatch('deleteComment', comment.id)} class="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-error-600" type="button">
									<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
									Verwijderen
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			{#if resolvedComments.length > 0}
				<div class="px-3 pt-4">
					<p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Opgelost ({resolvedComments.length})</p>
				</div>
				<div class="space-y-0.5 opacity-60">
					{#each resolvedComments as comment (comment.id)}
						<div class="border-l-2 border-l-transparent px-3 py-2">
							<div class="mb-1 flex items-start justify-between gap-1">
								<span class="text-[10px] font-medium text-gray-500">{getTitle(comment.artifact_id)}</span>
								<span class="shrink-0 text-[10px] text-gray-500">{formatTime(comment.created_at)}</span>
							</div>
							<p class="line-clamp-1 text-[11px] italic text-gray-500">"{comment.selected_text}"</p>
							<p class="text-xs text-gray-500 line-through">{comment.comment_text}</p>
							<div class="mt-1">
								<button on:click={() => dispatch('deleteComment', comment.id)} class="text-[10px] text-gray-500 hover:text-error-600" type="button">Verwijderen</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
