<script lang="ts">
	import type { Editor } from '@tiptap/core';

	export let editor: Editor;

	let isBold = false;
	let isItalic = false;
	let isStrike = false;
	let isBulletList = false;
	let isOrderedList = false;
	let isBlockquote = false;
	let headingLevel: number | null = null;
	let activeFontFamily = '';
	let isInTable = false;
	let showTableMenu = false;

	function updateToolbarState() {
		if (!editor) return;
		isBold = editor.isActive('bold');
		isItalic = editor.isActive('italic');
		isStrike = editor.isActive('strike');
		isBulletList = editor.isActive('bulletList');
		isOrderedList = editor.isActive('orderedList');
		isBlockquote = editor.isActive('blockquote');
		isInTable = editor.isActive('table');
		activeFontFamily = (editor.getAttributes('textStyle').fontFamily as string) ?? '';
		headingLevel = editor.isActive('heading', { level: 1 }) ? 1
			: editor.isActive('heading', { level: 2 }) ? 2
			: editor.isActive('heading', { level: 3 }) ? 3 : null;
	}

	$: if (editor) {
		editor.on('transaction', updateToolbarState);
		updateToolbarState();
	}

	function cmd(action: string) {
		if (!editor) return;
		const c = editor.chain().focus();
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
		if (!editor) return;
		if (val === 'p') editor.chain().focus().setParagraph().run();
		else editor.chain().focus().toggleHeading({ level: Number(val) as 1 | 2 | 3 }).run();
	}

	function setFontFamily(val: string) {
		if (!editor) return;
		if (!val) editor.chain().focus().unsetFontFamily().run();
		else editor.chain().focus().setFontFamily(val).run();
	}
</script>

<div class="tiptap-toolbar flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 px-2 py-1.5">
	<!-- Undo/Redo -->
	<button on:click={() => cmd('undo')} class="toolbar-btn" title="Ongedaan maken" aria-label="Ongedaan maken" type="button">
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
	</button>
	<button on:click={() => cmd('redo')} class="toolbar-btn" title="Opnieuw uitvoeren" aria-label="Opnieuw uitvoeren" type="button">
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" /></svg>
	</button>
	<span class="toolbar-divider"></span>

	<!-- Heading select -->
	<select
		on:change={(e) => setHeading((e.target as HTMLSelectElement).value)}
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
	<button on:click={() => cmd('bold')} class="toolbar-btn" class:active={isBold} title="Vet (Ctrl+B)" aria-label="Vet" aria-pressed={isBold} type="button">
		<span class="text-sm font-semibold">B</span>
	</button>
	<button on:click={() => cmd('italic')} class="toolbar-btn" class:active={isItalic} title="Cursief (Ctrl+I)" aria-label="Cursief" aria-pressed={isItalic} type="button">
		<span class="text-sm italic">I</span>
	</button>
	<button on:click={() => cmd('strike')} class="toolbar-btn" class:active={isStrike} title="Doorhalen" aria-label="Doorhalen" aria-pressed={isStrike} type="button">
		<span class="text-sm line-through">S</span>
	</button>
	<span class="toolbar-divider"></span>

	<!-- Lists -->
	<button on:click={() => cmd('bulletList')} class="toolbar-btn" class:active={isBulletList} title="Opsommingslijst" aria-label="Opsommingslijst" aria-pressed={isBulletList} type="button">
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /><circle cx="1" cy="6" r="1" fill="currentColor" /><circle cx="1" cy="12" r="1" fill="currentColor" /><circle cx="1" cy="18" r="1" fill="currentColor" /></svg>
	</button>
	<button on:click={() => cmd('orderedList')} class="toolbar-btn" class:active={isOrderedList} title="Genummerde lijst" aria-label="Genummerde lijst" aria-pressed={isOrderedList} type="button">
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
	</button>
	<button on:click={() => cmd('blockquote')} class="toolbar-btn" class:active={isBlockquote} title="Citaat" aria-label="Citaat" aria-pressed={isBlockquote} type="button">
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
	</button>
	<span class="toolbar-divider"></span>

	<!-- Font family -->
	<select
		on:change={(e) => setFontFamily((e.target as HTMLSelectElement).value)}
		value={activeFontFamily}
		class="toolbar-select"
		title="Lettertype"
		aria-label="Lettertype"
	>
		<option value="">Standaard</option>
		<option value="Arial">Arial</option>
		<option value="Times New Roman">Times New Roman</option>
		<option value="Verdana">Verdana</option>
		<option value="Georgia">Georgia</option>
	</select>
	<span class="toolbar-divider"></span>

	<!-- Table -->
	<div class="relative">
		<button
			on:click={() => { if (isInTable) showTableMenu = !showTableMenu; else cmd('insertTable'); }}
			class="toolbar-btn"
			class:active={isInTable}
			title={isInTable ? 'Tabelopties' : 'Tabel invoegen'}
			aria-label={isInTable ? 'Tabelopties' : 'Tabel invoegen'}
			type="button"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" /></svg>
		</button>
		{#if showTableMenu && isInTable}
			<div
				class="absolute left-0 top-full z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
				role="menu"
				tabindex="-1"
				aria-label="Tabelopties"
				on:mouseleave={() => { showTableMenu = false; }}
				on:keydown={(e) => { if (e.key === 'Escape') showTableMenu = false; }}
			>
				<button on:click={() => { cmd('addColBefore'); showTableMenu = false; }} class="table-menu-btn" type="button">Kolom links invoegen</button>
				<button on:click={() => { cmd('addColAfter'); showTableMenu = false; }} class="table-menu-btn" type="button">Kolom rechts invoegen</button>
				<button on:click={() => { cmd('deleteCol'); showTableMenu = false; }} class="table-menu-btn text-error-600" type="button">Kolom verwijderen</button>
				<hr class="my-1 border-gray-200">
				<button on:click={() => { cmd('addRowBefore'); showTableMenu = false; }} class="table-menu-btn" type="button">Rij boven invoegen</button>
				<button on:click={() => { cmd('addRowAfter'); showTableMenu = false; }} class="table-menu-btn" type="button">Rij onder invoegen</button>
				<button on:click={() => { cmd('deleteRow'); showTableMenu = false; }} class="table-menu-btn text-error-600" type="button">Rij verwijderen</button>
				<hr class="my-1 border-gray-200">
				<button on:click={() => { cmd('deleteTable'); showTableMenu = false; }} class="table-menu-btn text-error-600" type="button">Tabel verwijderen</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.toolbar-btn { display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: 0.25rem; color: #4b5563; transition: all 0.1s; }
	.toolbar-btn:hover { background-color: #e5e7eb; color: #111827; }
	.toolbar-btn.active { background-color: #dbeafe; color: #1d4ed8; }
	.toolbar-select { height: 2rem; border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0 0.5rem; font-size: 0.75rem; color: #374151; background-color: white; cursor: pointer; }
	.toolbar-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }
	.toolbar-divider { display: inline-block; width: 1px; height: 1.25rem; background-color: #d1d5db; margin: 0 0.25rem; }
	.table-menu-btn { display: block; width: 100%; text-align: left; padding: 0.375rem 0.75rem; font-size: 0.75rem; color: #374151; }
	.table-menu-btn:hover { background-color: #f3f4f6; }
</style>
