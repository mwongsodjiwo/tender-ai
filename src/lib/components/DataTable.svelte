<script lang="ts">
	import { onMount } from 'svelte';
	import type { DataTableColumn } from '$lib/types/data-table.js';

	type T = $$Generic<{ id: string }>;

	export let columns: DataTableColumn<T>[] = [];
	export let rows: T[] = [];
	export let onRowClick: ((row: T) => void) | null = null;
	export let ariaLabel = 'Data overzicht';
	export let emptyIcon = 'table';
	export let emptyMessage = 'Geen resultaten gevonden.';
	export let resizable = true;

	const MIN_COL_WIDTH = 60;

	let tableEl: HTMLTableElement;
	let colWidths: number[] = [];
	let resizingIndex = -1;
	let startX = 0;
	let startWidth = 0;
	let initialized = false;

	function initWidths(): void {
		if (!tableEl || initialized) return;
		const ths = tableEl.querySelectorAll('thead th');
		colWidths = Array.from(ths).map((th) => (th as HTMLElement).offsetWidth);
		initialized = true;
	}

	onMount(() => {
		requestAnimationFrame(initWidths);
	});

	$: if (columns && tableEl && !initialized) {
		requestAnimationFrame(initWidths);
	}

	function onResizeStart(index: number, event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();
		resizingIndex = index;
		startX = event.clientX;
		startWidth = colWidths[index];
		document.addEventListener('mousemove', onResizeMove);
		document.addEventListener('mouseup', onResizeEnd);
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}

	function onResizeMove(event: MouseEvent): void {
		if (resizingIndex < 0) return;
		const delta = event.clientX - startX;
		const newWidth = Math.max(MIN_COL_WIDTH, startWidth + delta);
		colWidths[resizingIndex] = newWidth;
		colWidths = [...colWidths];
	}

	function onResizeEnd(): void {
		resizingIndex = -1;
		document.removeEventListener('mousemove', onResizeMove);
		document.removeEventListener('mouseup', onResizeEnd);
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}

	function cellValue(row: T, col: DataTableColumn<T>): string {
		if (col.accessor) return col.accessor(row);
		const val = (row as Record<string, unknown>)[col.key];
		return val != null ? String(val) : '—';
	}

	function handleKeydown(event: KeyboardEvent, row: T): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onRowClick?.(row);
		}
	}

	function visibilityClass(col: DataTableColumn<T>): string {
		if (!col.visibleFrom) return '';
		return `hidden ${col.visibleFrom}:table-cell`;
	}

</script>

{#if rows.length === 0}
	<div class="px-5 py-12 text-center">
		{#if emptyIcon === 'people'}
			<svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
			</svg>
		{:else}
			<svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0-2.625c0 .621.504 1.125 1.125 1.125" />
			</svg>
		{/if}
		<p class="mt-2 text-sm text-gray-500">{emptyMessage}</p>
	</div>
{:else}
	<div style="overflow-x: clip">
		<table
			bind:this={tableEl}
			class="w-full table-fixed"
			role="grid"
			aria-label={ariaLabel}
		>
			{#if initialized && colWidths.length > 0}
				<colgroup>
					{#each columns as col, i (col.key)}
						<col style="width: {colWidths[i]}px" />
					{/each}
				</colgroup>
			{:else}
				<colgroup>
					{#each columns as col (col.key)}
						<col class={col.className ?? ''} />
					{/each}
				</colgroup>
			{/if}
			<thead class="sticky top-0 z-10 bg-gray-50">
				<tr class="border-b border-gray-200 bg-gray-50">
					{#each columns as col, i (col.key)}
						<th
							scope="col"
							class="relative px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-900 {visibilityClass(col)}"
						>
							{#if col.srOnly}
								<span class="sr-only">{col.label}</span>
							{:else}
								{col.label}
							{/if}
							{#if resizable && i < columns.length - 1}
								<!-- svelte-ignore a11y-no-static-element-interactions -->
								<div
									class="resize-handle"
									class:active={resizingIndex === i}
									on:mousedown={(e) => onResizeStart(i, e)}
								></div>
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each rows as row (row.id)}
					<tr
						class="group cursor-pointer transition-colors hover:bg-gray-50"
						tabindex="0"
						on:click={() => onRowClick?.(row)}
						on:keydown={(e) => handleKeydown(e, row)}
					>
						{#each columns as col, colIdx (col.key)}
							<td
								class="overflow-hidden text-ellipsis px-5 py-3.5 {visibilityClass(col)}"
							>
								<slot name="cell" {row} column={col} index={colIdx} value={cellValue(row, col)}>
									<span class="text-sm text-gray-600">{cellValue(row, col)}</span>
								</slot>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.resize-handle {
		position: absolute;
		top: 0;
		right: -3px;
		bottom: 0;
		width: 6px;
		cursor: col-resize;
		z-index: 1;
	}

	.resize-handle::after {
		content: '';
		position: absolute;
		top: 25%;
		bottom: 25%;
		left: 2px;
		width: 2px;
		border-radius: 1px;
		background: transparent;
		transition: background 150ms;
	}

	.resize-handle:hover::after,
	.resize-handle.active::after {
		background: #6366f1;
	}
</style>
