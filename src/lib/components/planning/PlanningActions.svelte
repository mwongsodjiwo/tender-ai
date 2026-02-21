<script lang="ts">
	import type { Milestone } from '$types';
	import {
		PROJECT_PHASE_LABELS,
		MILESTONE_TYPE_LABELS,
		ACTIVITY_STATUS_LABELS
	} from '$types';
	import { enhance } from '$app/forms';
	import { formatDate, getMilestoneStatusColor } from '$lib/utils/planning-helpers';
	import PlanningCreateModal from './PlanningCreateModal.svelte';

	interface ContextMenuState {
		x: number;
		y: number;
		activityId: string;
		title: string;
	}

	interface Member {
		profile_id: string;
		profile?: { first_name?: string; last_name?: string } | null;
	}

	export let milestones: Milestone[];
	export let members: Member[];
	export let showMilestonePanel: boolean;
	export let showMilestoneModal: boolean;
	export let contextMenu: ContextMenuState | null;
	export let deleteError: string;
	export let milestoneFormError: string;
	export let milestoneFormSubmitting: boolean;
	export let isMilestone: boolean;

	export let onCloseMilestonePanel: () => void;
	export let onCloseMilestoneModal: () => void;
	export let onOpenMilestoneModal: () => void;
	export let onDeleteActivity: () => void;
	export let onDismissDeleteError: () => void;
</script>

<!-- Milestone management panel (slide-over) -->
{#if showMilestonePanel}
	<div class="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Milestones beheren">
		<button type="button" class="absolute inset-0 bg-gray-900/25 transition-opacity"
			on:click={onCloseMilestonePanel} aria-label="Sluiten"></button>

		<div class="relative z-10 w-full max-w-md overflow-y-auto bg-white shadow-xl">
			<div class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-900">Milestones</h2>
				<button type="button" on:click={onCloseMilestonePanel}
					class="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-600" aria-label="Sluiten">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="p-6">
				{#if milestones.length === 0}
					<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
						<p class="text-sm text-gray-500">Nog geen milestones aangemaakt.</p>
						<button type="button" on:click={() => { onOpenMilestoneModal(); onCloseMilestonePanel(); }}
							class="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700">
							Eerste item toevoegen
						</button>
					</div>
				{:else}
					<div class="space-y-3">
						{#each milestones as milestone (milestone.id)}
							<div class="rounded-lg border border-gray-200 bg-white p-4">
								<div class="flex items-start justify-between">
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											{#if milestone.is_critical}
												<svg class="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Kritiek">
													<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
												</svg>
											{/if}
											<p class="truncate text-sm font-medium text-gray-900">{milestone.title}</p>
										</div>
										<p class="mt-1 text-xs text-gray-500">
											{MILESTONE_TYPE_LABELS[milestone.milestone_type]}
											{#if milestone.phase}&middot; {PROJECT_PHASE_LABELS[milestone.phase]}{/if}
										</p>
										<p class="mt-1 text-xs text-gray-500">
											Datum: {formatDate(milestone.target_date)}
											{#if milestone.actual_date}(werkelijk: {formatDate(milestone.actual_date)}){/if}
										</p>
									</div>
									<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {getMilestoneStatusColor(milestone.status)}">
										{ACTIVITY_STATUS_LABELS[milestone.status]}
									</span>
								</div>
								<div class="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
									{#if milestone.status !== 'completed'}
										<form method="POST" action="?/updateMilestoneStatus" use:enhance>
											<input type="hidden" name="milestone_id" value={milestone.id} />
											<input type="hidden" name="status" value="completed" />
											<button type="submit" class="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-green-50 hover:text-green-700">Afronden</button>
										</form>
									{/if}
									<form method="POST" action="?/deleteMilestone" use:enhance>
										<input type="hidden" name="milestone_id" value={milestone.id} />
										<button type="submit" class="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-700">Verwijderen</button>
									</form>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if deleteError}
	<div class="fixed bottom-4 right-4 z-50 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
		{deleteError}
		<button type="button" on:click={onDismissDeleteError} class="ml-2 font-medium text-red-800 underline hover:text-red-900">Sluiten</button>
	</div>
{/if}

<!-- Context menu -->
{#if contextMenu}
	<div class="fixed z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
		style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
		role="menu" tabindex="-1" aria-label="Activiteitopties"
		on:contextmenu|preventDefault on:keydown={(e) => { if (e.key === 'Escape') contextMenu = null; }}>
		<div class="px-3 py-1.5 text-xs font-medium text-gray-500 truncate max-w-[200px]">{contextMenu.title}</div>
		<hr class="my-1 border-gray-100" />
		<button type="button" on:click={onDeleteActivity}
			class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50">
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
			</svg>
			Verwijderen
		</button>
	</div>
{/if}

{#if showMilestoneModal}
	<PlanningCreateModal
		{members}
		bind:milestoneFormError
		bind:milestoneFormSubmitting
		bind:isMilestone
		onClose={onCloseMilestoneModal}
	/>
{/if}
