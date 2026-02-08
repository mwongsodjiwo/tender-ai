<script lang="ts">
	import type { PageData } from './$types';
	import type { Document } from '$types';
	import DocumentUpload from '$components/DocumentUpload.svelte';
	import DocumentList from '$components/DocumentList.svelte';
	import DocumentCard from '$lib/components/DocumentCard.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';

	export let data: PageData;

	$: project = data.project;
	$: artifacts = data.artifacts;
	$: documentBlocks = data.documentBlocks as {
		docType: { id: string; name: string; slug: string };
		items: typeof artifacts;
		total: number;
		approved: number;
		progress: number;
	}[];
	$: uploadedDocuments = (data.uploadedDocuments ?? []) as Document[];

	let exporting = '';

	async function handleExport(docTypeId: string, format: 'docx' | 'pdf') {
		exporting = `${docTypeId}-${format}`;
		const response = await fetch(`/api/projects/${project.id}/export`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ document_type_id: docTypeId, format })
		});
		if (response.ok) {
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const disposition = response.headers.get('Content-Disposition') ?? '';
			const filenameMatch = disposition.match(/filename="(.+)"/);
			const filename = filenameMatch?.[1] ?? `document.${format}`;
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		}
		exporting = '';
	}

	function reloadUploads(): void {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Documenten — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-8">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Documenten</h1>
		<p class="mt-1 text-sm text-gray-500">Gegenereerde documenten en uploads voor {project.name}</p>
	</div>

	<!-- Generated documents by type -->
	{#if artifacts.length === 0}
		<div class="rounded-card border-2 border-dashed border-gray-300 p-12 text-center">
			{#if project.status === 'generating'}
				<svg class="mx-auto h-10 w-10 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24" aria-hidden="true">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
				</svg>
				<h3 class="mt-3 text-sm font-semibold text-gray-900">Documenten worden gegenereerd...</h3>
				<p class="mt-1 text-sm text-gray-500">Dit kan enkele minuten duren.</p>
			{:else}
				<h3 class="text-sm font-semibold text-gray-900">Nog geen documentsecties</h3>
				<p class="mt-1 text-sm text-gray-500">Voltooi eerst de briefing om documenten te laten genereren.</p>
			{/if}
		</div>
	{:else}
		<div class="space-y-6">
			{#each documentBlocks as block}
				<section aria-labelledby="doctype-{block.docType.id}" class="space-y-4">
					<header class="flex items-center justify-between">
						<h3 id="doctype-{block.docType.id}" class="text-base font-semibold text-gray-900">
							{block.docType.name}
							<span class="ml-2 text-sm font-normal text-gray-400">{block.approved}/{block.total} goedgekeurd</span>
						</h3>
						<div class="flex gap-2">
							<button
								on:click={() => handleExport(block.docType.id, 'docx')}
								disabled={exporting === `${block.docType.id}-docx`}
								class="rounded-badge border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								{exporting === `${block.docType.id}-docx` ? 'Bezig...' : 'Word'}
							</button>
							<button
								on:click={() => handleExport(block.docType.id, 'pdf')}
								disabled={exporting === `${block.docType.id}-pdf`}
								class="rounded-badge border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
							>
								{exporting === `${block.docType.id}-pdf` ? 'Bezig...' : 'PDF'}
							</button>
						</div>
					</header>
					<CardGrid columns={3}>
						{#each block.items as artifact}
							<DocumentCard {artifact} projectId={project.id} />
						{/each}
					</CardGrid>
				</section>
			{/each}
		</div>
	{/if}

	<!-- Uploaded documents -->
	<section>
		<h2 class="mb-4 text-lg font-semibold text-gray-900">Uploads</h2>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="lg:col-span-2">
				<DocumentList
					documents={uploadedDocuments}
					projectId={project.id}
					onDelete={reloadUploads}
				/>
			</div>
			<div>
				<DocumentUpload
					projectId={project.id}
					organizationId={project.organization_id}
					onUploadComplete={reloadUploads}
				/>
			</div>
		</div>
	</section>
</div>
