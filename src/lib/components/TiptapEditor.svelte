<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import { Table } from '@tiptap/extension-table';
	import { TableRow } from '@tiptap/extension-table-row';
	import { TableCell } from '@tiptap/extension-table-cell';
	import { TableHeader } from '@tiptap/extension-table-header';

	export let content: string = '';
	export let editable: boolean = true;
	export let placeholder: string = 'Begin hier met schrijven...';

	const dispatch = createEventDispatcher<{ change: string }>();

	let editorElement: HTMLElement;
	let editor: Editor | null = null;

	// Track whether content was set externally (e.g. version restore)
	let lastEmittedContent = content;

	$: if (editor && content !== lastEmittedContent) {
		// External content update — replace editor content without emitting change
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

	// Toolbar state
	let isBold = false;
	let isItalic = false;
	let isStrike = false;
	let isBulletList = false;
	let isOrderedList = false;
	let isBlockquote = false;
	let headingLevel: number | null = null;

	function updateToolbarState() {
		if (!editor) return;
		isBold = editor.isActive('bold');
		isItalic = editor.isActive('italic');
		isStrike = editor.isActive('strike');
		isBulletList = editor.isActive('bulletList');
		isOrderedList = editor.isActive('orderedList');
		isBlockquote = editor.isActive('blockquote');

		if (editor.isActive('heading', { level: 1 })) headingLevel = 1;
		else if (editor.isActive('heading', { level: 2 })) headingLevel = 2;
		else if (editor.isActive('heading', { level: 3 })) headingLevel = 3;
		else headingLevel = null;
	}

	function convertPlainTextToHtml(text: string): string {
		if (text.startsWith('<') && (text.startsWith('<p') || text.startsWith('<h') || text.startsWith('<ul') || text.startsWith('<ol') || text.startsWith('<table') || text.startsWith('<blockquote') || text.startsWith('<div'))) {
			return text;
		}
		// Convert plain text line breaks to paragraphs
		return text
			.split('\n\n')
			.map((block) => {
				const lines = block.split('\n').join('<br>');
				return `<p>${lines}</p>`;
			})
			.join('');
	}

	onMount(() => {
		const initialHtml = content ? convertPlainTextToHtml(content) : '';

		editor = new Editor({
			element: editorElement,
			extensions: [
				StarterKit.configure({
					heading: { levels: [1, 2, 3] },
					bulletList: { keepMarks: true },
					orderedList: { keepMarks: true }
				}),
				Placeholder.configure({
					placeholder,
					emptyEditorClass: 'is-editor-empty'
				}),
				Table.configure({
					resizable: true,
					HTMLAttributes: { class: 'tiptap-table' }
				}),
				TableRow,
				TableCell,
				TableHeader
			],
			content: initialHtml,
			editable,
			onTransaction: () => {
				updateToolbarState();
			},
			onUpdate: ({ editor: e }) => {
				const html = e.getHTML();
				lastEmittedContent = html;
				dispatch('change', html);
			}
		});

		lastEmittedContent = editor.getHTML();
		// Emit initial HTML so parent has the correct format
		if (content && content !== lastEmittedContent) {
			dispatch('change', lastEmittedContent);
		}

		updateToolbarState();
	});

	onDestroy(() => {
		editor?.destroy();
	});

	// Toolbar actions
	function toggleBold() { editor?.chain().focus().toggleBold().run(); }
	function toggleItalic() { editor?.chain().focus().toggleItalic().run(); }
	function toggleStrike() { editor?.chain().focus().toggleStrike().run(); }
	function toggleBulletList() { editor?.chain().focus().toggleBulletList().run(); }
	function toggleOrderedList() { editor?.chain().focus().toggleOrderedList().run(); }
	function toggleBlockquote() { editor?.chain().focus().toggleBlockquote().run(); }
	function setHeading(level: 1 | 2 | 3) { editor?.chain().focus().toggleHeading({ level }).run(); }
	function setParagraph() { editor?.chain().focus().setParagraph().run(); }
	function insertTable() {
		editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
	}
	function addColumnBefore() { editor?.chain().focus().addColumnBefore().run(); }
	function addColumnAfter() { editor?.chain().focus().addColumnAfter().run(); }
	function deleteColumn() { editor?.chain().focus().deleteColumn().run(); }
	function addRowBefore() { editor?.chain().focus().addRowBefore().run(); }
	function addRowAfter() { editor?.chain().focus().addRowAfter().run(); }
	function deleteRow() { editor?.chain().focus().deleteRow().run(); }
	function deleteTable() { editor?.chain().focus().deleteTable().run(); }
	function undo() { editor?.chain().focus().undo().run(); }
	function redo() { editor?.chain().focus().redo().run(); }

	// Table menu state
	let showTableMenu = false;
	$: isInTable = editor?.isActive('table') ?? false;
</script>

<!-- Toolbar -->
<div class="tiptap-toolbar flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-2 py-1.5">
	<!-- Undo/Redo -->
	<button
		on:click={undo}
		class="toolbar-btn"
		title="Ongedaan maken"
		aria-label="Ongedaan maken"
		type="button"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
	</button>
	<button
		on:click={redo}
		class="toolbar-btn"
		title="Opnieuw uitvoeren"
		aria-label="Opnieuw uitvoeren"
		type="button"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" /></svg>
	</button>

	<span class="toolbar-divider"></span>

	<!-- Heading select -->
	<select
		on:change={(e) => {
			const val = (e.target as HTMLSelectElement).value;
			if (val === 'p') setParagraph();
			else setHeading(Number(val) as 1 | 2 | 3);
		}}
		value={headingLevel ? String(headingLevel) : 'p'}
		class="toolbar-select"
		title="Tekststijl"
		aria-label="Tekststijl"
	>
		<option value="p">Paragraaf</option>
		<option value="1">Kop 1</option>
		<option value="2">Kop 2</option>
		<option value="3">Kop 3</option>
	</select>

	<span class="toolbar-divider"></span>

	<!-- Inline formatting -->
	<button
		on:click={toggleBold}
		class="toolbar-btn"
		class:active={isBold}
		title="Vet (Ctrl+B)"
		aria-label="Vet"
		aria-pressed={isBold}
		type="button"
	>
		<span class="text-sm font-bold">B</span>
	</button>
	<button
		on:click={toggleItalic}
		class="toolbar-btn"
		class:active={isItalic}
		title="Cursief (Ctrl+I)"
		aria-label="Cursief"
		aria-pressed={isItalic}
		type="button"
	>
		<span class="text-sm italic">I</span>
	</button>
	<button
		on:click={toggleStrike}
		class="toolbar-btn"
		class:active={isStrike}
		title="Doorhalen"
		aria-label="Doorhalen"
		aria-pressed={isStrike}
		type="button"
	>
		<span class="text-sm line-through">S</span>
	</button>

	<span class="toolbar-divider"></span>

	<!-- Lists -->
	<button
		on:click={toggleBulletList}
		class="toolbar-btn"
		class:active={isBulletList}
		title="Opsommingslijst"
		aria-label="Opsommingslijst"
		aria-pressed={isBulletList}
		type="button"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /><circle cx="1" cy="6" r="1" fill="currentColor" /><circle cx="1" cy="12" r="1" fill="currentColor" /><circle cx="1" cy="18" r="1" fill="currentColor" /></svg>
	</button>
	<button
		on:click={toggleOrderedList}
		class="toolbar-btn"
		class:active={isOrderedList}
		title="Genummerde lijst"
		aria-label="Genummerde lijst"
		aria-pressed={isOrderedList}
		type="button"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
	</button>
	<button
		on:click={toggleBlockquote}
		class="toolbar-btn"
		class:active={isBlockquote}
		title="Citaat"
		aria-label="Citaat"
		aria-pressed={isBlockquote}
		type="button"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
	</button>

	<span class="toolbar-divider"></span>

	<!-- Table -->
	<div class="relative">
		<button
			on:click={() => {
				if (isInTable) {
					showTableMenu = !showTableMenu;
				} else {
					insertTable();
				}
			}}
			class="toolbar-btn"
			class:active={isInTable}
			title={isInTable ? 'Tabelopties' : 'Tabel invoegen'}
			aria-label={isInTable ? 'Tabelopties' : 'Tabel invoegen'}
			type="button"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" /></svg>
		</button>

		{#if showTableMenu && isInTable}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
				on:mouseleave={() => { showTableMenu = false; }}
			>
				<button on:click={() => { addColumnBefore(); showTableMenu = false; }} class="table-menu-btn" type="button">Kolom links invoegen</button>
				<button on:click={() => { addColumnAfter(); showTableMenu = false; }} class="table-menu-btn" type="button">Kolom rechts invoegen</button>
				<button on:click={() => { deleteColumn(); showTableMenu = false; }} class="table-menu-btn text-red-600" type="button">Kolom verwijderen</button>
				<hr class="my-1 border-gray-100">
				<button on:click={() => { addRowBefore(); showTableMenu = false; }} class="table-menu-btn" type="button">Rij boven invoegen</button>
				<button on:click={() => { addRowAfter(); showTableMenu = false; }} class="table-menu-btn" type="button">Rij onder invoegen</button>
				<button on:click={() => { deleteRow(); showTableMenu = false; }} class="table-menu-btn text-red-600" type="button">Rij verwijderen</button>
				<hr class="my-1 border-gray-100">
				<button on:click={() => { deleteTable(); showTableMenu = false; }} class="table-menu-btn text-red-600" type="button">Tabel verwijderen</button>
			</div>
		{/if}
	</div>
</div>

<!-- Editor -->
<div
	bind:this={editorElement}
	class="tiptap-editor-wrapper"
	aria-label="Sectie-inhoud bewerken"
></div>

<style>
	/* Toolbar styles */
	.toolbar-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.25rem;
		color: #4b5563;
		transition: all 0.1s;
	}
	.toolbar-btn:hover {
		background-color: #e5e7eb;
		color: #111827;
	}
	.toolbar-btn.active {
		background-color: #dbeafe;
		color: #1d4ed8;
	}
	.toolbar-select {
		height: 2rem;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		padding: 0 0.5rem;
		font-size: 0.75rem;
		color: #374151;
		background-color: white;
		cursor: pointer;
	}
	.toolbar-select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 1px #3b82f6;
	}
	.toolbar-divider {
		display: inline-block;
		width: 1px;
		height: 1.25rem;
		background-color: #d1d5db;
		margin: 0 0.25rem;
	}
	.table-menu-btn {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		color: #374151;
	}
	.table-menu-btn:hover {
		background-color: #f3f4f6;
	}

	/* Editor wrapper */
	.tiptap-editor-wrapper {
		flex: 1;
		overflow-y: auto;
		border: 1px solid #e5e7eb;
		border-radius: 0 0 0.5rem 0.5rem;
		background: white;
	}

	/* Tiptap editor content styles */
	.tiptap-editor-wrapper :global(.tiptap) {
		padding: 1rem;
		min-height: 100%;
		outline: none;
		font-size: 0.875rem;
		line-height: 1.75;
		color: #111827;
	}

	.tiptap-editor-wrapper :global(.tiptap:focus) {
		outline: none;
	}

	/* Placeholder */
	.tiptap-editor-wrapper :global(.tiptap p.is-editor-empty:first-child::before) {
		color: #9ca3af;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	/* Headings */
	.tiptap-editor-wrapper :global(.tiptap h1) {
		font-size: 1.5rem;
		font-weight: 700;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}
	.tiptap-editor-wrapper :global(.tiptap h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
		line-height: 1.3;
	}
	.tiptap-editor-wrapper :global(.tiptap h3) {
		font-size: 1.125rem;
		font-weight: 600;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		line-height: 1.3;
	}

	/* Paragraphs */
	.tiptap-editor-wrapper :global(.tiptap p) {
		margin-bottom: 0.5rem;
	}

	/* Lists */
	.tiptap-editor-wrapper :global(.tiptap ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin-bottom: 0.75rem;
	}
	.tiptap-editor-wrapper :global(.tiptap ol) {
		list-style-type: decimal;
		padding-left: 1.5rem;
		margin-bottom: 0.75rem;
	}
	.tiptap-editor-wrapper :global(.tiptap li) {
		margin-bottom: 0.25rem;
	}
	.tiptap-editor-wrapper :global(.tiptap li p) {
		margin-bottom: 0.125rem;
	}

	/* Blockquote */
	.tiptap-editor-wrapper :global(.tiptap blockquote) {
		border-left: 3px solid #d1d5db;
		padding-left: 1rem;
		margin: 0.75rem 0;
		color: #6b7280;
		font-style: italic;
	}

	/* Table */
	.tiptap-editor-wrapper :global(.tiptap-table) {
		border-collapse: collapse;
		width: 100%;
		margin: 0.75rem 0;
		table-layout: fixed;
		overflow: hidden;
	}
	.tiptap-editor-wrapper :global(.tiptap-table td),
	.tiptap-editor-wrapper :global(.tiptap-table th) {
		border: 1px solid #d1d5db;
		padding: 0.5rem 0.75rem;
		vertical-align: top;
		min-width: 4rem;
		font-size: 0.875rem;
	}
	.tiptap-editor-wrapper :global(.tiptap-table th) {
		background-color: #f9fafb;
		font-weight: 600;
	}
	.tiptap-editor-wrapper :global(.tiptap-table .selectedCell) {
		background-color: #dbeafe;
	}

	/* Code */
	.tiptap-editor-wrapper :global(.tiptap code) {
		background-color: #f3f4f6;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.8125rem;
		font-family: ui-monospace, SFMono-Regular, monospace;
	}

	/* Horizontal rule */
	.tiptap-editor-wrapper :global(.tiptap hr) {
		border: none;
		border-top: 1px solid #e5e7eb;
		margin: 1rem 0;
	}

	/* Strong and em */
	.tiptap-editor-wrapper :global(.tiptap strong) {
		font-weight: 700;
	}
	.tiptap-editor-wrapper :global(.tiptap em) {
		font-style: italic;
	}
	.tiptap-editor-wrapper :global(.tiptap s) {
		text-decoration: line-through;
	}
</style>
