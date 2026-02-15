<script lang="ts">
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import {
		CORRESPONDENCE_STATUS_LABELS,
		CORRESPONDENCE_STATUSES,
		PROJECT_PHASES,
		PROJECT_PHASE_LABELS
	} from '$types';
	import type { Correspondence, ProjectPhase, CorrespondenceStatus } from '$types';

	export let projectId: string;
	export let letters: Correspondence[] = [];
	export let currentPhase: ProjectPhase = 'tendering';

	const LETTER_TYPE_LABELS: Record<string, string> = {
		invitation_rfi: 'Uitnodiging RFI',
		invitation_consultation: 'Uitnodiging marktconsultatie',
		thank_you: 'Bedankbrief deelname',
		nvi: 'Nota van Inlichtingen',
		provisional_award: 'Voorlopige gunningsbeslissing',
		rejection: 'Afwijzingsbrief',
		final_award: 'Definitieve gunning',
		pv_opening: 'PV opening inschrijvingen',
		pv_evaluation: 'PV beoordeling',
		invitation_signing: 'Uitnodiging tot ondertekening',
		cover_letter: 'Begeleidende brief'
	};

	const LETTER_TYPE_PHASES: Record<string, ProjectPhase[]> = {
		invitation_rfi: ['exploring'],
		invitation_consultation: ['exploring'],
		thank_you: ['exploring'],
		nvi: ['tendering'],
		provisional_award: ['tendering'],
		rejection: ['tendering'],
		final_award: ['tendering'],
		pv_opening: ['tendering'],
		pv_evaluation: ['tendering'],
		invitation_signing: ['contracting'],
		cover_letter: ['contracting']
	};

	let searchQuery = '';
	let phaseFilter = '';
	let statusFilter = '';
	let typeFilter = '';

	let showNewLetterDialog = false;
	let selectedLetterType = '';
	let creating = false;
	let createError = '';

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

	$: availableLetterTypes = Object.entries(LETTER_TYPE_PHASES)
		.filter(([, phases]) => phases.includes(currentPhase))
		.map(([key]) => ({ value: key, label: LETTER_TYPE_LABELS[key] ?? key }));

	$: displayLetterTypes =
		availableLetterTypes.length > 0
			? availableLetterTypes
			: Object.entries(LETTER_TYPE_LABELS).map(([value, label]) => ({ value, label }));

	function handleSearch(query: string) { searchQuery = query; }

	function handleFilter(key: string, value: string) {
		if (key === 'phase') phaseFilter = value;
		if (key === 'status') statusFilter = value;
		if (key === 'type') typeFilter = value;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function createNewLetter() {
		if (!selectedLetterType) return;
		creating = true;
		createError = '';

		try {
			const phases = LETTER_TYPE_PHASES[selectedLetterType] ?? ['tendering'];
			const phase = phases[0];
			const response = await fetch(`/api/projects/${projectId}/correspondence`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phase,
					letter_type: selectedLetterType,
					subject: '',
					body: '',
					recipient: ''
				})
			});

			if (!response.ok) {
				const result = await response.json();
				createError = result.message ?? 'Er is een fout opgetreden.';
				creating = false;
				return;
			}

			const result = await response.json();
			showNewLetterDialog = false;
			selectedLetterType = '';
			creating = false;
			window.location.href = `/projects/${projectId}/correspondence/${result.data.id}`;
			return;
		} catch {
			createError = 'Netwerkfout bij het aanmaken van de brief.';
		}
		creating = false;
	}
</script>

<div class="space-y-6">
	<!-- Header with new letter button -->
	<div class="flex items-start justify-between">
		<div>
			<p class="text-sm text-gray-500">Beheer brieven en documenten voor dit project.</p>
		</div>
		<button
			type="button"
			on:click={() => { showNewLetterDialog = true; createError = ''; }}
			class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
		>
			+ Nieuwe brief
		</button>
	</div>

	<!-- New letter dialog -->
	{#if showNewLetterDialog}
		<div class="rounded-card bg-white p-6 shadow-card" role="region" aria-label="Nieuw brieftype kiezen">
			<h3 class="text-base font-semibold text-gray-900">Kies een brieftype</h3>
			<p class="mt-1 text-sm text-gray-500">Selecteer het type brief dat u wilt aanmaken.</p>
			{#if createError}
				<div class="mt-3"><ErrorAlert message={createError} /></div>
			{/if}
			<div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
				{#each displayLetterTypes as letterType}
					<button
						type="button"
						on:click={() => { selectedLetterType = letterType.value; }}
						class="rounded-card border px-4 py-3 text-left text-sm transition-colors
							{selectedLetterType === letterType.value
								? 'border-primary-500 bg-primary-50 text-primary-700'
								: 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}"
					>
						<span class="font-medium">{letterType.label}</span>
						{#if LETTER_TYPE_PHASES[letterType.value]}
							<span class="ml-2 text-xs text-gray-500">
								{LETTER_TYPE_PHASES[letterType.value].map((p) => PROJECT_PHASE_LABELS[p]).join(', ')}
							</span>
						{/if}
					</button>
				{/each}
			</div>
			<div class="mt-4 flex items-center justify-end gap-2">
				<button
					type="button"
					on:click={() => { showNewLetterDialog = false; selectedLetterType = ''; }}
					class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Annuleren
				</button>
				<button
					type="button"
					on:click={createNewLetter}
					disabled={!selectedLetterType || creating}
					class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{#if creating}<LoadingSpinner />{:else}Brief aanmaken{/if}
				</button>
			</div>
		</div>
	{/if}

	<!-- Filters -->
	{#if letters.length > 0}
		<FilterBar
			placeholder="Zoeken in correspondentie..."
			filters={filterConfig}
			onSearch={handleSearch}
			onFilter={handleFilter}
		/>
	{/if}

	<!-- Empty state -->
	{#if letters.length === 0 && !showNewLetterDialog}
		<EmptyState
			title="Nog geen correspondentie"
			description="Maak een nieuwe brief aan of genereer er een met AI."
			icon="document"
		/>
	{/if}

	<!-- Filtered empty state -->
	{#if letters.length > 0 && filteredLetters.length === 0}
		<EmptyState
			title="Geen resultaten"
			description="Geen brieven gevonden die voldoen aan de filters."
			icon="search"
		/>
	{/if}

	<!-- Letters table -->
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
								<a href="/projects/{projectId}/correspondence/{letter.id}" data-sveltekit-reload class="block">
									<StatusBadge status={letter.phase} />
								</a>
							</td>
							<td class="px-6 py-4">
								<a href="/projects/{projectId}/correspondence/{letter.id}" data-sveltekit-reload class="block min-w-0">
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
								<a href="/projects/{projectId}/correspondence/{letter.id}" data-sveltekit-reload class="block">
									<StatusBadge status={letter.status} />
								</a>
							</td>
							<td class="px-6 py-4">
								<a href="/projects/{projectId}/correspondence/{letter.id}" data-sveltekit-reload class="block">
									{#if letter.recipient}
										<span class="text-sm text-gray-700">{letter.recipient}</span>
									{:else}
										<span class="text-sm text-gray-500">-</span>
									{/if}
								</a>
							</td>
							<td class="px-6 py-4 text-right">
								<a href="/projects/{projectId}/correspondence/{letter.id}" data-sveltekit-reload class="block">
									<span class="text-sm text-gray-500">{formatDate(letter.created_at)}</span>
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
