<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import { PROJECT_PHASE_LABELS } from '$types';
	import type { CorrespondenceStatus } from '$types';

	export let letterTitle: string;
	export let status: CorrespondenceStatus;
	export let phase: string;
	export let sentAt: string | null;
	export let saveError: string;
	export let saveMessage: string;
	export let isEditable: boolean;
	export let saving: boolean;
	export let updatingStatus: boolean;

	const dispatch = createEventDispatcher<{ save: void; updateStatus: void }>();

	type StatusAction = {
		label: string;
		newStatus: CorrespondenceStatus;
		extraFields?: Record<string, string>;
	};

	$: nextStatusAction = getNextStatusAction(status);

	function getNextStatusAction(s: CorrespondenceStatus): StatusAction | null {
		switch (s) {
			case 'draft':
				return { label: 'Markeer als gereed', newStatus: 'ready' };
			case 'ready':
				return { label: 'Markeer als verzonden', newStatus: 'sent', extraFields: { sent_at: new Date().toISOString() } };
			case 'sent':
				return { label: 'Archiveren', newStatus: 'archived' };
			default:
				return null;
		}
	}
</script>

<header class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6">
	<div class="flex items-center gap-4">
		<BackButton />
		<div class="hidden sm:block">
			<div class="flex items-center gap-2">
				<h1 class="text-sm font-semibold text-gray-900">{letterTitle}</h1>
				<StatusBadge {status} />
			</div>
			<p class="text-xs text-gray-500">
				{PROJECT_PHASE_LABELS[phase as keyof typeof PROJECT_PHASE_LABELS] ?? phase}
				{#if sentAt}
					— Verzonden {new Date(sentAt).toLocaleDateString('nl-NL', {
						day: 'numeric', month: 'long', year: 'numeric'
					})}
				{/if}
			</p>
		</div>
	</div>

	<div class="flex items-center gap-3">
		{#if saveError}
			<span class="text-xs text-error-600">{saveError}</span>
		{/if}
		{#if saveMessage}
			<span class="text-xs text-success-600">{saveMessage}</span>
		{/if}

		{#if nextStatusAction}
			<button
				type="button"
				on:click={() => dispatch('updateStatus')}
				disabled={updatingStatus}
				class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
			>
				{updatingStatus ? 'Bezig...' : nextStatusAction.label}
			</button>
		{/if}

		{#if isEditable}
			<button
				type="button"
				on:click={() => dispatch('save')}
				disabled={saving}
				class="rounded-md bg-primary-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
			>
				{saving ? 'Opslaan...' : 'Opslaan'}
			</button>
		{/if}
	</div>
</header>
