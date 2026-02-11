<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import {
		CORRESPONDENCE_STATUS_LABELS,
		PROJECT_PHASE_LABELS
	} from '$types';
	import type { Correspondence, Evaluation, CorrespondenceStatus } from '$types';

	export let data: PageData;

	$: project = data.project;
	$: letter = data.letter as Correspondence;
	$: evaluations = (data.evaluations ?? []) as Evaluation[];
	$: projectProfile = data.projectProfile;

	// Letter type labels (client-side)
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

	// Editable fields — initialize directly from data to avoid timing issues
	let recipient = (data.letter as Correspondence)?.recipient ?? '';
	let subject = (data.letter as Correspondence)?.subject ?? '';
	let body = (data.letter as Correspondence)?.body ?? '';

	// AI generation state
	let generating = false;
	let generateError = '';
	let instructions = '';
	let selectedEvaluationId = '';

	// Save state
	let saving = false;
	let saveError = '';
	let saved = false;

	// Status update state
	let updatingStatus = false;

	// Whether the letter type benefits from evaluation data
	$: needsEvaluation = letter ? ['rejection', 'provisional_award', 'final_award'].includes(letter.letter_type) : false;

	// Whether the body has content (for generate vs regenerate label)
	$: hasContent = body.trim().length > 0;

	// Available next status based on current
	$: nextStatusAction = letter ? getNextStatusAction(letter.status) : null;

	function getNextStatusAction(
		status: CorrespondenceStatus
	): { label: string; newStatus: CorrespondenceStatus; extraFields?: Record<string, string> } | null {
		switch (status) {
			case 'draft':
				return { label: 'Markeer als gereed', newStatus: 'ready' };
			case 'ready':
				return {
					label: 'Markeer als verzonden',
					newStatus: 'sent',
					extraFields: { sent_at: new Date().toISOString() }
				};
			case 'sent':
				return { label: 'Archiveren', newStatus: 'archived' };
			default:
				return null;
		}
	}

	function handleEditorChange(event: CustomEvent<string>) {
		body = event.detail;
	}

	async function generateWithAI() {
		generating = true;
		generateError = '';

		try {
			const requestBody: Record<string, string> = {
				letter_type: letter.letter_type
			};
			if (recipient) requestBody.recipient = recipient;
			if (instructions) requestBody.instructions = instructions;
			if (selectedEvaluationId) requestBody.evaluation_id = selectedEvaluationId;

			const response = await fetch(`/api/projects/${project.id}/correspondence/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody)
			});

			const result = await response.json();

			if (!response.ok) {
				generateError = result.message ?? 'Brief generatie mislukt.';
				generating = false;
				return;
			}

			// Update local state with generated content
			const generated = result.data;
			if (generated.subject) subject = generated.subject;
			if (generated.body) body = generated.body;
			if (generated.recipient && !recipient) recipient = generated.recipient;

			// Save the generated content to the current letter
			await saveLetter();
		} catch {
			generateError = 'Netwerkfout bij het genereren van de brief.';
		}

		generating = false;
	}

	async function saveLetter() {
		saving = true;
		saveError = '';
		saved = false;

		try {
			const response = await fetch(
				`/api/projects/${project.id}/correspondence/${letter.id}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ recipient, subject, body })
				}
			);

			if (!response.ok) {
				const result = await response.json();
				saveError = result.message ?? 'Opslaan mislukt.';
			} else {
				saved = true;
				setTimeout(() => (saved = false), 3000);
				await invalidateAll();
			}
		} catch {
			saveError = 'Netwerkfout bij het opslaan.';
		}

		saving = false;
	}

	async function updateStatus() {
		if (!nextStatusAction) return;

		updatingStatus = true;
		saveError = '';

		try {
			const updateData: Record<string, unknown> = {
				recipient,
				subject,
				body,
				status: nextStatusAction.newStatus
			};

			if (nextStatusAction.extraFields) {
				Object.assign(updateData, nextStatusAction.extraFields);
			}

			const response = await fetch(
				`/api/projects/${project.id}/correspondence/${letter.id}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(updateData)
				}
			);

			if (!response.ok) {
				const result = await response.json();
				saveError = result.message ?? 'Status wijzigen mislukt.';
			} else {
				await invalidateAll();
			}
		} catch {
			saveError = 'Netwerkfout bij het wijzigen van de status.';
		}

		updatingStatus = false;
	}
</script>

<svelte:head>
	<title>{letter ? (LETTER_TYPE_LABELS[letter.letter_type] ?? letter.letter_type) : 'Brief'} — Correspondentie — Tendermanager</title>
</svelte:head>

{#if !letter}
	<div class="p-8 text-center text-gray-500">Brief laden...</div>
{:else}
<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<Breadcrumbs items={[
				{ label: project.name, href: `/projects/${project.id}` },
				{ label: 'Correspondentie', href: `/projects/${project.id}/correspondence` },
				{ label: LETTER_TYPE_LABELS[letter.letter_type] ?? letter.letter_type }
			]} />
			<div class="mt-1 flex items-center gap-3">
				<h1 class="text-2xl font-bold text-gray-900">
					{LETTER_TYPE_LABELS[letter.letter_type] ?? letter.letter_type}
				</h1>
				<StatusBadge status={letter.status} />
			</div>
			<p class="mt-1 text-sm text-gray-500">
				{PROJECT_PHASE_LABELS[letter.phase] ?? letter.phase}
				{#if letter.sent_at}
					— Verzonden op {new Date(letter.sent_at).toLocaleDateString('nl-NL', {
						day: 'numeric',
						month: 'long',
						year: 'numeric'
					})}
				{/if}
			</p>
		</div>
		<a
			href="/projects/{project.id}/correspondence"
			class="text-sm font-medium text-primary-600 hover:text-primary-700"
		>
			&larr; Terug naar overzicht
		</a>
	</div>

	<!-- Metadata bar -->
	<div class="rounded-card bg-white p-6 shadow-card">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div>
				<label for="recipient" class="block text-sm font-medium text-gray-700">Ontvanger</label>
				<input
					id="recipient"
					type="text"
					bind:value={recipient}
					disabled={letter.status === 'sent' || letter.status === 'archived'}
					class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
					placeholder="Naam ontvanger of organisatie"
				/>
			</div>
			<div>
				<label for="subject" class="block text-sm font-medium text-gray-700">Onderwerp</label>
				<input
					id="subject"
					type="text"
					bind:value={subject}
					disabled={letter.status === 'sent' || letter.status === 'archived'}
					class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
					placeholder="Onderwerp van de brief"
				/>
			</div>
		</div>
	</div>

	<!-- AI Generation block -->
	{#if letter.status === 'draft'}
		<div class="rounded-card bg-primary-50 p-6 shadow-card">
			<div class="flex items-start justify-between">
				<div>
					<h2 class="text-base font-semibold text-primary-900">AI Brief-generatie</h2>
					<p class="mt-1 text-sm text-primary-700">
						Laat de AI een conceptbrief genereren op basis van het projectprofiel
						{#if needsEvaluation}en beoordelingsgegevens{/if}.
					</p>
				</div>
			</div>

			{#if !projectProfile}
				<div class="mt-4">
					<InfoBanner
						type="warning"
						title="Projectprofiel ontbreekt"
						message="Vul eerst het projectprofiel in voordat u een brief kunt genereren."
					/>
				</div>
			{:else}
				<!-- Evaluation selector for rejection/award letters -->
				{#if needsEvaluation && evaluations.length > 0}
					<div class="mt-4">
						<label for="evaluation-select" class="block text-sm font-medium text-primary-800">
							Selecteer evaluatie (inschrijver)
						</label>
						<select
							id="evaluation-select"
							bind:value={selectedEvaluationId}
							class="mt-1 block w-full rounded-card border border-primary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
						>
							<option value="">— Selecteer een inschrijver —</option>
							{#each evaluations as evaluation}
								<option value={evaluation.id}>
									{evaluation.tenderer_name} — Score: {evaluation.total_score}
									{evaluation.ranking ? ` (Rang ${evaluation.ranking})` : ''}
								</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- Optional instructions -->
				<div class="mt-4">
					<label for="ai-instructions" class="block text-sm font-medium text-primary-800">
						Aanvullende instructies (optioneel)
					</label>
					<textarea
						id="ai-instructions"
						bind:value={instructions}
						rows="2"
						class="mt-1 block w-full rounded-card border border-primary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
						placeholder="Bijv. 'Gebruik een minder formele toon' of 'Verwijs naar de inlichtingenbijeenkomst van 15 maart'"
					></textarea>
				</div>

				{#if generateError}
					<div class="mt-4">
						<ErrorAlert message={generateError} />
					</div>
				{/if}

				<div class="mt-4">
					<button
						type="button"
						on:click={generateWithAI}
						disabled={generating || (needsEvaluation && evaluations.length > 0 && !selectedEvaluationId)}
						class="inline-flex items-center gap-2 rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
					>
						{#if generating}
							<LoadingSpinner />
							Brief genereren...
						{:else}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							{hasContent ? 'Hergenereer met AI' : 'Genereer met AI'}
						{/if}
					</button>
					{#if hasContent && !generating}
						<span class="ml-3 text-xs text-primary-600">
							Let op: hergenereren maakt een nieuw concept aan. De huidige inhoud wordt niet overschreven.
						</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Editor -->
	<div class="rounded-card bg-white shadow-card">
		<div class="border-b border-gray-100 px-6 py-4">
			<h2 class="text-base font-semibold text-gray-900">Briefinhoud</h2>
		</div>
		<div class="p-6">
			<TiptapEditor
				content={body}
				editable={letter.status === 'draft' || letter.status === 'ready'}
				placeholder="Begin met schrijven of gebruik AI om een concept te genereren..."
				on:change={handleEditorChange}
			/>
		</div>
	</div>

	<!-- Errors -->
	{#if saveError}
		<ErrorAlert message={saveError} />
	{/if}

	<!-- Action buttons -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			{#if letter.status === 'draft' || letter.status === 'ready'}
				<button
					type="button"
					on:click={saveLetter}
					disabled={saving}
					class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{saving ? 'Opslaan...' : 'Opslaan'}
				</button>
			{/if}

			{#if nextStatusAction}
				<button
					type="button"
					on:click={updateStatus}
					disabled={updatingStatus}
					class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				>
					{updatingStatus ? 'Bezig...' : nextStatusAction.label}
				</button>
			{/if}

			{#if saved}
				<span class="text-sm text-success-600">Opgeslagen</span>
			{/if}
		</div>

		<div class="text-sm text-gray-400">
			Aangemaakt op {new Date(letter.created_at).toLocaleDateString('nl-NL', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})}
		</div>
	</div>
</div>
{/if}
