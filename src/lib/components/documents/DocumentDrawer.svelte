<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import DocumentHistory from './DocumentHistory.svelte';
	import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_STYLES } from '$lib/types/enums/document.js';
	import { focusTrap } from '$lib/utils/focus-trap';
	import type { DocumentRow } from './types.js';

	export let document: DocumentRow | null = null;
	export let onClose: () => void = () => {};
	export let onArchive: (id: string) => Promise<void> = async () => {};
	export let onUnarchive: (id: string) => Promise<void> = async () => {};

	let archiving = false;
	let showConfirm = false;
	let archiveError = '';
	let restoring = false;

	async function confirmArchive(): Promise<void> {
		if (!document) return;
		archiving = true;
		archiveError = '';
		try {
			await onArchive(document.id);
		} catch {
			archiveError = 'Archivering mislukt. Probeer het opnieuw.';
			archiving = false;
			showConfirm = false;
		}
	}

	async function handleRestore(): Promise<void> {
		if (!document) return;
		restoring = true;
		archiveError = '';
		try {
			await onUnarchive(document.id);
		} catch {
			archiveError = 'Terugzetten mislukt. Probeer het opnieuw.';
		}
		restoring = false;
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	$: typeLabel = document?.type === 'document' ? 'Document' : 'Brief';
	$: if (document) { archiving = false; showConfirm = false; archiveError = ''; restoring = false; }
</script>

{#if document}
	<div class="fixed inset-0 z-40" role="dialog" tabindex="-1"
		aria-modal="true" aria-label="Details: {document.name}"
		on:keydown={(e) => { if (e.key === 'Escape') onClose(); }} use:focusTrap>
		<button type="button" class="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px]"
			transition:fly={{ duration: 250, opacity: 0 }}
			on:click={onClose} aria-label="Sluiten" tabindex="-1"></button>

		<div class="absolute right-0 top-0 bottom-0 z-10 flex w-[30vw] min-w-[360px] flex-col overflow-y-auto rounded-l-2xl bg-white shadow-2xl"
			transition:fly={{ x: 400, duration: 350, easing: cubicOut }}>
			<div class="sticky top-0 z-10 flex items-center justify-between rounded-tl-2xl border-b border-gray-100 bg-white px-6 py-5">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">{typeLabel} details</h2>
				<button type="button" on:click={onClose}
					class="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-600"
					aria-label="Sluiten">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="flex-1 p-6">
				<h3 class="text-lg font-semibold text-gray-900">{document.name}</h3>
				<div class="mt-3 flex items-center gap-2">
					<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium
						{document.type === 'document' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}">
						{typeLabel}
					</span>
					{#if document.archived}
						<span class="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Gearchiveerd</span>
					{/if}
					{#if document.status}<StatusBadge status={document.status} />{/if}
				</div>
				<hr class="my-6 border-gray-100" />

				<div class="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
					<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Omschrijving</h4>
					<p class="mt-2 text-sm leading-relaxed text-gray-600">
						{document.subtitle ?? 'Geen beschrijving beschikbaar.'}
					</p>
				</div>

				{#if document.type === 'document' && document.documentStatus}
					<div class="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
						<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</h4>
						<div class="mt-3">
							<span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {DOCUMENT_STATUS_STYLES[document.documentStatus]}">{DOCUMENT_STATUS_LABELS[document.documentStatus]}</span>
						</div>
					</div>
				{/if}

				{#if document.type === 'brief'}
					<div class="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
						<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</h4>
						<div class="mt-2">
							{#if document.status}<StatusBadge status={document.status} />
							{:else}<span class="text-sm text-gray-500">Geen status</span>{/if}
						</div>
					</div>
				{/if}

				<div class="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
					<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Toegewezen aan</h4>
					{#if document.assignees && document.assignees.length > 0}
						<div class="mt-3 space-y-2">
							{#each document.assignees as person}
								<div class="flex items-center gap-2.5">
									<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
										{person.name.charAt(0).toUpperCase()}
									</span>
									<div class="min-w-0">
										<p class="text-sm font-medium text-gray-900 truncate">{person.name}</p>
										<p class="text-xs text-gray-500 truncate">{person.email}</p>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="mt-2 text-sm text-gray-400">Nog niemand toegewezen</p>
					{/if}
				</div>

				{#if document.deadline}
					<div class="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
						<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Deadline</h4>
						<p class="mt-2 text-sm text-gray-600">{formatDate(document.deadline)}</p>
					</div>
				{/if}

				<DocumentHistory entries={document.history ?? []} />

				{#if archiveError}
					<div class="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{archiveError}</div>
				{/if}
			</div>

			<div class="sticky bottom-0 border-t border-gray-100 bg-white px-6 py-4">
				{#if document.archived}
					<div class="flex items-center gap-3">
						<button type="button" on:click={handleRestore} disabled={restoring}
							class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-40">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
							</svg>
							{restoring ? 'Bezig...' : 'Terugzetten'}
						</button>
						<a href={document.href}
							class="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700">
							Naar {typeLabel.toLowerCase()}
						</a>
					</div>
				{:else if showConfirm}
					<div class="flex items-center gap-3">
						<span class="text-sm text-gray-700">Weet u zeker dat u dit wilt archiveren?</span>
						<button type="button" on:click={confirmArchive} disabled={archiving}
							class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40">
							{archiving ? 'Bezig...' : 'Ja, archiveer'}
						</button>
						<button type="button" on:click={() => (showConfirm = false)} disabled={archiving}
							class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">
							Annuleren
						</button>
					</div>
				{:else}
					<div class="flex items-center gap-3">
						<button type="button" on:click={() => { showConfirm = true; archiveError = ''; }}
							class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
							</svg>
							Archiveren
						</button>
						<a href={document.href}
							class="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700">
							Naar {typeLabel.toLowerCase()}
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
