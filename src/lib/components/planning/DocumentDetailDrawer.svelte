<!--
  DocumentDetailDrawer — editable right-side drawer for planning documents.
  30% screen width, rounded corners, smooth slide-in transition.
-->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { focusTrap } from '$lib/utils/focus-trap';

	export let document: {
		id: string;
		name: string;
		slug: string;
		description: string | null;
		status: string;
		phase: string;
		deadline: string | null;
		daysRemaining: number | null;
		total: number;
		approved: number;
		progress: number;
		assignedTo: string | null;
	} | null = null;

	export let projectId: string;
	export let members: { profile_id: string; profile: { first_name?: string; last_name?: string } | null }[] = [];
	export let activities: { id: string; title: string; status: string }[] = [];
	export let onClose: () => void = () => {};
	export let onSave: (docId: string, deadline: string | null, assignedTo: string | null) => void = () => {};

	let editDeadline: string = '';
	let editAssignedTo: string = '';

	$: if (document) {
		editDeadline = document.deadline ?? '';
		editAssignedTo = document.assignedTo ?? '';
	}

	$: hasChanges = document
		? (editDeadline !== (document.deadline ?? ''))
			|| (editAssignedTo !== (document.assignedTo ?? ''))
		: false;

	function getDaysColor(days: number | null): string {
		if (days === null) return 'text-gray-500';
		if (days < 0) return 'text-red-500';
		if (days <= 7) return 'text-orange-500';
		return 'text-green-500';
	}

	function getDaysLabel(days: number | null): string {
		if (days === null) return '';
		if (days < 0) return `${Math.abs(days)} dagen`;
		if (days === 0) return 'Vandaag';
		return `${days} dagen`;
	}

	function getDaysSubLabel(days: number | null): string {
		if (days === null) return 'Geen deadline';
		if (days < 0) return 'verlopen';
		if (days === 0) return 'is de deadline';
		return 'tot deadline';
	}

	function getDocumentHref(): string {
		if (!document) return '#';
		if (document.slug === 'programma-van-eisen') {
			return `/projects/${projectId}/requirements`;
		}
		if (document.slug === 'conceptovereenkomst') {
			return `/projects/${projectId}/contract`;
		}
		if (document.slug === 'uniform-europees-aanbestedingsdocument') {
			return `/projects/${projectId}/uea`;
		}
		return `/projects/${projectId}/documents/${document.id}`;
	}

	function handleSave(): void {
		if (!document) return;
		onSave(
			document.id,
			editDeadline || null,
			editAssignedTo || null
		);
	}

	function getMemberName(member: { profile: { first_name?: string; last_name?: string } | null }): string {
		if (!member.profile) return 'Onbekend';
		return `${member.profile.first_name ?? ''} ${member.profile.last_name ?? ''}`.trim() || 'Onbekend';
	}
</script>

{#if document}
	<div
		class="fixed inset-0 z-40"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label="Document details: {document.name}"
		on:keydown={(e) => { if (e.key === 'Escape') onClose(); }}
		use:focusTrap
	>
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px]"
			transition:fly={{ duration: 250, opacity: 0 }}
			on:click={onClose}
			aria-label="Sluiten"
			tabindex="-1"
		></button>

		<!-- Panel — 30% width, rounded left corners, slide from right -->
		<div
			class="absolute right-0 top-0 bottom-0 z-10 flex w-[30vw] min-w-[360px] flex-col overflow-y-auto rounded-l-2xl bg-white shadow-2xl"
			transition:fly={{ x: 400, duration: 350, easing: cubicOut }}
		>
			<!-- Header -->
			<div class="sticky top-0 z-10 flex items-center justify-between rounded-tl-2xl border-b border-gray-100 bg-white px-6 py-5">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">
					{document.name}
				</h2>
				<button
					type="button"
					on:click={onClose}
					class="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-600"
					aria-label="Sluiten"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Body -->
			<div class="flex-1 p-6">
				<!-- Days until deadline -->
				<div class="text-center">
					{#if document.daysRemaining !== null}
						<p class="text-5xl font-semibold {getDaysColor(document.daysRemaining)}">
							{getDaysLabel(document.daysRemaining)}
						</p>
						<p class="mt-1 text-sm text-gray-500">
							{getDaysSubLabel(document.daysRemaining)}
						</p>
					{:else}
						<p class="text-lg font-medium text-gray-300">Geen deadline</p>
					{/if}
				</div>

				<!-- Status -->
				<div class="mt-4 flex justify-center">
					<StatusBadge status={document.status} />
				</div>

				<hr class="my-6 border-gray-100" />

				<!-- Omschrijving -->
				<div class="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
					<h3 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
						Omschrijving
					</h3>
					<p class="mt-2 text-sm leading-relaxed text-gray-600">
						{document.description ?? 'Geen beschrijving beschikbaar.'}
					</p>
				</div>

				<!-- Toegewezen aan — editable -->
				<div class="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
					<label for="drawer-assigned-to" class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
						Toegewezen aan
					</label>
					<select
						id="drawer-assigned-to"
						bind:value={editAssignedTo}
						class="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
					>
						<option value="">Niemand</option>
						{#each members as member (member.profile_id)}
							<option value={member.profile_id}>
								{getMemberName(member)}
							</option>
						{/each}
					</select>
				</div>

				<!-- Deadline — editable -->
				<div class="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
					<label for="drawer-deadline" class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
						Deadline
					</label>
					<input
						id="drawer-deadline"
						type="date"
						bind:value={editDeadline}
						class="mt-2 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
					/>
				</div>

				<!-- Activiteiten -->
				<div class="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
					<h3 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
						Activiteiten
					</h3>
					{#if activities.length > 0}
						<ul class="mt-2 space-y-2">
							{#each activities as activity (activity.id)}
								<li class="flex items-center justify-between text-sm">
									<span class="text-gray-600">{activity.title}</span>
									<StatusBadge status={activity.status} />
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-2 text-sm text-gray-500">Geen activiteiten gekoppeld.</p>
					{/if}
				</div>
			</div>

			<!-- Footer — sticky action buttons -->
			<div class="sticky bottom-0 border-t border-gray-100 bg-white px-6 py-4">
				<div class="flex items-center gap-3">
					{#if hasChanges}
						<button
							type="button"
							on:click={handleSave}
							class="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
						>
							Opslaan
						</button>
					{/if}
					<a
						href={getDocumentHref()}
						class="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
					>
						Naar document
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}
