<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import AiRewritePanel from './AiRewritePanel.svelte';
	import EditorCommentsPanel from './EditorCommentsPanel.svelte';

	interface DocumentComment {
		id: string; artifact_id: string; selected_text: string; comment_text: string;
		resolved: boolean; created_by: string; created_at: string;
		author?: { first_name: string; last_name: string; email: string };
	}

	export let projectId: string;
	export let activeArtifact: { id: string; title: string; status: string; version: number; section_key: string } | null = null;
	export let artifacts: { id: string; title: string }[] = [];
	export let sectionElements: Record<string, HTMLElement> = {};
	export let currentSectionIndex = 0;
	export let totalCount = 0;
	export let sectionDescription = '';
	export let conversationId: string | null = null;
	export let pendingCommentSelection: { artifactId: string; text: string; from: number; to: number } | null = null;
	export let showCommentInput = false;
	export let showAiRewritePanel = false;

	const dispatch = createEventDispatcher<{
		aiRewriteComplete: {
			artifactId: string; content: string; conversationId: string;
			hasUpdate: boolean; updatedContent: string | null; from: number; to: number;
		};
		cancelAiRewrite: void;
		cancelComment: void;
	}>();

	type SidebarTab = 'fields' | 'comments';
	let sidebarTab: SidebarTab = 'comments';

	// Comments managed internally (user-triggered mutations)
	let comments: DocumentComment[] = [];
	export function getActiveCommentsCount(): number { return comments.filter((c) => !c.resolved).length; }
	$: activeCommentsCount = comments.filter((c) => !c.resolved).length;

	export async function loadComments() {
		const res = await fetch(`/api/projects/${projectId}/comments`);
		if (res.ok) { const r = await res.json(); comments = r.data ?? []; }
	}

	async function handleSubmitComment(e: CustomEvent<string>) {
		if (!pendingCommentSelection) return;
		const res = await fetch(`/api/projects/${projectId}/comments`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ artifact_id: pendingCommentSelection.artifactId, selected_text: pendingCommentSelection.text, comment_text: e.detail })
		});
		if (res.ok) { const r = await res.json(); comments = [...comments, r.data]; }
		showCommentInput = false;
		pendingCommentSelection = null;
	}

	async function handleResolve(e: CustomEvent<string>) {
		comments = comments.map((c) => c.id === e.detail ? { ...c, resolved: true } : c);
		const res = await fetch(`/api/projects/${projectId}/comments/${e.detail}`, {
			method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resolved: true })
		});
		if (!res.ok) comments = comments.map((c) => c.id === e.detail ? { ...c, resolved: false } : c);
	}

	async function handleDelete(e: CustomEvent<string>) {
		const prev = comments;
		comments = comments.filter((c) => c.id !== e.detail);
		const res = await fetch(`/api/projects/${projectId}/comments/${e.detail}`, { method: 'DELETE' });
		if (!res.ok) comments = prev;
	}

	function handleScrollToSection(e: CustomEvent<string>) {
		sectionElements[e.detail]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	function handleAiComplete(e: CustomEvent) {
		showAiRewritePanel = false;
		pendingCommentSelection = null;
		dispatch('aiRewriteComplete', e.detail);
	}

	export function showCommentsTab() { sidebarTab = 'comments'; }
	export function showFieldsTab() { sidebarTab = 'fields'; }
</script>

<aside class="hidden shrink-0 flex-col border-l border-gray-200 bg-white xl:flex" style="width: 20%;">
	<div class="flex shrink-0 border-b border-gray-200">
		<button on:click={() => sidebarTab = 'fields'} class="flex-1 px-3 py-3 text-xs font-medium transition-colors {sidebarTab === 'fields' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}" type="button">Sectievelden</button>
		<button on:click={() => sidebarTab = 'comments'} class="flex-1 px-3 py-3 text-xs font-medium transition-colors {sidebarTab === 'comments' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}" type="button">Opmerkingen</button>
	</div>

	{#if sidebarTab === 'fields'}
		<div class="flex flex-1 flex-col overflow-hidden">
			{#if showAiRewritePanel}
				<AiRewritePanel {projectId} pendingSelection={pendingCommentSelection} {conversationId} on:complete={handleAiComplete} on:cancel={() => { showAiRewritePanel = false; pendingCommentSelection = null; dispatch('cancelAiRewrite'); }} />
			{/if}
			<div class="flex-1 overflow-y-auto p-4">
				{#if activeArtifact}
					<h3 class="text-xs font-semibold text-gray-900">{activeArtifact.title}</h3>
					<dl class="mt-3 space-y-3">
						<div><dt class="text-xs font-medium text-gray-500">Status</dt><dd class="mt-1"><StatusBadge status={activeArtifact.status} /></dd></div>
						<div><dt class="text-xs font-medium text-gray-500">Versie</dt><dd class="mt-1 text-xs text-gray-900">{activeArtifact.version}</dd></div>
						<div><dt class="text-xs font-medium text-gray-500">Positie</dt><dd class="mt-1 text-xs text-gray-900">{currentSectionIndex + 1} van {totalCount}</dd></div>
						{#if sectionDescription}<div><dt class="text-xs font-medium text-gray-500">Beschrijving</dt><dd class="mt-1 text-xs text-gray-700">{sectionDescription}</dd></div>{/if}
					</dl>
				{/if}
			</div>
		</div>
	{/if}

	{#if sidebarTab === 'comments'}
		<EditorCommentsPanel {comments} {artifacts} {pendingCommentSelection} {showCommentInput}
			on:submitComment={handleSubmitComment}
			on:cancelComment={() => { showCommentInput = false; pendingCommentSelection = null; dispatch('cancelComment'); }}
			on:resolveComment={handleResolve}
			on:deleteComment={handleDelete}
			on:scrollToSection={handleScrollToSection}
		/>
	{/if}
</aside>
