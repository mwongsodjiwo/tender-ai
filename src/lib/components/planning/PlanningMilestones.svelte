<script lang="ts">
	import type { ProcedureType } from '$lib/types/enums.js';
	import { MILESTONE_TYPE_LABELS, PROCEDURE_TYPE_LABELS } from '$lib/types/enums.js';
	import {
		calculateTimeline,
		cascadeDates,
		PROCEDURE_DEADLINES,
		type TimelineMilestone
	} from '$lib/utils/procurement-timeline.js';

	export let procedureType: ProcedureType | null = null;
	export let anchorDate: string = '';
	export let milestones: TimelineMilestone[] = [];
	export let disabled: boolean = false;
	export let onMilestonesChange: ((milestones: TimelineMilestone[]) => void) | null = null;

	$: hasValidInput = procedureType !== null && anchorDate !== '';

	// Generate initial milestones when anchor/procedure changes and no manual milestones exist
	$: if (hasValidInput && milestones.length === 0 && procedureType) {
		milestones = calculateTimeline(anchorDate, procedureType);
		onMilestonesChange?.(milestones);
	}

	function handleDateChange(index: number, event: Event): void {
		const input = event.target as HTMLInputElement;
		const newDate = input.value;
		if (!newDate) return;

		milestones = cascadeDates(milestones, index, newDate);
		onMilestonesChange?.(milestones);
	}

	function recalculate(): void {
		if (!procedureType || !anchorDate) return;
		milestones = calculateTimeline(anchorDate, procedureType);
		onMilestonesChange?.(milestones);
	}

	function getMinDaysHint(milestone: TimelineMilestone, index: number): string {
		if (index === 0) return '';
		if (milestone.min_days_from_previous === 0) return 'Geen minimumtermijn';
		return `Min. ${milestone.min_days_from_previous} dagen na voorgaande`;
	}

	function isViolation(milestone: TimelineMilestone, index: number): boolean {
		if (index === 0 || milestone.min_days_from_previous === 0) return false;
		const prevDate = milestones[index - 1]?.target_date;
		if (!prevDate) return false;
		const prevMs = new Date(prevDate + 'T00:00:00Z').getTime();
		const currentMs = new Date(milestone.target_date + 'T00:00:00Z').getTime();
		const daysDiff = Math.round((currentMs - prevMs) / (1000 * 60 * 60 * 24));
		return daysDiff < milestone.min_days_from_previous;
	}

	function formatDateNl(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

{#if !hasValidInput}
	<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
		<p class="text-sm text-gray-500">
			Selecteer eerst een procedure en publicatiedatum om de planning te berekenen.
		</p>
	</div>
{:else if milestones.length === 0}
	<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
		<p class="text-sm text-gray-500">Geen milestones beschikbaar voor deze procedure.</p>
	</div>
{:else}
	<!-- Procedure badge + recalculate -->
	<div class="mb-4 flex items-center justify-between">
		<span class="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
			{procedureType ? PROCEDURE_TYPE_LABELS[procedureType] : ''}
		</span>
		{#if !disabled}
			<button
				type="button"
				on:click={recalculate}
				class="text-xs font-medium text-primary-600 hover:text-primary-700"
				title="Herbereken alle datums op basis van publicatiedatum"
			>
				Herbereken
			</button>
		{/if}
	</div>

	<!-- Vertical timeline -->
	<ol class="relative border-l-2 border-gray-200 ml-3" aria-label="Sleutelmomenten tijdlijn">
		{#each milestones as milestone, index (milestone.milestone_type)}
			{@const violation = isViolation(milestone, index)}
			{@const hint = getMinDaysHint(milestone, index)}
			<li class="mb-6 ml-6 last:mb-0">
				<!-- Timeline dot -->
				<span
					class="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white
						{violation ? 'bg-red-500' : milestone.source === 'manual' ? 'bg-primary-500' : 'bg-gray-400'}"
					aria-hidden="true"
				></span>

				<div class="rounded-lg border p-4 {violation ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}">
					<!-- Header row: label + source badge -->
					<div class="flex items-center justify-between gap-2">
						<h3 class="text-sm font-semibold {violation ? 'text-red-800' : 'text-gray-900'}">
							{MILESTONE_TYPE_LABELS[milestone.milestone_type]}
						</h3>
						<span
							class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium
								{milestone.source === 'manual' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}"
						>
							{milestone.source === 'manual' ? 'Handmatig' : 'Berekend'}
						</span>
					</div>

					<!-- Date picker -->
					<div class="mt-2">
						{#if disabled}
							<p class="text-sm text-gray-700">{formatDateNl(milestone.target_date)}</p>
						{:else}
							<input
								type="date"
								value={milestone.target_date}
								on:change={(e) => handleDateChange(index, e)}
								class="block w-full rounded-lg border px-3 py-2 text-sm shadow-sm
									focus:outline-none focus:ring-1
									{violation
										? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
										: 'border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500'}"
								aria-label="Datum voor {MILESTONE_TYPE_LABELS[milestone.milestone_type]}"
							/>
						{/if}
					</div>

					<!-- Hint: minimum term -->
					{#if hint}
						<p class="mt-1 text-xs {violation ? 'font-medium text-red-600' : 'text-gray-500'}">
							{hint}
							{#if violation}
								— termijn overschreden
							{/if}
						</p>
					{/if}
				</div>
			</li>
		{/each}
	</ol>
{/if}
