<script lang="ts">
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import NewLetterDialog from '$lib/components/NewLetterDialog.svelte';
	import {
		CORRESPONDENCE_STATUS_LABELS,
		CORRESPONDENCE_STATUSES,
		PROJECT_PHASES,
		PROJECT_PHASE_LABELS
	} from '$types';
	import type { Correspondence, ProjectPhase } from '$types';
	import {
		LETTER_TYPE_LABELS,
		formatCorrespondenceDate,
		getAvailableLetterTypes
	} from './correspondence-helpers';

	export let projectId: string;
	export let letters: Correspondence[] = [];
	export let currentPhase: ProjectPhase = 'tendering';

	let searchQuery = '';
	let phaseFilter = '';
	let statusFilter = '';
	let typeFilter = '';
	let showNewLetterDialog = false;

	$: filterConfig = [
		{
			key: 'phase',
			label: 'Fase',
			options: PROJECT_PHASES.map((p) => ({ value: p, label: PROJECT_PHASE_LABELS[p] }))
		},
		{
			key: 'type',
			label: 'Type',
			options: Object.entries(LETTER_TYPE_LABELS).map(([value, label]) => ({ value, label }))
		},
		{
			key: 'status',
			label: 'Status',
			options: CORRESPONDENCE_STATUSES.map((s) => ({ value: s, label: CORRESPONDENCE_STATUS_LABELS[s] }))
		}
	];

	$: filteredLetters = letters.filter((l) => {
		if (phaseFilter && l.phase !== phaseFilter) return false;
		if (statusFilter && l.status !== statusFilter) return false;
		if (typeFilter && l.letter_type !== typeFilter) return false;
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			return (
				(l.subject ?? '').toLowerCase().includes(q) ||
				(l.recipient ?? '').toLowerCase().includes(q) ||
				(LETTER_TYPE_LABELS[l.letter_type] ?? l.letter_type).toLowerCase().includes(q)
			);
		}
		return true;
	});

	$: displayLetterTypes = getAvailableLetterTypes(currentPhase);

	function handleSearch(query: string) { searchQuery = query; }

	function handleFilter(key: string, value: string) {
		if (key === 'phase') phaseFilter = value;
		if (key === 'status') statusFilter = value;
		if (key === 'type') typeFilter = value;
	}
</script>

<div class="space-y-6">
	<div class="flex items-start justify-between">
		<div>
			<p class="text-sm text-gray-500">Beheer brieven en documenten voor dit project.</p>
		</div>
		<button type="button"
			on:click={() => { showNewLetterDialog = true; }}
			class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
			+ Nieuwe brief
		</button>
	</div>

	{#if showNewLetterDialog}
		<NewLetterDialog {projectId} {displayLetterTypes} onClose={() => { showNewLetterDialog = false; }} />
	{/if}

	{#if letters.length > 0}
		<FilterBar placeholder="Zoeken in correspondentie..." filters={filterConfig} onSearch={handleSearch} onFilter={handleFilter} />
	{/if}

	{#if letters.length === 0 && !showNewLetterDialog}
		<EmptyState title="Nog geen correspondentie" description="Maak een nieuwe brief aan of genereer er een met AI." icon="document" />
	{/if}

	{#if letters.length > 0 && filteredLetters.length === 0}
		<EmptyState title="Geen resultaten" description="Geen brieven gevonden die voldoen aan de filters." icon="search" />
	{/if}

	{#if filteredLetters.length > 0}
		<div class="rounded-card bg-white shadow-card overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b border-gray-200">
						<th scope="col" class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Fase</th>
						<th scope="col" class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Titel</th>
						<th scope="col" class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
						<th scope="col" class="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Ontvanger</th>
						<th scope="col" class="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Datum</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each filteredLetters as letter (letter.id)}
						<tr class="group transition-colors hover:bg-gray-50">
							<td class="px-6 py-4">
								<a href="/projects/{projectId}/correspondence/{letter.id}" class="block">
									<StatusBadge status={letter.phase} />
								</a>
							</td>
							<td class="px-6 py-4">
								<a href="/projects/{projectId}/correspondence/{letter.id}" class="block min-w-0">
									<span class="text-sm font-medium text-gray-900">
										{LETTER_TYPE_LABELS[letter.letter_type] ?? letter.letter_type}
									</span>
									<p class="mt-0.5 truncate text-sm text-gray-500">
										{#if letter.subject}
											{letter.subject}
										{:else}
											<span class="text-gray-500">(geen onderwerp)</span>
										{/if}
									</p>
								</a>
							</td>
							<td class="px-6 py-4">
								<a href="/projects/{projectId}/correspondence/{letter.id}" class="block">
									<StatusBadge status={letter.status} />
								</a>
							</td>
							<td class="px-6 py-4">
								<a href="/projects/{projectId}/correspondence/{letter.id}" class="block">
									{#if letter.recipient}
										<span class="text-sm text-gray-700">{letter.recipient}</span>
									{:else}
										<span class="text-sm text-gray-500">-</span>
									{/if}
								</a>
							</td>
							<td class="px-6 py-4 text-right">
								<a href="/projects/{projectId}/correspondence/{letter.id}" class="block">
									<span class="text-sm text-gray-500">{formatCorrespondenceDate(letter.created_at)}</span>
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
