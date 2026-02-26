<script lang="ts">
	import type { Editor } from '@tiptap/core';

	export let editor: Editor | null = null;

	let open = false;
	let inputValue = '';

	const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

	$: activeSize = extractSize(editor);

	function extractSize(ed: Editor | null): string {
		if (!ed) return '11';
		const raw = ed.getAttributes('textStyle').fontSize as string | undefined;
		if (!raw) return '11';
		return raw.replace('px', '').replace('pt', '');
	}

	$: if (!open) inputValue = activeSize;

	function applySize(size: string) {
		if (!editor) return;
		const num = parseInt(size, 10);
		if (isNaN(num) || num < 1 || num > 200) return;
		editor.chain().focus().setFontSize(num + 'px').run();
		open = false;
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') { applySize(inputValue); e.preventDefault(); }
		if (e.key === 'Escape') { open = false; }
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.fontsize-picker-wrapper')) open = false;
	}

	$: if (open) {
		document.addEventListener('click', handleClickOutside, true);
		document.addEventListener('keydown', handleKeydown, true);
	} else {
		document.removeEventListener('click', handleClickOutside, true);
		document.removeEventListener('keydown', handleKeydown, true);
	}
</script>

<div class="fontsize-picker-wrapper relative">
	<button
		type="button"
		class="toolbar-select flex items-center justify-center"
		title="Lettergrootte"
		aria-label="Lettergrootte"
		aria-haspopup="listbox"
		aria-expanded={open}
		disabled={!editor}
		on:click={() => { open = !open; }}
	>
		<span class="text-[13px]">{activeSize}</span>
	</button>

	{#if open}
		<div
			class="absolute left-0 top-full z-20 mt-1 w-20 rounded-lg border border-gray-200 bg-white shadow-lg"
			role="listbox"
			aria-label="Lettergrootte kiezen"
		>
			<div class="border-b border-gray-100 p-1">
				<input
					type="text"
					class="w-full rounded border border-gray-300 px-2 py-1 text-center text-xs focus:border-blue-500 focus:outline-none"
					bind:value={inputValue}
					on:keydown={handleInputKeydown}
					placeholder="px"
					aria-label="Aangepaste lettergrootte"
				/>
			</div>
			<div class="max-h-48 overflow-y-auto py-1">
				{#each SIZES as size}
					<button
						type="button"
						role="option"
						aria-selected={activeSize === String(size)}
						class="menu-item w-full text-center"
						class:selected={activeSize === String(size)}
						on:click={() => applySize(String(size))}
					>{size}</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.toolbar-select {
		height: 2.25rem; width: 3.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem;
		padding: 0 0.25rem; font-size: 0.8125rem; color: #374151;
		background-color: white; cursor: pointer;
	}
	.toolbar-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
	.toolbar-select:disabled { opacity: 0.35; cursor: default; }
	.menu-item {
		display: block; padding: 0.25rem 0.5rem; font-size: 0.75rem;
		color: #374151; border: none; background: none; cursor: pointer;
	}
	.menu-item:hover { background-color: #f3f4f6; }
	.menu-item.selected { background-color: #dbeafe; color: #1d4ed8; }
</style>
