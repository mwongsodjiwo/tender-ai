<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { createEditorExtensions, convertPlainTextToHtml } from './editor/editor-config';
	import TiptapToolbar from './TiptapToolbar.svelte';

	export let content: string = '';
	export let editable: boolean = true;
	export let placeholder: string = 'Begin hier met schrijven...';
	export let showToolbar: boolean = true;
	export let enablePlaceholderHighlights: boolean = false;

	/** Expose the Tiptap Editor instance so parent components can control it */
	export function getEditor(): Editor | null {
		return editor;
	}

	const dispatch = createEventDispatcher<{ change: string }>();

	let editorElement: HTMLElement;
	let editor: Editor | null = null;
	let lastEmittedContent = content;

	$: if (editor && content !== lastEmittedContent) {
		const currentSelection = editor.state.selection;
		editor.commands.setContent(content, { emitUpdate: false });
		lastEmittedContent = content;
		try {
			editor.commands.setTextSelection(
				Math.min(currentSelection.anchor, editor.state.doc.content.size - 1)
			);
		} catch {
			// Selection out of range after content change — ignore
		}
	}

	onMount(() => {
		const initialHtml = content ? convertPlainTextToHtml(content) : '';

		editor = new Editor({
			element: editorElement,
			extensions: createEditorExtensions({ placeholder, enablePlaceholderHighlights }),
			content: initialHtml,
			editable,
			onUpdate: ({ editor: e }) => {
				const html = e.getHTML();
				lastEmittedContent = html;
				dispatch('change', html);
			}
		});

		lastEmittedContent = editor.getHTML();
		if (content && content !== lastEmittedContent) {
			dispatch('change', lastEmittedContent);
		}
	});

	onDestroy(() => {
		editor?.destroy();
	});
</script>

{#if showToolbar && editor}
	<TiptapToolbar {editor} />
{/if}

<div
	bind:this={editorElement}
	class="tiptap-editor-wrapper"
	aria-label="Sectie-inhoud bewerken"
></div>

<style>
	.tiptap-editor-wrapper {
		flex: 1;
		overflow-y: auto;
		border: 1px solid #e5e7eb;
		border-radius: 0 0 0.5rem 0.5rem;
		background: white;
	}
	.tiptap-editor-wrapper :global(.tiptap) {
		padding: 1rem;
		min-height: 100%;
		outline: none;
		font-size: 0.875rem;
		line-height: 1.75;
		color: #111827;
	}
	.tiptap-editor-wrapper :global(.tiptap:focus) { outline: none; }
	.tiptap-editor-wrapper :global(.tiptap p.is-editor-empty:first-child::before) {
		color: #9ca3af;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
	.tiptap-editor-wrapper :global(.tiptap h1) {
		font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.3;
	}
	.tiptap-editor-wrapper :global(.tiptap h2) {
		font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; line-height: 1.3;
	}
	.tiptap-editor-wrapper :global(.tiptap h3) {
		font-size: 1.125rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; line-height: 1.3;
	}
	.tiptap-editor-wrapper :global(.tiptap p) { margin-bottom: 0.5rem; }
	.tiptap-editor-wrapper :global(.tiptap ul) {
		list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem;
	}
	.tiptap-editor-wrapper :global(.tiptap ol) {
		list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem;
	}
	.tiptap-editor-wrapper :global(.tiptap li) { margin-bottom: 0.25rem; }
	.tiptap-editor-wrapper :global(.tiptap li p) { margin-bottom: 0.125rem; }
	.tiptap-editor-wrapper :global(.tiptap blockquote) {
		border-left: 3px solid #d1d5db; padding-left: 1rem; margin: 0.75rem 0; color: #6b7280; font-style: italic;
	}
	.tiptap-editor-wrapper :global(.tiptap-table) {
		border-collapse: collapse; width: 100%; margin: 0.75rem 0; table-layout: fixed; overflow: hidden;
	}
	.tiptap-editor-wrapper :global(.tiptap-table td),
	.tiptap-editor-wrapper :global(.tiptap-table th) {
		border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; vertical-align: top; min-width: 4rem; font-size: 0.875rem;
	}
	.tiptap-editor-wrapper :global(.tiptap-table th) { background-color: #f9fafb; font-weight: 600; }
	.tiptap-editor-wrapper :global(.tiptap-table .selectedCell) { background-color: #dbeafe; }
	.tiptap-editor-wrapper :global(.tiptap code) {
		background-color: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8125rem; font-family: ui-monospace, SFMono-Regular, monospace;
	}
	.tiptap-editor-wrapper :global(.tiptap hr) { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
	.tiptap-editor-wrapper :global(.tiptap strong) { font-weight: 600; }
	.tiptap-editor-wrapper :global(.tiptap em) { font-style: italic; }
	.tiptap-editor-wrapper :global(.tiptap s) { text-decoration: line-through; }
</style>
