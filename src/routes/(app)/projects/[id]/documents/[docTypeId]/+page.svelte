<script lang="ts">
	import { tick } from 'svelte';
	import type { Editor } from '@tiptap/core';
	import TiptapEditor from '$components/TiptapEditor.svelte';
	import DocumentChapterNav from '$lib/components/editor/DocumentChapterNav.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_STYLES } from '$lib/types/enums/document.js';
	import type { DocumentStatus } from '$lib/types/enums/document.js';
	import EditorToolbar from '$lib/components/editor/EditorToolbar.svelte';
	import EditorSearchBar from '$lib/components/editor/EditorSearchBar.svelte';
	import EditorRightSidebar from '$lib/components/editor/EditorRightSidebar.svelte';
	import SelectionPopup from '$lib/components/editor/SelectionPopup.svelte';
	import MobileStepper from '$lib/components/editor/MobileStepper.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	let currentSectionIndex = data.activeIndex;
	$: artifacts = data.artifacts;
	$: documentType = data.documentType;
	$: project = data.project;
	$: activeArtifact = artifacts[currentSectionIndex] ?? null;

	let sectionContents: Record<string, string> = {};
	let sectionSavedContents: Record<string, string> = {};
	$: { for (const a of artifacts) { if (!(a.id in sectionContents)) { sectionContents[a.id] = a.content ?? ''; sectionSavedContents[a.id] = a.content ?? ''; } } }
	$: hasChanges = artifacts.some((a) => (sectionContents[a.id] ?? '') !== (sectionSavedContents[a.id] ?? ''));
	let saving = false;
	$: totalCount = artifacts.length;
	let saveMessage = '';
	let editorComponents: Record<string, TiptapEditor> = {};
	let focusedEditor: Editor | null = null;
	let sectionElements: Record<string, HTMLElement> = {};
	let showRightSidebar = false;
	let showSearch = false;
	let zoomLevel = 100;
	let fontSize = '11';
	let rightSidebar: EditorRightSidebar;
	let activeCommentsCount = 0;
	let pendingCommentSelection: { artifactId: string; text: string; from: number; to: number } | null = null;
	let commentPopup = { x: 0, y: 0, visible: false };
	let showCommentInput = false;
	let showAiRewritePanel = false;
	let conversationId = data.conversationId;
	$: if (rightSidebar && project?.id) rightSidebar.loadComments();
	$: if (rightSidebar) activeCommentsCount = rightSidebar.getActiveCommentsCount();

	function getSectionDescription(key: string): string {
		if (!documentType.template_structure) return '';
		return documentType.template_structure.find((s: { key: string; description?: string }) => s.key === key)?.description ?? '';
	}
	$: documentStatus = ((): DocumentStatus => {
		if (artifacts.length === 0) return 'open';
		if (artifacts.every((a) => a.status === 'approved')) return 'afgerond';
		return artifacts.some((a) => a.status !== 'draft') ? 'gestart' : 'open';
	})();
	let documentScrollContainer: HTMLElement;
	function scrollToSection(i: number) { currentSectionIndex = i; const a = artifacts[i]; if (a && sectionElements[a.id]) sectionElements[a.id].scrollIntoView({ behavior: 'smooth', block: 'start' }); }
	function handleScroll() {
		if (!documentScrollContainer) return;
		const threshold = documentScrollContainer.getBoundingClientRect().top + 150;
		for (let i = artifacts.length - 1; i >= 0; i--) {
			const el = sectionElements[artifacts[i].id];
			if (el && el.getBoundingClientRect().top <= threshold) { if (currentSectionIndex !== i) currentSectionIndex = i; break; }
		}
	}

	function handleEditorFocus(artifactId: string) {
		const comp = editorComponents[artifactId];
		if (comp) focusedEditor = comp.getEditor();
		const idx = artifacts.findIndex((a) => a.id === artifactId);
		if (idx >= 0) currentSectionIndex = idx;
	}

	function handleTextSelection(artifactId: string) {
		const ed = editorComponents[artifactId]?.getEditor();
		if (!ed) return;
		const { from, to } = ed.state.selection;
		if (from === to) { commentPopup = { ...commentPopup, visible: false }; return; }
		const text = ed.state.doc.textBetween(from, to, ' ');
		if (!text.trim()) { commentPopup = { ...commentPopup, visible: false }; return; }
		const coords = ed.view.coordsAtPos(to);
		const rect = ed.view.dom.getBoundingClientRect();
		pendingCommentSelection = { artifactId, text, from, to };
		commentPopup = { x: coords.left - rect.left + rect.width / 2, y: coords.top - rect.top - 8, visible: true };
	}

	function startAddComment() {
		if (!pendingCommentSelection) return;
		showCommentInput = true; showRightSidebar = true;
		commentPopup = { ...commentPopup, visible: false };
		rightSidebar?.showCommentsTab();
		tick().then(() => document.getElementById('new-comment-input')?.focus());
	}

	function startAiRewrite() {
		if (!pendingCommentSelection) return;
		showAiRewritePanel = true; showRightSidebar = true;
		commentPopup = { ...commentPopup, visible: false };
		rightSidebar?.showFieldsTab();
	}

	function handleAiRewriteComplete(e: CustomEvent) {
		const { artifactId, content, conversationId: cid, hasUpdate, updatedContent, from, to } = e.detail;
		conversationId = cid;
		if (hasUpdate && updatedContent) {
			sectionContents[artifactId] = updatedContent;
			sectionSavedContents[artifactId] = updatedContent;
			sectionContents = sectionContents;
		} else {
			const ed = editorComponents[artifactId]?.getEditor();
			if (ed) { ed.chain().focus().setTextSelection({ from, to }).insertContent(content).run(); sectionContents[artifactId] = ed.getHTML(); sectionContents = sectionContents; }
		}
	}

	function toggleCommentsSidebar() {
		if (showRightSidebar) { showRightSidebar = false; } else { showRightSidebar = true; rightSidebar?.showCommentsTab(); }
	}

	async function saveAllContent() {
		if (!hasChanges || saving) return;
		saving = true; saveMessage = '';
		let allOk = true;
		for (const a of artifacts.filter((a) => (sectionContents[a.id] ?? '') !== (sectionSavedContents[a.id] ?? ''))) {
			const res = await fetch(`/api/projects/${project.id}/artifacts/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: sectionContents[a.id] }) });
			if (res.ok) sectionSavedContents[a.id] = sectionContents[a.id]; else allOk = false;
		}
		saveMessage = allOk ? 'Opgeslagen' : 'Fout bij opslaan';
		saving = false;
		setTimeout(() => { saveMessage = ''; }, 2000);
	}

	function handleSearchContentChanged(e: CustomEvent<{ artifactId: string; content: string }>) {
		sectionContents[e.detail.artifactId] = e.detail.content;
		sectionContents = sectionContents;
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); showSearch = !showSearch; }
		if ((e.ctrlKey || e.metaKey) && e.key === 'h') { e.preventDefault(); showSearch = true; }
	}
</script>

<svelte:window on:keydown={handleGlobalKeydown} />
<svelte:head><title>{documentType.name} — {project.name} — Tendermanager</title></svelte:head>

<div class="fixed inset-0 z-[60] flex flex-col bg-[#F5F5F5]">
	<header class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6">
		<div class="flex items-center gap-4"><BackButton /></div>
		<div class="flex items-center gap-2">
			<h1 class="text-sm font-semibold text-gray-900">{documentType.name}</h1>
			<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {DOCUMENT_STATUS_STYLES[documentStatus]}">{DOCUMENT_STATUS_LABELS[documentStatus]}</span>
		</div>
		<div class="flex items-center gap-3">
			{#if hasChanges}<span class="flex items-center gap-1.5 text-xs text-amber-600"><span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>Niet-opgeslagen wijzigingen</span>{/if}
			{#if saveMessage}<span class="text-xs text-success-600">{saveMessage}</span>{/if}
			<button on:click={saveAllContent} disabled={!hasChanges || saving} class="rounded-md bg-primary-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50" type="button">{saving ? 'Opslaan...' : 'Opslaan'}</button>
		</div>
	</header>

	<EditorToolbar bind:focusedEditor bind:showSearch bind:zoomLevel bind:fontSize {activeCommentsCount} isCommentsSidebarActive={showRightSidebar} on:toggleSearch={() => showSearch = !showSearch} on:toggleComments={toggleCommentsSidebar} />
	{#if showSearch}<EditorSearchBar {editorComponents} {artifacts} {sectionElements} hasReplace={true} on:close={() => showSearch = false} on:contentChanged={handleSearchContentChanged} />{/if}

	<div class="flex min-h-0 flex-1 overflow-hidden">
		<aside class="hidden shrink-0 overflow-y-auto border-r border-gray-200 bg-white py-3 lg:block" style="width: 20%;">
			<DocumentChapterNav chapters={artifacts.map((a) => ({ id: a.id, title: a.title }))} currentIndex={currentSectionIndex} onChapterClick={(i) => scrollToSection(i)} />
		</aside>

		<div class="flex min-w-0 flex-col overflow-y-auto" role="region" aria-label="Documentinhoud" style="width: {showRightSidebar ? '60%' : '80%'};" bind:this={documentScrollContainer} on:scroll={handleScroll}>
			<div class="document-scroll-inner mx-auto py-8" style="transform: scale({(zoomLevel / 100) * 1.25}); transform-origin: top center; --editor-font-size: {fontSize}pt;">
				{#each artifacts as artifact, index (artifact.id)}
					<div bind:this={sectionElements[artifact.id]} class="relative scroll-mt-4" id="section-{artifact.id}" on:focusin={() => handleEditorFocus(artifact.id)} on:mouseup={() => handleTextSelection(artifact.id)} role="none">
						<div class="mb-3 flex items-center gap-2"><span class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">{index + 1}</span><h2 class="text-base font-semibold text-gray-900">{artifact.title}</h2></div>
						<div class="document-paper mb-10 rounded bg-white"><TiptapEditor bind:this={editorComponents[artifact.id]} content={sectionContents[artifact.id] ?? artifact.content ?? ''} placeholder="Begin hier met het bewerken van de sectie-inhoud..." showToolbar={false} on:change={(e) => { sectionContents[artifact.id] = e.detail; sectionContents = sectionContents; }} /></div>
						<SelectionPopup visible={commentPopup.visible && pendingCommentSelection?.artifactId === artifact.id} y={commentPopup.y} on:aiRewrite={startAiRewrite} on:addComment={startAddComment} />
					</div>
				{/each}
				{#if artifacts.length > 0}
					<div class="flex items-center justify-center py-8"><a href="/projects/{project.id}/documents" class="inline-flex items-center gap-2 rounded-md bg-success-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-success-700"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>Document afronden</a></div>
				{:else}<div class="flex items-center justify-center py-16"><p class="text-gray-500">Geen secties gevonden voor dit documenttype.</p></div>{/if}
			</div>
		</div>

		{#if showRightSidebar}
			<EditorRightSidebar bind:this={rightSidebar} projectId={project.id} {activeArtifact} {artifacts} {sectionElements} {currentSectionIndex} {totalCount} sectionDescription={getSectionDescription(activeArtifact?.section_key ?? '')} {conversationId} {pendingCommentSelection} {showCommentInput} {showAiRewritePanel} on:aiRewriteComplete={handleAiRewriteComplete} on:cancelAiRewrite={() => { showAiRewritePanel = false; pendingCommentSelection = null; }} on:cancelComment={() => { showCommentInput = false; pendingCommentSelection = null; }} />
		{/if}
	</div>
</div>

<MobileStepper {artifacts} {currentSectionIndex} sectionLabel="Sectie" on:navigate={(e) => scrollToSection(e.detail)} />

<style>
	.document-scroll-inner { width: 794px; }
	.document-paper { width: 100%; min-height: 1123px; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05); }
	.document-paper :global(.tiptap-editor-wrapper) { border: none; border-radius: 0.5rem; min-height: 1123px; }
	.document-paper :global(.tiptap-editor-wrapper .tiptap) { padding: 60px 72px; min-height: 1123px; font-family: 'Asap', sans-serif; font-size: var(--editor-font-size, 11pt); line-height: 1.6; color: #1a1a1a; }
	.document-paper :global(mark.search-highlight) { background-color: #fef08a; color: inherit; padding: 0; border-radius: 2px; }
	.document-paper :global(mark.search-highlight.search-current) { background-color: #f97316; color: white; }
</style>
