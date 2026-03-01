<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import type { TableOfContentData } from '@tiptap/extension-table-of-contents';
	import { createEditorExtensions } from '$components/editor/editor-config';
	import { PlaceholderInsertExtension } from '$components/editor/PlaceholderInsertExtension';
	import { mapToTocItems } from '$components/editor/toc-utils';
	import type { TocItem } from '$components/editor/toc-utils';
	import { activatePreview, deactivatePreview } from '$components/editor/preview-utils';
	import { exportTemplateToDocx } from '$components/editor/export-template-docx';
	import WordToolbar from '$components/editor/WordToolbar.svelte';
	import A4PageLayout from '$components/editor/A4PageLayout.svelte';
	import TocSidebar from '$components/editor/TocSidebar.svelte';
	import TemplateSettingsPanel from '$components/editor/TemplateSettingsPanel.svelte';
	import TemplateEditorHeader from '$components/editor/TemplateEditorHeader.svelte';
	import PageSkeleton from '$components/PageSkeleton.svelte';
	import { toasts } from '$stores/toast';
	import type { PageData } from './$types';

	export let data: PageData;

	let editor: Editor | null = null;
	let editorElement: HTMLElement;
	let scrollContainer: HTMLElement;
	let saving = false;
	let savedHtml = data.template.content_html ?? '<p></p>';
	let currentHtml = savedHtml;
	let showToc = true; let isPreview = false; let originalHtml = '';
	let tocItems: TocItem[] = [];
	let zoomLevel = 100; let showSearch = false; let showSettings = false;
	let templateName = data.template.name;
	let templateDescription = data.template.description ?? '';
	let templateCategory = data.template.category_type ?? null;
	let savedMeta = { name: templateName, description: templateDescription, category: templateCategory };

	$: metaChanged = templateName !== savedMeta.name || templateDescription !== savedMeta.description
		|| templateCategory !== savedMeta.category;
	$: hasUnsavedChanges = !isPreview && (currentHtml !== savedHtml || metaChanged);

	function handleTocUpdate(tocData: TableOfContentData): void {
		tocItems = mapToTocItems(tocData);
	}

	function initEditor(): void {
		const extensions = [
			...createEditorExtensions({
				enablePlaceholderHighlights: true,
				enableToc: true,
				enablePagination: true,
				tocOnUpdate: handleTocUpdate
			}),
			PlaceholderInsertExtension
		];

		editor = new Editor({
			element: editorElement,
			extensions,
			content: savedHtml,
			onUpdate: ({ editor: e }) => {
				currentHtml = e.getHTML();
			}
		});
	}

	async function handleSave(): Promise<void> {
		if (!editor || saving || isPreview) return;
		saving = true;
		try {
			const body: Record<string, unknown> = { content_html: editor.getHTML() };
			if (metaChanged) {
				body.name = templateName;
				body.description = templateDescription || null;
				body.category_type = templateCategory;
			}
			const res = await fetch(`/api/templates/${data.template.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const json = await res.json();
				toasts.add(json.message ?? 'Opslaan mislukt', 'error');
				return;
			}
			savedHtml = editor.getHTML();
			currentHtml = savedHtml;
			savedMeta = { name: templateName, description: templateDescription, category: templateCategory };
			toasts.add('Sjabloon opgeslagen', 'success');
		} catch {
			toasts.add('Netwerkfout. Probeer het opnieuw.', 'error');
		} finally {
			saving = false;
		}
	}

	function handleTogglePreview(): void {
		if (!editor) return;
		if (!isPreview) { originalHtml = activatePreview(editor); isPreview = true; }
		else { deactivatePreview(editor, originalHtml); isPreview = false; originalHtml = ''; }
	}

	async function handleExportDocx(): Promise<void> {
		if (!editor) return;
		const safeName = templateName.replace(/[^a-zA-Z0-9\-_ ]/g, '');
		try {
			await exportTemplateToDocx({ html: editor.getHTML(), fileName: `${safeName}.docx` });
			toasts.add('Document gedownload', 'success');
		} catch { toasts.add('Export mislukt. Probeer het opnieuw.', 'error'); }
	}

	function handleKeyboardSave(event: KeyboardEvent): void {
		if ((event.metaKey || event.ctrlKey) && event.key === 's') { event.preventDefault(); handleSave(); }
	}

	onMount(() => initEditor());
	onDestroy(() => editor?.destroy());
</script>

<svelte:head>
	<title>{templateName} — Sjabloon bewerken — Tendermanager</title>
</svelte:head>
<svelte:window on:keydown={handleKeyboardSave} />
<div class="fixed inset-0 z-[60] flex flex-col bg-[#F5F5F5]">
	<TemplateEditorHeader {templateName} {hasUnsavedChanges} {saving} on:save={handleSave} />

	{#if editor}
		<WordToolbar
			{editor}
			branding={data.branding}
			placeholders={data.placeholders}
			{showToc}
			{isPreview}
			{zoomLevel}
			{showSearch}
			{showSettings}
			on:toggleToc={() => { showToc = !showToc; }}
			on:togglePreview={handleTogglePreview}
			on:exportDocx={handleExportDocx}
			on:toggleSearch={() => { showSearch = !showSearch; }}
			on:toggleSettings={() => { showSettings = !showSettings; }}
		/>
	{/if}

	<div class="flex min-h-0 flex-1 overflow-hidden">
		<TocSidebar items={tocItems} visible={showToc} {scrollContainer} />

		<div class="a4-scroll-area flex min-w-0 flex-1 flex-col overflow-y-auto" bind:this={scrollContainer}>
			<div class="a4-scroll-inner mx-auto py-10" style="transform: scale({(zoomLevel / 100) * 1.25}); transform-origin: top center;">
				{#if !editor}
					<div class="mx-auto max-w-[210mm] p-4">
						<PageSkeleton lines={6} showHeader={false} />
					</div>
				{/if}
				<A4PageLayout {editor} enablePagination>
					<div
						bind:this={editorElement}
						class="tiptap-editor-wrapper"
						class:hidden={!editor}
						aria-label="Sjablooninhoud bewerken"
						role="textbox"
						aria-multiline="true"
					></div>
				</A4PageLayout>
			</div>
		</div>

		<TemplateSettingsPanel
			bind:templateName
			bind:description={templateDescription}
			bind:categoryType={templateCategory}
			visible={showSettings}
		/>
	</div>
</div>

<style>
	.a4-scroll-area { background: #e8e8e8; }
	.a4-scroll-inner { width: 210mm; padding-left: 40px; padding-right: 40px; --background: 0 0% 100%; }
	.tiptap-editor-wrapper :global(.tiptap) { outline: none; min-height: 200px; font-size: var(--editor-font-size, 11pt); line-height: 1.6; color: #1a1a1a; }
	.tiptap-editor-wrapper :global(.tiptap p.is-editor-empty:first-child::before) { color: #9ca3af; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
	.tiptap-editor-wrapper :global(.tiptap h1) { font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
	.tiptap-editor-wrapper :global(.tiptap h2) { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
	.tiptap-editor-wrapper :global(.tiptap h3) { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem; }
	.tiptap-editor-wrapper :global(.tiptap p) { margin-bottom: 0.5rem; }
	.tiptap-editor-wrapper :global(.tiptap ul) { padding-left: 1.5rem; margin-bottom: 0.75rem; list-style-type: disc; }
	.tiptap-editor-wrapper :global(.tiptap ol) { padding-left: 1.5rem; margin-bottom: 0.75rem; list-style-type: decimal; }
	.tiptap-editor-wrapper :global(.tiptap li) { margin-bottom: 0.25rem; }
	.tiptap-editor-wrapper :global(.tiptap blockquote) { border-left: 3px solid #d1d5db; padding-left: 1rem; margin: 0.75rem 0; color: #6b7280; }
	.tiptap-editor-wrapper :global(.preview-value) { background: #FEF3C7; border-radius: 4px; padding: 2px 6px; font-size: 0.8125rem; }
	/* --- Pages extension overrides --- */
	.a4-scroll-inner :global(.tiptap) { margin: 0 auto !important; border: none !important; }
	.a4-scroll-inner :global(.tiptap table) { display: table !important; }
	.a4-scroll-inner :global(.tiptap tbody) { display: table-row-group !important; }
	.a4-scroll-inner :global(.tiptap-page-break:first-child .tiptap-pagination-gap), .a4-scroll-inner :global(.tiptap-page-break:first-child .tiptap-page-footer) { display: none; }
	.a4-scroll-inner :global(.tiptap-pagination-gap) { position: relative; }
	.a4-scroll-inner :global(.tiptap-pagination-gap::before), .a4-scroll-inner :global(.tiptap-pagination-gap::after) { content: ''; position: absolute; left: 0; right: 0; height: 12px; pointer-events: none; z-index: 3; }
	.a4-scroll-inner :global(.tiptap-pagination-gap::before) { top: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.12), transparent); }
	.a4-scroll-inner :global(.tiptap-pagination-gap::after) { bottom: 0; background: linear-gradient(to top, rgba(0,0,0,0.12), transparent); }
	.a4-scroll-inner :global(.tiptap-page-footer), .a4-scroll-inner :global(.tiptap-page-header) { font-size: 10px; color: #9ca3af; font-family: sans-serif; }
</style>
