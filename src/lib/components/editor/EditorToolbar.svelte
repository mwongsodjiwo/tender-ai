<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Editor } from '@tiptap/core';

	export let focusedEditor: Editor | null = null;
	export let activeCommentsCount = 0;
	export let isCommentsSidebarActive = false;
	export let showSearch = false;
	export let zoomLevel = 100;
	export let fontSize = '11';

	const dispatch = createEventDispatcher<{ toggleSearch: void; toggleComments: void }>();

	const ZOOM_LEVELS = [75, 90, 100, 110, 125, 150];
	const FONT_SIZES = [
		{ value: '9', label: '9pt' }, { value: '10', label: '10pt' },
		{ value: '11', label: '11pt' }, { value: '12', label: '12pt' },
		{ value: '14', label: '14pt' }, { value: '16', label: '16pt' },
		{ value: '18', label: '18pt' }
	];

	export const ZOOM_BASE = 1.25;

	let isBold = false; let isItalic = false; let isStrike = false;
	let isBulletList = false; let isOrderedList = false; let isBlockquote = false;
	let headingLevel: number | null = null;
	let isInTable = false; let showTableMenu = false;

	function updateToolbar(editor: Editor | null) {
		if (!editor) {
			isBold = isItalic = isStrike = isBulletList = isOrderedList = isBlockquote = isInTable = false;
			headingLevel = null;
			return;
		}
		isBold = editor.isActive('bold');
		isItalic = editor.isActive('italic');
		isStrike = editor.isActive('strike');
		isBulletList = editor.isActive('bulletList');
		isOrderedList = editor.isActive('orderedList');
		isBlockquote = editor.isActive('blockquote');
		isInTable = editor.isActive('table');
		headingLevel = editor.isActive('heading', { level: 1 }) ? 1
			: editor.isActive('heading', { level: 2 }) ? 2
			: editor.isActive('heading', { level: 3 }) ? 3 : null;
	}

	$: if (focusedEditor) {
		const ed = focusedEditor;
		const handler = () => updateToolbar(ed);
		ed.on('transaction', handler);
		updateToolbar(ed);
	}

	function cmd(action: string) {
		if (!focusedEditor) return;
		const c = focusedEditor.chain().focus();
		if (action === 'bold') c.toggleBold().run();
		else if (action === 'italic') c.toggleItalic().run();
		else if (action === 'strike') c.toggleStrike().run();
		else if (action === 'bulletList') c.toggleBulletList().run();
		else if (action === 'orderedList') c.toggleOrderedList().run();
		else if (action === 'blockquote') c.toggleBlockquote().run();
		else if (action === 'undo') c.undo().run();
		else if (action === 'redo') c.redo().run();
		else if (action === 'insertTable') c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
		else if (action === 'addColBefore') c.addColumnBefore().run();
		else if (action === 'addColAfter') c.addColumnAfter().run();
		else if (action === 'deleteCol') c.deleteColumn().run();
		else if (action === 'addRowBefore') c.addRowBefore().run();
		else if (action === 'addRowAfter') c.addRowAfter().run();
		else if (action === 'deleteRow') c.deleteRow().run();
		else if (action === 'deleteTable') c.deleteTable().run();
	}

	function setHeading(val: string) {
		if (!focusedEditor) return;
		if (val === 'p') focusedEditor.chain().focus().setParagraph().run();
		else focusedEditor.chain().focus().toggleHeading({ level: Number(val) as 1 | 2 | 3 }).run();
	}

	function zoomIn() { const i = ZOOM_LEVELS.indexOf(zoomLevel); if (i < ZOOM_LEVELS.length - 1) zoomLevel = ZOOM_LEVELS[i + 1]; }
	function zoomOut() { const i = ZOOM_LEVELS.indexOf(zoomLevel); if (i > 0) zoomLevel = ZOOM_LEVELS[i - 1]; }
</script>

<div class="shared-toolbar flex shrink-0 flex-wrap items-center justify-center gap-1.5 border-b border-gray-200 bg-white px-6 py-2">
	<button on:click={() => cmd('undo')} class="toolbar-btn" title="Ongedaan maken" aria-label="Ongedaan maken" type="button" disabled={!focusedEditor}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg></button>
	<button on:click={() => cmd('redo')} class="toolbar-btn" title="Opnieuw uitvoeren" aria-label="Opnieuw uitvoeren" type="button" disabled={!focusedEditor}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" /></svg></button>
	<span class="toolbar-divider"></span>

	<select on:change={(e) => setHeading((e.target as HTMLSelectElement).value)} value={headingLevel ? String(headingLevel) : 'p'} class="toolbar-select" title="Tekststijl" aria-label="Tekststijl" disabled={!focusedEditor}>
		<option value="p">Paragraaf</option>
		<option value="1">Kop 1</option>
		<option value="2">Kop 2</option>
		<option value="3">Kop 3</option>
	</select>
	<span class="toolbar-divider"></span>

	<button on:click={() => cmd('bold')} class="toolbar-btn" class:active={isBold} title="Vet (Ctrl+B)" aria-label="Vet" aria-pressed={isBold} type="button" disabled={!focusedEditor}><span class="text-sm font-bold">B</span></button>
	<button on:click={() => cmd('italic')} class="toolbar-btn" class:active={isItalic} title="Cursief (Ctrl+I)" aria-label="Cursief" aria-pressed={isItalic} type="button" disabled={!focusedEditor}><span class="text-sm italic">I</span></button>
	<button on:click={() => cmd('strike')} class="toolbar-btn" class:active={isStrike} title="Doorhalen" aria-label="Doorhalen" aria-pressed={isStrike} type="button" disabled={!focusedEditor}><span class="text-sm line-through">S</span></button>
	<span class="toolbar-divider"></span>

	<button on:click={() => cmd('bulletList')} class="toolbar-btn" class:active={isBulletList} title="Opsommingslijst" aria-label="Opsommingslijst" aria-pressed={isBulletList} type="button" disabled={!focusedEditor}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
	<button on:click={() => cmd('orderedList')} class="toolbar-btn" class:active={isOrderedList} title="Genummerde lijst" aria-label="Genummerde lijst" aria-pressed={isOrderedList} type="button" disabled={!focusedEditor}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg></button>
	<button on:click={() => cmd('blockquote')} class="toolbar-btn" class:active={isBlockquote} title="Citaat" aria-label="Citaat" aria-pressed={isBlockquote} type="button" disabled={!focusedEditor}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></button>
	<span class="toolbar-divider"></span>

	<div class="relative">
		<button on:click={() => { if (isInTable) showTableMenu = !showTableMenu; else cmd('insertTable'); }} class="toolbar-btn" class:active={isInTable} title={isInTable ? 'Tabelopties' : 'Tabel invoegen'} aria-label={isInTable ? 'Tabelopties' : 'Tabel invoegen'} aria-expanded={isInTable ? showTableMenu : undefined} aria-haspopup={isInTable ? 'menu' : undefined} type="button" disabled={!focusedEditor}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" /></svg></button>
		{#if showTableMenu && isInTable}
			<div
				class="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
				role="menu"
				tabindex="-1"
				aria-label="Tabelopties"
				on:mouseleave={() => { showTableMenu = false; }}
				on:keydown={(e) => { if (e.key === 'Escape') { showTableMenu = false; } }}
			>
				<button on:click={() => { cmd('addColBefore'); showTableMenu = false; }} class="table-menu-btn" type="button" role="menuitem">Kolom links invoegen</button>
				<button on:click={() => { cmd('addColAfter'); showTableMenu = false; }} class="table-menu-btn" type="button" role="menuitem">Kolom rechts invoegen</button>
				<button on:click={() => { cmd('deleteCol'); showTableMenu = false; }} class="table-menu-btn text-error-600" type="button" role="menuitem">Kolom verwijderen</button>
				<hr class="my-1 border-gray-200">
				<button on:click={() => { cmd('addRowBefore'); showTableMenu = false; }} class="table-menu-btn" type="button" role="menuitem">Rij boven invoegen</button>
				<button on:click={() => { cmd('addRowAfter'); showTableMenu = false; }} class="table-menu-btn" type="button" role="menuitem">Rij onder invoegen</button>
				<button on:click={() => { cmd('deleteRow'); showTableMenu = false; }} class="table-menu-btn text-error-600" type="button" role="menuitem">Rij verwijderen</button>
				<hr class="my-1 border-gray-200">
				<button on:click={() => { cmd('deleteTable'); showTableMenu = false; }} class="table-menu-btn text-error-600" type="button" role="menuitem">Tabel verwijderen</button>
			</div>
		{/if}
	</div>
	<span class="toolbar-divider"></span>

	<select bind:value={fontSize} class="toolbar-select" title="Lettergrootte" aria-label="Lettergrootte">
		{#each FONT_SIZES as size}<option value={size.value}>{size.label}</option>{/each}
	</select>
	<span class="toolbar-divider"></span>

	<button on:click={zoomOut} class="toolbar-btn" title="Uitzoomen" aria-label="Uitzoomen" type="button" disabled={zoomLevel <= ZOOM_LEVELS[0]}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg></button>
	<span class="min-w-[3rem] text-center text-xs font-medium text-gray-600">{zoomLevel}%</span>
	<button on:click={zoomIn} class="toolbar-btn" title="Inzoomen" aria-label="Inzoomen" type="button" disabled={zoomLevel >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg></button>
	<span class="toolbar-divider"></span>

	<button on:click={() => dispatch('toggleSearch')} class="toolbar-btn" class:active={showSearch} title="Zoeken (Ctrl+F)" aria-label="Zoeken" type="button"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
	<span class="toolbar-divider"></span>

	<button on:click={() => dispatch('toggleComments')} class="toolbar-btn relative" class:active={isCommentsSidebarActive} class:has-comments={activeCommentsCount > 0 && !isCommentsSidebarActive} title="Opmerkingen tonen/verbergen" aria-label="Opmerkingen tonen/verbergen" type="button">
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
		{#if activeCommentsCount > 0}
			<span class="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">{activeCommentsCount}</span>
		{/if}
	</button>
</div>

<style>
	.toolbar-btn { display: inline-flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; border-radius: 0.375rem; color: #4b5563; transition: all 0.1s; }
	.toolbar-btn:hover:not(:disabled) { background-color: #f3f4f6; color: #111827; }
	.toolbar-btn:disabled { opacity: 0.35; cursor: default; }
	.toolbar-btn.active { background-color: #dbeafe; color: #1d4ed8; }
	.toolbar-btn.has-comments { background-color: #fef3c7; color: #d97706; }
	.toolbar-btn.has-comments:hover:not(:disabled) { background-color: #fde68a; color: #b45309; }
	.toolbar-select { height: 2.25rem; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 0 0.75rem; font-size: 0.8125rem; color: #374151; background-color: white; cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.5rem center; padding-right: 1.75rem; }
	.toolbar-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15); }
	.toolbar-select:disabled { opacity: 0.35; cursor: default; }
	.toolbar-divider { display: inline-block; width: 1px; height: 1.5rem; background-color: #e5e7eb; margin: 0 0.5rem; }
	.table-menu-btn { display: block; width: 100%; text-align: left; padding: 0.375rem 0.75rem; font-size: 0.75rem; color: #374151; }
	.table-menu-btn:hover { background-color: #f3f4f6; }
</style>
