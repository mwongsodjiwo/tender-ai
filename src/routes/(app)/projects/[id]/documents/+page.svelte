<script lang="ts">
	import type { PageData } from './$types';
	import ProgressBar from '$lib/components/ProgressBar.svelte';

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
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Documenten</h1>
		<p class="mt-1 text-sm text-gray-500">Alle producten en documenten voor {project.name}</p>
	</div>

	<!-- Documents table -->
	<div class="rounded-card bg-white shadow-card overflow-hidden">
		<table class="w-full">
			<thead>
				<tr class="border-b border-gray-200">
					<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Document</th>
					<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Secties</th>
					<th class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Voortgang</th>
					<th class="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Exporteren</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each productBlocks as block (block.id)}
					<tr class="group transition-colors hover:bg-gray-50">
						<td class="px-6 py-4">
							<a href={getProductHref(block)} class="block min-w-0">
								<span class="text-sm font-medium text-gray-900">{block.name}</span>
								{#if block.description}
									<p class="mt-0.5 truncate text-sm text-gray-500">{block.description}</p>
								{/if}
							</a>
						</td>
						<td class="px-6 py-4">
							<a href={getProductHref(block)} class="block">
								{#if block.total > 0}
									<span class="text-sm text-gray-700">{block.approved} / {block.total}</span>
								{:else}
									<span class="text-sm text-gray-400">-</span>
								{/if}
							</a>
						</td>
						<td class="px-6 py-4">
							<a href={getProductHref(block)} class="block">
								{#if block.total > 0}
									<div class="flex items-center gap-2">
										<div class="w-24">
											<ProgressBar value={block.approved} max={block.total} size="sm" label="" showPercentage={false} />
										</div>
										<span class="text-xs font-medium text-primary-600">{block.progress}%</span>
									</div>
								{:else}
									<span class="text-xs text-gray-400">Nog geen secties</span>
								{/if}
							</a>
						</td>
						<td class="px-6 py-4 text-right">
							<div class="flex items-center justify-end gap-1.5">
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
						</td>
					</tr>
				{/each}

				<!-- EMVI row -->
				<tr class="group transition-colors hover:bg-gray-50">
					<td class="px-6 py-4">
						<a href="/projects/{project.id}/emvi" class="block min-w-0">
							<span class="text-sm font-medium text-gray-900">Gunningscriteria (EMVI)</span>
							<p class="mt-0.5 truncate text-sm text-gray-500">Gunningssystematiek en wegingscriteria</p>
						</a>
					</td>
					<td class="px-6 py-4">
						<a href="/projects/{project.id}/emvi" class="block">
							{#if emviCount > 0}
								<span class="text-sm text-gray-700">{emviCount} {emviCount === 1 ? 'criterium' : 'criteria'}</span>
							{:else}
								<span class="text-sm text-gray-400">-</span>
							{/if}
						</a>
					</td>
					<td class="px-6 py-4">
						<a href="/projects/{project.id}/emvi" class="block">
							{#if emviCount > 0}
								<span class="text-xs text-gray-500">{emviCount} geconfigureerd</span>
							{:else}
								<span class="text-xs text-gray-400">Nog geen criteria</span>
							{/if}
						</a>
					</td>
					<td class="px-6 py-4 text-right">
						<div class="flex items-center justify-end gap-1.5">
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
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
