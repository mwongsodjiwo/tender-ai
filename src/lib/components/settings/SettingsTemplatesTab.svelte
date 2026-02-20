<!-- Template management component: upload, list, default marking, download -->
<script lang="ts">
	import type { DocumentTemplate, DocumentType } from '$types';
	import { CPV_CATEGORY_TYPE_LABELS } from '$types';

	export let templates: DocumentTemplate[] = [];
	export let documentTypes: Pick<DocumentType, 'id' | 'name' | 'slug'>[] = [];
	export let organizationId: string;
	export let canEdit = false;
	export let onUpload: (formData: FormData) => Promise<void> = async () => {};
	export let onDelete: (id: string) => Promise<void> = async () => {};
	export let onSetDefault: (id: string) => Promise<void> = async () => {};
	export let onDownload: (id: string) => void = () => {};

	let selectedDocTypeId = '';
	let templateName = '';
	let templateDescription = '';
	let isDefault = false;
	let fileInput: HTMLInputElement;
	let uploading = false;

	async function handleUpload(): Promise<void> {
		if (!fileInput?.files?.[0] || !selectedDocTypeId || !templateName) return;
		uploading = true;
		const formData = new FormData();
		formData.append('file', fileInput.files[0]);
		formData.append('metadata', JSON.stringify({
			organization_id: organizationId,
			document_type_id: selectedDocTypeId,
			name: templateName,
			description: templateDescription || null,
			is_default: isDefault
		}));
		await onUpload(formData);
		resetForm();
		uploading = false;
	}

	function resetForm(): void {
		selectedDocTypeId = '';
		templateName = '';
		templateDescription = '';
		isDefault = false;
		if (fileInput) fileInput.value = '';
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function getDocTypeName(template: DocumentTemplate): string {
		const raw = (template as Record<string, unknown>).document_types;
		const dt = (Array.isArray(raw) ? raw[0] : raw) as { name: string } | null;
		return dt?.name ?? 'Onbekend';
	}
</script>

<div class="space-y-6">
	{#if canEdit}
		<form on:submit|preventDefault={handleUpload} class="rounded-card border p-4 space-y-4">
			<h3 class="text-sm font-semibold text-gray-900">Sjabloon uploaden</h3>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="tpl-name" class="block text-sm font-medium text-gray-700">Naam</label>
					<input id="tpl-name" type="text" bind:value={templateName} required
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
						placeholder="Bijv. Aanbestedingsleidraad standaard" />
				</div>
				<div>
					<label for="tpl-doctype" class="block text-sm font-medium text-gray-700">Documenttype</label>
					<select id="tpl-doctype" bind:value={selectedDocTypeId} required
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
						<option value="">Selecteer documenttype</option>
						{#each documentTypes as dt (dt.id)}
							<option value={dt.id}>{dt.name}</option>
						{/each}
					</select>
				</div>
			</div>
			<div>
				<label for="tpl-desc" class="block text-sm font-medium text-gray-700">Beschrijving (optioneel)</label>
				<input id="tpl-desc" type="text" bind:value={templateDescription}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
			</div>
			<div class="flex items-center gap-4">
				<div>
					<label for="tpl-file" class="block text-sm font-medium text-gray-700">Bestand (.docx)</label>
					<input id="tpl-file" type="file" accept=".docx" bind:this={fileInput} required
						class="mt-1 block text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100" />
				</div>
				<label class="flex items-center gap-2 mt-5">
					<input type="checkbox" bind:checked={isDefault} class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
					<span class="text-sm text-gray-700">Standaard sjabloon</span>
				</label>
			</div>
			<button type="submit" disabled={uploading || !templateName || !selectedDocTypeId}
				class="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50">
				{uploading ? 'Uploaden...' : 'Uploaden'}
			</button>
		</form>
	{/if}

	{#if templates.length === 0}
		<div class="rounded-card border-2 border-dashed border-gray-300 p-8 text-center">
			<p class="text-sm text-gray-500">Nog geen sjablonen geüpload.</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-card border">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Naam</th>
						<th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Documenttype</th>
						<th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Categorie</th>
						<th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Grootte</th>
						<th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Standaard</th>
						<th scope="col" class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Acties</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each templates as template (template.id)}
						<tr>
							<td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
								{template.name}
								{#if template.description}
									<p class="text-xs text-gray-500">{template.description}</p>
								{/if}
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{getDocTypeName(template)}</td>
							<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
								{template.category_type ? CPV_CATEGORY_TYPE_LABELS[template.category_type] : '—'}
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatFileSize(template.file_size)}</td>
							<td class="whitespace-nowrap px-4 py-3 text-sm">
								{#if template.is_default}
									<span class="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Standaard</span>
								{:else if canEdit}
									<button on:click={() => onSetDefault(template.id)} class="text-xs text-primary-600 hover:text-primary-800">
										Maak standaard
									</button>
								{/if}
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-right text-sm">
								<button on:click={() => onDownload(template.id)}
									class="text-primary-600 hover:text-primary-800 mr-2" aria-label="Download {template.name}">
									Download
								</button>
								{#if canEdit}
									<button on:click={() => onDelete(template.id)}
										class="text-red-600 hover:text-red-800" aria-label="Verwijder {template.name}">
										Verwijderen
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
