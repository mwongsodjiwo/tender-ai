<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Editor } from '@tiptap/core';
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';
	import LetterAddressBlock from '$lib/components/editor/LetterAddressBlock.svelte';

	export let senderName: string;
	export let senderStreet: string;
	export let senderPostalCode: string;
	export let senderCity: string;
	export let recipientName: string;
	export let recipientStreet: string;
	export let recipientPostalCode: string;
	export let recipientCity: string;
	export let letterDate: string;
	export let letterReference: string;
	export let subject: string;
	export let body: string;
	export let isEditable: boolean;
	export let zoomLevel: number;
	export let fontSize: string;

	let editorComponent: TiptapEditor;

	const dispatch = createEventDispatcher<{
		change: string;
		editorFocus: Editor;
	}>();

	export function getEditor(): Editor | null {
		return editorComponent?.getEditor() ?? null;
	}

	function handleEditorChange(event: CustomEvent<string>) {
		dispatch('change', event.detail);
	}

	function handleEditorFocus() {
		const editor = editorComponent?.getEditor();
		if (editor) dispatch('editorFocus', editor);
	}
</script>

<div class="flex min-h-0 flex-1 justify-center overflow-y-auto py-8">
	<div
		class="letter-paper"
		style="transform: scale({(zoomLevel / 100) * 1.25}); transform-origin: top center; --editor-font-size: {fontSize}pt;"
	>
		<div class="letter-paper-content-padding">
			<LetterAddressBlock
				bind:senderName
				bind:senderStreet
				bind:senderPostalCode
				bind:senderCity
				bind:recipientName
				bind:recipientStreet
				bind:recipientPostalCode
				bind:recipientCity
				bind:date={letterDate}
				bind:reference={letterReference}
				bind:subject
				editable={isEditable}
			/>
		</div>

		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="letter-editor-area" on:focusin={handleEditorFocus} role="none">
			<TiptapEditor
				bind:this={editorComponent}
				content={body}
				editable={isEditable}
				placeholder="Begin met schrijven of gebruik AI om een concept te genereren..."
				showToolbar={false}
				on:change={handleEditorChange}
			/>
		</div>
	</div>
</div>

<style>
	.letter-paper {
		width: 794px;
		min-height: 1123px;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.letter-paper-content-padding {
		padding: 60px 72px 0 72px;
	}

	.letter-editor-area :global(.tiptap-editor-wrapper) {
		border: none;
		border-radius: 0;
		min-height: 600px;
	}

	.letter-editor-area :global(.tiptap-editor-wrapper .tiptap) {
		padding: 0 72px 60px 72px;
		min-height: 600px;
		font-family: 'Asap', sans-serif;
		font-size: var(--editor-font-size, 11pt);
		line-height: 1.6;
		color: #1a1a1a;
	}
</style>
