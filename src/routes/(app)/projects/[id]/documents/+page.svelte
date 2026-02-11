<script lang="ts">
	import type { PageData } from './$types';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

	export let data: PageData;

	$: project = data.project;
	$: productBlocks = data.productBlocks as {
		id: string;
		name: string;
		slug: string;
		description: string | null;
		items: { id: string; title: string; status: string }[];
		total: number;
		approved: number;
		progress: number;
	}[];
	$: emviCount = (data.emviCount ?? 0) as number;

	let exporting = '';

	function getProductHref(block: { slug: string; id: string }): string {
		if (block.slug === 'programma-van-eisen') {
			return `/projects/${project.id}/requirements`;
		}
		if (block.slug === 'conceptovereenkomst') {
			return `/projects/${project.id}/contract`;
		}
		if (block.slug === 'uniform-europees-aanbestedingsdocument') {
			return `/projects/${project.id}/uea`;
		}
		return `/projects/${project.id}/documents/${block.id}`;
	}

	function getProductButtonLabel(slug: string): string {
		if (slug === 'programma-van-eisen') return 'Eisen bewerken';
		if (slug === 'conceptovereenkomst') return 'Overeenkomst openen';
		if (slug === 'uniform-europees-aanbestedingsdocument') return 'UEA configureren';
		return 'Document openen';
	}

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

</script>

<svelte:head>
	<title>Documenten — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-8">
	<Breadcrumbs items={[
		{ label: project.name, href: `/projects/${project.id}` },
		{ label: 'Documenten' }
	]} />

	<div>
		<h1 class="text-2xl font-bold text-gray-900">Documenten</h1>
		<p class="mt-1 text-sm text-gray-500">Alle producten en documenten voor {project.name}</p>
	</div>

	<!-- Product cards grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each productBlocks as block}
			<div class="flex flex-col rounded-card bg-white shadow-card">
				<!-- Card body -->
				<div class="flex flex-1 flex-col p-5">
					<div class="flex items-start justify-between">
						<h3 class="text-base font-semibold text-gray-900">{block.name}</h3>
						{#if block.total > 0}
							<span class="ml-2 shrink-0 text-xs text-gray-400">{block.total} secties</span>
						{/if}
					</div>
					{#if block.description}
						<p class="mt-1 text-sm text-gray-500 line-clamp-2">{block.description}</p>
					{/if}

					<!-- Progress -->
					<div class="mt-auto pt-4">
						{#if block.total > 0}
							<ProgressBar value={block.approved} max={block.total} size="sm" label="" />
							<div class="mt-1 flex items-center justify-between text-xs text-gray-500">
								<span>{block.approved} van {block.total} goedgekeurd</span>
								<span class="font-medium text-primary-600">{block.progress}%</span>
							</div>
						{:else}
							<p class="text-xs text-gray-400">Nog geen secties gegenereerd</p>
						{/if}
					</div>
				</div>

				<!-- Card footer: actions -->
				<div class="flex items-center justify-between border-t border-gray-100 px-5 py-3">
					<a
						href={getProductHref(block)}
						class="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
					>
						{getProductButtonLabel(block.slug)}
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
					<div class="flex gap-1.5">
						<button
							on:click={() => handleExport(block.id, 'docx')}
							disabled={exporting === `${block.id}-docx` || block.total === 0}
							class="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
							title={block.total === 0 ? 'Geen secties om te exporteren' : 'Exporteer als Word'}
						>
							{exporting === `${block.id}-docx` ? '...' : 'Word'}
						</button>
						<button
							on:click={() => handleExport(block.id, 'pdf')}
							disabled={exporting === `${block.id}-pdf` || block.total === 0}
							class="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
							title={block.total === 0 ? 'Geen secties om te exporteren' : 'Exporteer als PDF'}
						>
							{exporting === `${block.id}-pdf` ? '...' : 'PDF'}
						</button>
					</div>
				</div>
			</div>
		{/each}

		<!-- EMVI product card -->
		<div class="flex flex-col rounded-card bg-white shadow-card">
			<div class="flex flex-1 flex-col p-5">
				<div class="flex items-start justify-between">
					<h3 class="text-base font-semibold text-gray-900">Gunningscriteria (EMVI)</h3>
					{#if emviCount > 0}
						<span class="ml-2 shrink-0 text-xs text-gray-400">{emviCount} criteria</span>
					{/if}
				</div>
				<p class="mt-1 text-sm text-gray-500 line-clamp-2">Gunningssystematiek en wegingscriteria</p>
				<div class="mt-auto pt-4">
					{#if emviCount > 0}
						<p class="text-xs text-gray-500">{emviCount} {emviCount === 1 ? 'criterium' : 'criteria'} geconfigureerd</p>
					{:else}
						<p class="text-xs text-gray-400">Nog geen criteria ingesteld</p>
					{/if}
				</div>
			</div>
			<div class="flex items-center justify-between border-t border-gray-100 px-5 py-3">
				<a
					href="/projects/{project.id}/emvi"
					class="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
				>
					Wegingstool openen
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</a>
				<div class="flex gap-1.5">
					<button
						disabled
						class="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
						title="Export beschikbaar vanuit de wegingstool"
					>
						Word
					</button>
					<button
						disabled
						class="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
						title="Export beschikbaar vanuit de wegingstool"
					>
						PDF
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
