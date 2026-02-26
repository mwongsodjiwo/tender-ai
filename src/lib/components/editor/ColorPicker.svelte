<script lang="ts">
	import type { Editor } from '@tiptap/core';

	export let editor: Editor | null = null;

	let activePanel: 'text' | 'highlight' | null = null;

	const COLORS = [
		{ value: '#000000', label: 'Zwart' },
		{ value: '#4b5563', label: 'Donkergrijs' },
		{ value: '#dc2626', label: 'Rood' },
		{ value: '#ea580c', label: 'Oranje' },
		{ value: '#eab308', label: 'Geel' },
		{ value: '#16a34a', label: 'Groen' },
		{ value: '#2563eb', label: 'Blauw' },
		{ value: '#7c3aed', label: 'Paars' },
		{ value: '#ec4899', label: 'Roze' },
		{ value: '#ffffff', label: 'Wit' }
	];

	$: activeTextColor = (editor?.getAttributes('textStyle').color as string) ?? '#000000';
	$: activeHighlight = (editor?.getAttributes('highlight').color as string) ?? '';

	function setTextColor(color: string | null) {
		if (!editor) return;
		if (color === null) editor.chain().focus().unsetColor().run();
		else editor.chain().focus().setColor(color).run();
		activePanel = null;
	}

	function setHighlight(color: string | null) {
		if (!editor) return;
		if (color === null) editor.chain().focus().unsetHighlight().run();
		else editor.chain().focus().toggleHighlight({ color }).run();
		activePanel = null;
	}

	function togglePanel(panel: 'text' | 'highlight') {
		activePanel = activePanel === panel ? null : panel;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') activePanel = null;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.color-picker-wrapper')) activePanel = null;
	}

	$: if (activePanel) {
		document.addEventListener('click', handleClickOutside, true);
		document.addEventListener('keydown', handleKeydown, true);
	} else {
		document.removeEventListener('click', handleClickOutside, true);
		document.removeEventListener('keydown', handleKeydown, true);
	}
</script>

<div class="color-picker-wrapper relative flex items-center gap-0.5">
	<!-- Text color button -->
	<button
		type="button"
		class="toolbar-btn relative"
		class:active={activePanel === 'text'}
		title="Tekstkleur"
		aria-label="Tekstkleur"
		aria-haspopup="true"
		aria-expanded={activePanel === 'text'}
		disabled={!editor}
		on:click={() => togglePanel('text')}
	>
		<span class="text-sm font-bold">A</span>
		<span class="absolute bottom-1.5 left-1/2 h-0.5 w-3.5 -translate-x-1/2 rounded-full" style:background-color={activeTextColor}></span>
	</button>

	<!-- Highlight color button -->
	<button
		type="button"
		class="toolbar-btn"
		class:active={activePanel === 'highlight'}
		title="Markeerkleur"
		aria-label="Markeerkleur"
		aria-haspopup="true"
		aria-expanded={activePanel === 'highlight'}
		disabled={!editor}
		on:click={() => togglePanel('highlight')}
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
				d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
		</svg>
		{#if activeHighlight}
			<span class="absolute bottom-1.5 left-1/2 h-0.5 w-3.5 -translate-x-1/2 rounded-full" style:background-color={activeHighlight}></span>
		{/if}
	</button>

	<!-- Color palette popover -->
	{#if activePanel}
		<div
			class="absolute left-0 top-full z-20 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
			role="listbox"
			aria-label={activePanel === 'text' ? 'Tekstkleur kiezen' : 'Markeerkleur kiezen'}
		>
			<div class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
				{activePanel === 'text' ? 'Tekstkleur' : 'Markeerkleur'}
			</div>
			<div class="grid grid-cols-5 gap-1">
				{#each COLORS as color}
					<button
						type="button"
						role="option"
						aria-label={color.label}
						aria-selected={activePanel === 'text' ? activeTextColor === color.value : activeHighlight === color.value}
						class="color-swatch"
						class:ring-2={activePanel === 'text' ? activeTextColor === color.value : activeHighlight === color.value}
						class:ring-blue-500={true}
						style:background-color={color.value}
						on:click={() => activePanel === 'text' ? setTextColor(color.value) : setHighlight(color.value)}
					></button>
				{/each}
			</div>
			<button
				type="button"
				class="mt-1.5 w-full rounded px-2 py-1 text-left text-xs text-gray-500 hover:bg-gray-100"
				on:click={() => activePanel === 'text' ? setTextColor(null) : setHighlight(null)}
			>Geen kleur</button>
		</div>
	{/if}
</div>

<style>
	.toolbar-btn {
		display: inline-flex; align-items: center; justify-content: center;
		width: 2.25rem; height: 2.25rem; border-radius: 0.375rem;
		color: #4b5563; transition: all 0.1s;
	}
	.toolbar-btn:hover:not(:disabled) { background-color: #f3f4f6; color: #111827; }
	.toolbar-btn:disabled { opacity: 0.35; cursor: default; }
	.toolbar-btn.active { background-color: #dbeafe; color: #1d4ed8; }
	.color-swatch {
		width: 1.5rem; height: 1.5rem; border-radius: 0.25rem;
		border: 1px solid #d1d5db; cursor: pointer; transition: transform 0.1s;
	}
	.color-swatch:hover { transform: scale(1.15); }
</style>
