<script lang="ts">
	import type { PageData } from './$types';
	import type { UeaPart } from '$types/enums';
	import { UEA_PARTS, UEA_PART_TITLES, UEA_PART_ROMAN } from '$types';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	export let data: PageData;

	$: project = data.project;
	$: sections = data.sections as SectionWithQuestions[];
	$: hasSelections = data.hasSelections as boolean;

	interface QuestionWithSelection {
		id: string;
		section_id: string;
		question_number: string;
		title: string;
		description: string;
		is_mandatory: boolean;
		is_selected: boolean;
		sort_order: number;
	}

	interface SectionWithQuestions {
		id: string;
		part_number: UeaPart;
		part_title: string;
		section_key: string;
		section_title: string;
		description: string;
		sort_order: number;
		questions: QuestionWithSelection[];
	}

	// Active tab
	let activeTab: UeaPart = 2;

	// Loading state
	let initializing = false;
	let toggling: string | null = null;
	let errorMessage = '';

	// Computed metrics
	$: allQuestions = sections.flatMap((s) => s.questions);
	$: totalQuestions = allQuestions.length;
	$: mandatoryCount = allQuestions.filter((q) => q.is_mandatory).length;
	$: optionalCount = totalQuestions - mandatoryCount;
	$: selectedCount = allQuestions.filter((q) => q.is_selected).length;

	// Sections for active tab
	$: activeSections = sections.filter((s) => s.part_number === activeTab);

	// Expanded sections (all expanded by default)
	let expandedSections = new Set<string>();
	$: {
		const keys = sections.map((s) => s.section_key);
		expandedSections = new Set(keys);
	}

	function toggleSection(key: string): void {
		if (expandedSections.has(key)) {
			expandedSections.delete(key);
		} else {
			expandedSections.add(key);
		}
		expandedSections = new Set(expandedSections);
	}

	async function initializeSelections(): Promise<void> {
		initializing = true;
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/uea/initialize`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ select_all_optional: false })
			});
			if (response.ok) {
				window.location.reload();
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon de UEA-selecties niet initialiseren.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
		initializing = false;
	}

	async function toggleQuestion(question: QuestionWithSelection): Promise<void> {
		if (question.is_mandatory) return;

		toggling = question.id;
		errorMessage = '';
		const newSelected = !question.is_selected;

		try {
			const response = await fetch(`/api/projects/${project.id}/uea/toggle`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question_id: question.id, is_selected: newSelected })
			});

			if (response.ok) {
				sections = sections.map((s) => ({
					...s,
					questions: s.questions.map((q) =>
						q.id === question.id ? { ...q, is_selected: newSelected } : q
					)
				}));
			} else {
				const result = await response.json();
				errorMessage = result.message ?? 'Kon de selectie niet bijwerken.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden. Probeer het opnieuw.';
		}
		toggling = null;
	}

	async function handleExport(): Promise<void> {
		errorMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/export`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ format: 'docx', document_type: 'uea' })
			});
			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `UEA_${project.name}.docx`;
				a.click();
				URL.revokeObjectURL(url);
			} else {
				errorMessage = 'Kon het UEA-document niet exporteren.';
			}
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden bij het exporteren.';
		}
	}
</script>

<svelte:head>
	<title>UEA — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-8">
	<!-- Page header -->
	<div class="flex items-start justify-between">
		<div>
			<div class="flex items-center gap-2">
				<a
					href="/projects/{project.id}"
					class="text-sm text-gray-500 hover:text-gray-700"
				>
					{project.name}
				</a>
				<span class="text-gray-300">/</span>
			</div>
			<h1 class="mt-1 text-2xl font-bold text-gray-900">Uniform Europees Aanbestedingsdocument</h1>
			<p class="mt-1 text-sm text-gray-500">
				Configureer de UEA-vragen voor {project.name}
			</p>
		</div>
		<button
			type="button"
			on:click={handleExport}
			disabled={selectedCount === 0}
			class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			UEA genereren
		</button>
	</div>

	{#if errorMessage}
		<div class="rounded-badge bg-error-50 p-4" role="alert">
			<div class="flex items-center gap-2">
				<svg class="h-5 w-5 text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<p class="text-sm text-error-700">{errorMessage}</p>
			</div>
		</div>
	{/if}

	<!-- Info block -->
	<InfoBanner
		type="info"
		title="Over het UEA"
		message="Het Uniform Europees Aanbestedingsdocument (UEA) is een eigen verklaring van ondernemers als voorlopig bewijs bij Europese aanbestedingen. Het vervangt diverse nationale formulieren en is verplicht bij Europese procedures. Selecteer hieronder welke vragen van toepassing zijn op uw aanbesteding."
	/>

	<!-- Metric cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<MetricCard value={selectedCount} label="Geselecteerde vragen" />
		<MetricCard value={mandatoryCount} label="Verplichte vragen" />
		<MetricCard value={optionalCount} label="Optionele vragen" />
	</div>

	<!-- Initialize button when no selections exist yet -->
	{#if !hasSelections && totalQuestions > 0}
		<div class="rounded-card bg-white p-8 text-center shadow-card">
			<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			<h3 class="mt-4 text-lg font-semibold text-gray-900">UEA configureren</h3>
			<p class="mt-2 text-sm text-gray-500">
				Initialiseer de UEA-vragen voor dit project. Verplichte vragen worden automatisch geselecteerd.
			</p>
			<button
				type="button"
				on:click={initializeSelections}
				disabled={initializing}
				class="mt-6 inline-flex items-center gap-2 rounded-card bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
			>
				{#if initializing}
					<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					Initialiseren...
				{:else}
					UEA initialiseren
				{/if}
			</button>
		</div>
	{/if}

	<!-- Tabs for Parts -->
	<div>
		<div class="border-b border-gray-200">
			<nav class="-mb-px flex gap-6" aria-label="UEA-delen">
				{#each UEA_PARTS as part}
					<button
						type="button"
						on:click={() => { activeTab = part; }}
						class="whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors
							{activeTab === part
								? 'border-primary-500 text-primary-600'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						aria-current={activeTab === part ? 'page' : undefined}
					>
						Deel {UEA_PART_ROMAN[part]} — {UEA_PART_TITLES[part]}
						<span class="ml-1.5 rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
							{sections
								.filter((s) => s.part_number === part)
								.flatMap((s) => s.questions)
								.filter((q) => q.is_selected).length}
						</span>
					</button>
				{/each}
			</nav>
		</div>

		<!-- Sections for active tab -->
		<div class="mt-6 space-y-4">
			{#if activeSections.length === 0}
				<p class="text-sm text-gray-500">Geen secties beschikbaar voor dit deel.</p>
			{/if}

			{#each activeSections as section (section.id)}
				<div class="rounded-card bg-white shadow-card">
					<!-- Section header (collapsible) -->
					<button
						type="button"
						on:click={() => toggleSection(section.section_key)}
						class="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
						aria-expanded={expandedSections.has(section.section_key)}
					>
						<div class="flex items-center gap-3">
							<svg
								class="h-5 w-5 text-gray-400 transition-transform {expandedSections.has(section.section_key) ? 'rotate-90' : ''}"
								fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
							<div>
								<h3 class="text-sm font-semibold text-gray-900">
									{section.section_key}. {section.section_title}
								</h3>
								{#if section.description}
									<p class="mt-0.5 text-xs text-gray-500">{section.description}</p>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-2">
							<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
								{section.questions.filter((q) => q.is_selected).length}/{section.questions.length}
							</span>
						</div>
					</button>

					<!-- Questions -->
					{#if expandedSections.has(section.section_key)}
						<div class="border-t border-gray-100">
							{#each section.questions as question (question.id)}
								<div
									class="flex items-start gap-4 border-b border-gray-50 px-6 py-4 last:border-b-0
										{question.is_mandatory ? 'bg-gray-50/50' : 'hover:bg-gray-50'}"
								>
									<!-- Checkbox -->
									<div class="pt-0.5">
										<input
											type="checkbox"
											checked={question.is_selected}
											disabled={question.is_mandatory || toggling === question.id}
											on:change={() => toggleQuestion(question)}
											class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
											aria-label="{question.question_number}: {question.title}"
										/>
									</div>

									<!-- Question content -->
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="font-mono text-xs text-gray-400">{question.question_number}</span>
											{#if question.is_mandatory}
												<StatusBadge status="verplicht" />
											{:else}
												<StatusBadge status="optioneel" />
											{/if}
											{#if toggling === question.id}
												<svg class="h-3.5 w-3.5 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
													<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
													<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
												</svg>
											{/if}
										</div>
										<h4 class="mt-1 text-sm font-medium text-gray-900">{question.title}</h4>
										{#if question.description}
											<p class="mt-1 text-xs text-gray-500">{question.description}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Warning block about EU procedures -->
	<InfoBanner
		type="warning"
		title="Let op bij EU-aanbestedingen"
		message="Het UEA moet bij Europese aanbestedingen worden ingediend via TenderNed. Zorg ervoor dat de geselecteerde vragen overeenkomen met de eisen in de aanbestedingsleidraad. Het UEA is een voorlopig bewijs — definitieve bewijsstukken worden na gunning opgevraagd bij de winnende inschrijver."
	/>
</div>
