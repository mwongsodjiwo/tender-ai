<script lang="ts">
	import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_CATEGORIES, type DocumentCategory } from '$types';

	export let projectId: string;
	export let organizationId: string;
	export let onUploadComplete: (() => void) | undefined = undefined;

	let files: FileList | null = null;
	let category: DocumentCategory = 'reference';
	let uploading = false;
	let error = '';
	let success = '';
	let dragOver = false;

	const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.xlsx,.txt,.csv';
	const MAX_FILE_SIZE_MB = 50;

	async function handleUpload(): Promise<void> {
		if (!files || files.length === 0) {
			error = 'Selecteer een bestand om te uploaden';
			return;
		}

		const file = files[0];

		if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
			error = `Bestand is te groot. Maximaal ${MAX_FILE_SIZE_MB} MB toegestaan.`;
			return;
		}

		uploading = true;
		error = '';
		success = '';

		const formData = new FormData();
		formData.append('file', file);
		formData.append('organization_id', organizationId);
		formData.append('project_id', projectId);
		formData.append('category', category);
		formData.append('name', file.name);

		try {
			const response = await fetch(`/api/projects/${projectId}/uploads`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const data = await response.json();
				error = data.message ?? 'Fout bij uploaden van bestand';
				return;
			}

			success = `${file.name} is succesvol geüpload`;
			files = null;

			// Reset the file input
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			if (fileInput) fileInput.value = '';

			onUploadComplete?.();
		} catch {
			error = 'Netwerkfout bij uploaden';
		} finally {
			uploading = false;
		}
	}

	function handleDrop(event: DragEvent): void {
		event.preventDefault();
		dragOver = false;
		if (event.dataTransfer?.files) {
			files = event.dataTransfer.files;
		}
	}

	function handleDragOver(event: DragEvent): void {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(): void {
		dragOver = false;
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-sm">
	<h3 class="text-base font-semibold text-gray-900">Document uploaden</h3>
	<p class="mt-1 text-sm text-gray-500">
		Upload beleidsdocumenten, bestekken of referenties. De AI gebruikt deze als context bij het genereren.
	</p>

	<!-- Drop zone -->
	<div
		class="mt-4 flex justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors
			{dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300'}"
		role="button"
		tabindex="0"
		on:drop={handleDrop}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:keydown={(e) => { if (e.key === 'Enter') document.querySelector('input[type="file"]')?.click(); }}
		aria-label="Sleep een bestand hierheen of klik om te selecteren"
	>
		<div class="text-center">
			<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
			</svg>
			<div class="mt-4 flex text-sm leading-6 text-gray-600">
				<label
					for="file-upload"
					class="relative cursor-pointer rounded-md font-semibold text-primary-600 hover:text-primary-500"
				>
					<span>Kies een bestand</span>
					<input
						id="file-upload"
						name="file-upload"
						type="file"
						class="sr-only"
						accept={ALLOWED_EXTENSIONS}
						bind:files
					/>
				</label>
				<p class="pl-1">of sleep het hierheen</p>
			</div>
			<p class="text-xs leading-5 text-gray-500">PDF, Word, Excel, TXT of CSV — max {MAX_FILE_SIZE_MB} MB</p>
		</div>
	</div>

	<!-- Selected file info -->
	{#if files && files.length > 0}
		<div class="mt-3 rounded-md bg-gray-50 px-4 py-3">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-900">{files[0].name}</p>
					<p class="text-xs text-gray-500">{formatFileSize(files[0].size)}</p>
				</div>
				<button
					type="button"
					class="text-sm text-gray-400 hover:text-gray-600"
					on:click={() => { files = null; }}
					aria-label="Bestand verwijderen"
				>
					&times;
				</button>
			</div>
		</div>
	{/if}

	<!-- Category selector -->
	<div class="mt-4">
		<label for="category" class="block text-sm font-medium text-gray-700">Categorie</label>
		<select
			id="category"
			bind:value={category}
			class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
		>
			{#each DOCUMENT_CATEGORIES.filter(c => c !== 'tenderned') as cat}
				<option value={cat}>{DOCUMENT_CATEGORY_LABELS[cat]}</option>
			{/each}
		</select>
	</div>

	<!-- Upload button -->
	<div class="mt-4">
		<button
			type="button"
			on:click={handleUpload}
			disabled={uploading || !files || files.length === 0}
			class="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if uploading}
				<svg class="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
				Bezig met uploaden...
			{:else}
				Uploaden
			{/if}
		</button>
	</div>

	<!-- Feedback messages -->
	{#if error}
		<div class="mt-3 rounded-md bg-red-50 px-4 py-3" role="alert">
			<p class="text-sm text-red-700">{error}</p>
		</div>
	{/if}

	{#if success}
		<div class="mt-3 rounded-md bg-green-50 px-4 py-3" role="status">
			<p class="text-sm text-green-700">{success}</p>
		</div>
	{/if}
</div>
