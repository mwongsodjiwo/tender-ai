<script lang="ts">
	import { DOCUMENT_CATEGORY_LABELS } from '$types';
	import type { Document } from '$types';

	export let documents: Document[] = [];
	export let projectId: string;
	export let onDelete: (() => void) | undefined = undefined;

	let deleting = '';

	async function handleDelete(documentId: string, name: string): Promise<void> {
		if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen?`)) return;

		deleting = documentId;

		try {
			const response = await fetch(`/api/projects/${projectId}/uploads/${documentId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				onDelete?.();
			}
		} finally {
			deleting = '';
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	const FILE_ICONS: Record<string, string> = {
		'application/pdf': 'PDF',
		'application/msword': 'DOC',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
		'text/plain': 'TXT',
		'text/csv': 'CSV'
	};
</script>

{#if documents.length === 0}
	<div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
		<svg class="mx-auto h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
		</svg>
		<p class="mt-2 text-sm font-medium text-gray-900">Geen documenten</p>
		<p class="mt-1 text-sm text-gray-500">Upload documenten om de AI context te geven.</p>
	</div>
{:else}
	<ul class="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white transition hover:shadow-sm">
		{#each documents as doc}
			<li class="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
				<div class="flex items-center gap-4">
					<span class="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
						{FILE_ICONS[doc.mime_type] ?? 'DOC'}
					</span>
					<div>
						<p class="text-sm font-medium text-gray-900">{doc.name}</p>
						<div class="mt-0.5 flex gap-3 text-xs text-gray-500">
							<span>{DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}</span>
							<span>{formatFileSize(doc.file_size)}</span>
							<span>{formatDate(doc.created_at)}</span>
						</div>
					</div>
				</div>

				<button
					type="button"
					on:click={() => handleDelete(doc.id, doc.name)}
					disabled={deleting === doc.id}
					class="text-sm text-gray-500 hover:text-error-600 disabled:opacity-50"
					aria-label="Verwijder {doc.name}"
				>
					{#if deleting === doc.id}
						Verwijderen...
					{:else}
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
						</svg>
					{/if}
				</button>
			</li>
		{/each}
	</ul>
{/if}
