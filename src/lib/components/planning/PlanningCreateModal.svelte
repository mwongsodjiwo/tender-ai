<script lang="ts">
	import {
		PROJECT_PHASE_LABELS,
		PROJECT_PHASES,
		MILESTONE_TYPES,
		MILESTONE_TYPE_LABELS
	} from '$types';
	import { enhance } from '$app/forms';

	interface Member {
		profile_id: string;
		profile?: { first_name?: string; last_name?: string } | null;
	}

	export let members: Member[];
	export let milestoneFormError: string;
	export let milestoneFormSubmitting: boolean;
	export let isMilestone: boolean;
	export let onClose: () => void;
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Item toevoegen">
	<button
		type="button"
		class="absolute inset-0 bg-gray-900/50 transition-opacity"
		on:click={onClose}
		aria-label="Sluiten"
	></button>

	<div class="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl">
		<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
			<h2 class="text-lg font-semibold text-gray-900">
				{isMilestone ? 'Milestone toevoegen' : 'Activiteit toevoegen'}
			</h2>
			<button
				type="button"
				on:click={onClose}
				class="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-600"
				aria-label="Sluiten"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<form
			method="POST"
			action={isMilestone ? '?/createMilestone' : '?/createActivity'}
			use:enhance={() => {
				milestoneFormSubmitting = true;
				milestoneFormError = '';
				return async ({ result }) => {
					milestoneFormSubmitting = false;
					if (result.type === 'success') {
						onClose();
					} else if (result.type === 'error') {
						milestoneFormError = 'Er is een fout opgetreden bij het aanmaken.';
					}
				};
			}}
			class="p-6"
		>
			{#if milestoneFormError}
				<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{milestoneFormError}
				</div>
			{/if}

			<div class="mb-4">
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={isMilestone}
						class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
					<span class="text-sm font-medium text-gray-700">Dit is een milestone</span>
				</label>
			</div>

			<div>
				<label for="item-title" class="block text-sm font-medium text-gray-700">
					Titel <span class="text-red-500">*</span>
				</label>
				<input id="item-title" name="title" type="text" required maxlength="300"
					placeholder={isMilestone ? 'bijv. Publicatie op TenderNed' : 'bijv. Programma van Eisen opstellen'}
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
			</div>

			{#if isMilestone}
				<div class="mt-4">
					<label for="milestone-type" class="block text-sm font-medium text-gray-700">
						Type <span class="text-red-500">*</span>
					</label>
					<select id="milestone-type" name="milestone_type" required
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
						{#each MILESTONE_TYPES as mt (mt)}
							<option value={mt}>{MILESTONE_TYPE_LABELS[mt]}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class="mt-4">
				<label for="item-date" class="block text-sm font-medium text-gray-700">
					{isMilestone ? 'Doeldatum' : 'Deadline'} <span class="text-red-500">*</span>
				</label>
				<input id="item-date" name={isMilestone ? 'target_date' : 'due_date'} type="date" required
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
			</div>

			<div class="mt-4">
				<label for="item-phase" class="block text-sm font-medium text-gray-700">
					Fase {#if !isMilestone}<span class="text-red-500">*</span>{:else}(optioneel){/if}
				</label>
				<select id="item-phase" name="phase" required={!isMilestone}
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
					{#if isMilestone}<option value="">Geen fase</option>{/if}
					{#each PROJECT_PHASES as phase (phase)}
						<option value={phase}>{PROJECT_PHASE_LABELS[phase]}</option>
					{/each}
				</select>
			</div>

			{#if !isMilestone}
				<div class="mt-4">
					<label for="item-assigned" class="block text-sm font-medium text-gray-700">Toegewezen aan (optioneel)</label>
					<select id="item-assigned" name="assigned_to"
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
						<option value="">Niemand</option>
						{#each members as member (member.profile_id)}
							<option value={member.profile_id}>
								{member.profile?.first_name ?? ''} {member.profile?.last_name ?? ''}
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class="mt-4">
				<label for="item-desc" class="block text-sm font-medium text-gray-700">Beschrijving (optioneel)</label>
				<textarea id="item-desc" name="description" rows="2" maxlength="2000" placeholder="Korte toelichting..."
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"></textarea>
			</div>

			{#if isMilestone}
				<div class="mt-4">
					<label class="flex items-center gap-2">
						<input type="checkbox" name="is_critical" value="true"
							class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
						<span class="text-sm text-gray-700">Kritieke milestone (blokkeert andere milestones)</span>
					</label>
				</div>
			{/if}

			<div class="mt-6 flex items-center justify-end gap-3">
				<button type="button" on:click={onClose}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
					Annuleren
				</button>
				<button type="submit" disabled={milestoneFormSubmitting}
					class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50">
					{#if milestoneFormSubmitting}Opslaan...{:else}Toevoegen{/if}
				</button>
			</div>
		</form>
	</div>
</div>
