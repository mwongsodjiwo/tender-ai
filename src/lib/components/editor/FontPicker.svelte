<script lang="ts">
	import type { Editor } from '@tiptap/core';

	export let editor: Editor | null = null;

	let open = false;

	const FONT_GROUPS = [
		{
			label: 'Sans-serif',
			fonts: ['Inter', 'Roboto', 'Open Sans', 'Arial', 'Helvetica']
		},
		{
			label: 'Serif',
			fonts: ['Merriweather', 'Lora', 'Georgia', 'Times New Roman']
		},
		{
			label: 'Monospace',
			fonts: ['JetBrains Mono', 'Fira Code', 'Courier New']
		}
	];

	$: activeFont = editor?.getAttributes('textStyle').fontFamily as string ?? '';
	$: displayFont = activeFont || 'Standaard';

	function selectFont(font: string) {
		if (!editor) return;
		if (font === '') editor.chain().focus().unsetFontFamily().run();
		else editor.chain().focus().setFontFamily(font).run();
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.font-picker-wrapper')) open = false;
	}

	$: if (open) {
		document.addEventListener('click', handleClickOutside, true);
		document.addEventListener('keydown', handleKeydown, true);
	} else {
		document.removeEventListener('click', handleClickOutside, true);
		document.removeEventListener('keydown', handleKeydown, true);
	}
</script>

<div class="font-picker-wrapper relative">
	<button
		type="button"
		class="toolbar-select flex items-center gap-1 truncate"
		style:font-family={activeFont || 'inherit'}
		title="Lettertype"
		aria-label="Lettertype"
		aria-haspopup="listbox"
		aria-expanded={open}
		disabled={!editor}
		on:click={() => { open = !open; }}
	>
		<span class="max-w-[7rem] truncate text-[13px]">{displayFont}</span>
	</button>

	{#if open}
		<div
			class="absolute left-0 top-full z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
			role="listbox"
			aria-label="Lettertype kiezen"
		>
			<button
				type="button"
				role="option"
				aria-selected={activeFont === ''}
				class="menu-item w-full text-left"
				class:selected={activeFont === ''}
				on:click={() => selectFont('')}
			>Standaard</button>

			{#each FONT_GROUPS as group}
				<div class="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
					{group.label}
				</div>
				{#each group.fonts as font}
					<button
						type="button"
						role="option"
						aria-selected={activeFont === font}
						class="menu-item w-full text-left"
						class:selected={activeFont === font}
						style:font-family="'{font}', {group.label.toLowerCase()}"
						on:click={() => selectFont(font)}
					>{font}</button>
				{/each}
			{/each}
		</div>
	{/if}
</div>

<style>
	.toolbar-select {
		height: 2.25rem; border: 1px solid #d1d5db; border-radius: 0.5rem;
		padding: 0 0.75rem; font-size: 0.8125rem; color: #374151;
		background-color: white; cursor: pointer;
	}
	.toolbar-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
	.toolbar-select:disabled { opacity: 0.35; cursor: default; }
	.menu-item {
		display: block; padding: 0.375rem 0.75rem; font-size: 0.8125rem;
		color: #374151; border: none; background: none; cursor: pointer;
	}
	.menu-item:hover { background-color: #f3f4f6; }
	.menu-item.selected { background-color: #dbeafe; color: #1d4ed8; }
</style>
