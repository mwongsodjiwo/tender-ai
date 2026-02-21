<script lang="ts">
	import type { Document } from '$types';
	import { DOCUMENT_CATEGORY_LABELS } from '$types';

	export let documents: Document[];
	export let projectId: string;
	export let onShowUpload: () => void;

	const MIME_TYPE_LABELS: Record<string, string> = {
		'application/pdf': 'PDF',
		'application/msword': 'DOC',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
		'application/vnd.ms-excel': 'XLS',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
		'text/plain': 'TXT',
		'text/csv': 'CSV'
	};

	function formatFileType(mimeType: string): string {
		return MIME_TYPE_LABELS[mimeType] ?? mimeType.split('/').pop()?.toUpperCase() ?? '—';
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<div class="rounded-card bg-white shadow-card">
	<div class="flex items-center justify-between border-b border-gray-100 px-6 pt-6 pb-4">
		<div class="flex items-center gap-3">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
				<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
				</svg>
			</div>
			<h2 class="text-base font-semibold text-gray-900">Documenten</h2>
		</div>
		<button type="button" on:click={onShowUpload}
			class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm hover:bg-primary-700 transition-colors"
			title="Document uploaden" aria-label="Document uploaden">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
		</button>
	</div>
	<div class="px-6 py-6">
		{#if documents.length === 0}
			<div class="text-center py-8">
				<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
				</svg>
				<p class="mt-2 text-sm text-gray-500">Nog geen documenten ge&uuml;pload.</p>
				<a href="/projects/{projectId}/documents"
					class="mt-4 inline-flex items-center rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
					Documenten bekijken
				</a>
			</div>
		{:else}
			<div class="rounded-lg overflow-hidden border border-gray-200">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-200">
							<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Categorie</th>
							<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Naam</th>
							<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Type</th>
							<th class="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Grootte</th>
							<th class="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Datum</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each documents as doc (doc.id)}
							<tr class="group transition-colors hover:bg-gray-50">
								<td class="px-6 py-4">
									<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
										{DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}
									</span>
								</td>
								<td class="px-6 py-4 max-w-[240px]">
									<span class="block truncate text-sm font-medium text-gray-900">{doc.name}</span>
								</td>
								<td class="px-6 py-4">
									<span class="text-sm text-gray-500">{formatFileType(doc.mime_type)}</span>
								</td>
								<td class="px-6 py-4 text-right">
									<span class="text-sm text-gray-500">{formatFileSize(doc.file_size)}</span>
								</td>
								<td class="px-6 py-4 text-right">
									<span class="text-sm text-gray-500">{formatDate(doc.created_at)}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
