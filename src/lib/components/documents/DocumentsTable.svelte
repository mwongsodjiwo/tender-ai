<script lang="ts">
	import type { DataTableColumn } from '$lib/types/data-table.js';
	import DataTable from '$lib/components/DataTable.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_STYLES } from '$lib/types/enums/document.js';
	import type { DocumentStatus } from '$lib/types/enums/document.js';
	import type { DocumentRow } from './types.js';

	export let rows: DocumentRow[] = [];
	export let onRowClick: ((row: DocumentRow) => void) | null = null;
	export let onExport: ((id: string, format: 'docx' | 'pdf') => void) | null = null;
	export let exporting = '';

	const columns: DataTableColumn<DocumentRow>[] = [
		{ key: 'name', label: 'Naam', className: 'w-[40%]', accessor: (r) => r.name },
		{ key: 'type', label: 'Type', className: 'w-[12%]', accessor: (r) => r.type === 'document' ? 'Document' : 'Brief' },
		{ key: 'status', label: 'Status', className: 'w-[15%]' },
		{ key: 'date', label: 'Datum', className: 'w-[18%]', visibleFrom: 'lg', accessor: (r) => r.date ? formatDate(r.date) : '' },
		{ key: 'export', label: 'Exporteren', srOnly: true, className: 'w-[15%]' }
	];

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<DataTable {columns} {rows} {onRowClick} ariaLabel="Documenten overzicht" emptyIcon="table" emptyMessage="Geen documenten gevonden.">
	<svelte:fragment slot="cell" let:row let:column let:value>
		{#if column.key === 'name'}
			<span class="text-sm font-medium text-gray-900">{row.name}</span>
		{:else if column.key === 'type'}
			<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium
				{row.type === 'document' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}">
				{value}
			</span>
		{:else if column.key === 'status'}
			{#if row.type === 'document' && row.documentStatus}
				<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {DOCUMENT_STATUS_STYLES[row.documentStatus]}">{DOCUMENT_STATUS_LABELS[row.documentStatus]}</span>
			{:else if row.type === 'brief' && row.status}
				<StatusBadge status={row.status} />
			{:else}
				<span class="text-xs text-gray-400">—</span>
			{/if}
		{:else if column.key === 'date'}
			{#if row.date}
				<span class="text-sm text-gray-600">{value}</span>
			{:else}
				<span class="text-xs text-gray-400">Geen deadline</span>
			{/if}
		{:else if column.key === 'export'}
			{#if row.exportable && onExport}
				<div class="flex items-center justify-end gap-1.5">
					<button
						on:click|stopPropagation={() => onExport?.(row.id, 'docx')}
						disabled={exporting === `${row.id}-docx`}
						class="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{exporting === `${row.id}-docx` ? '...' : 'Word'}
					</button>
					<button
						on:click|stopPropagation={() => onExport?.(row.id, 'pdf')}
						disabled={exporting === `${row.id}-pdf`}
						class="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{exporting === `${row.id}-pdf` ? '...' : 'PDF'}
					</button>
				</div>
			{:else}
				<span class="text-xs text-gray-400">—</span>
			{/if}
		{:else}
			<span class="text-sm text-gray-600">{value}</span>
		{/if}
	</svelte:fragment>
</DataTable>
