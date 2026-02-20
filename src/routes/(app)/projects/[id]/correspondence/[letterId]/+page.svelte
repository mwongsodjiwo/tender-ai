<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { Editor } from '@tiptap/core';
	import type { PageData } from './$types';
	import TiptapEditor from '$lib/components/TiptapEditor.svelte';
	import EditorToolbar from '$lib/components/editor/EditorToolbar.svelte';
	import LetterAddressBlock from '$lib/components/editor/LetterAddressBlock.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ErrorAlert from '$lib/components/ErrorAlert.svelte';
	import InfoBanner from '$lib/components/InfoBanner.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import { PROJECT_PHASE_LABELS } from '$types';
	import type { Correspondence, Evaluation, CorrespondenceStatus } from '$types';

	export let data: PageData;

	$: project = data.project;
	$: letter = data.letter as Correspondence;
	$: evaluations = (data.evaluations ?? []) as Evaluation[];
	$: projectProfile = data.projectProfile;
	$: addressData = data.addressData as {
		sender: { name: string; street: string; postalCode: string; city: string };
		recipient: { name: string; street: string; postalCode: string; city: string };
	};

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

	// Editable fields
	let subject = (data.letter as Correspondence)?.subject ?? '';
	let body = (data.letter as Correspondence)?.body ?? '';

	// Address block fields (initialized from server data)
	let senderName = addressData?.sender?.name ?? '';
	let senderStreet = addressData?.sender?.street ?? '';
	let senderPostalCode = addressData?.sender?.postalCode ?? '';
	let senderCity = addressData?.sender?.city ?? '';
	let recipientName = addressData?.recipient?.name || (data.letter as Correspondence)?.recipient || '';
	let recipientStreet = addressData?.recipient?.street ?? '';
	let recipientPostalCode = addressData?.recipient?.postalCode ?? '';
	let recipientCity = addressData?.recipient?.city ?? '';
	let letterDate = '';
	let letterReference = project?.name ?? '';

	// Toolbar binding
	let focusedEditor: Editor | null = null;
	let editorComponent: TiptapEditor;
	let zoomLevel = 100;
	let fontSize = '11';

	// AI generation state
	let generating = false;
	let generateError = '';
	let instructions = '';
	let selectedEvaluationId = '';
	let showAiPanel = false;

	// Save state
	let saving = false;
	let saveError = '';
	let saveMessage = '';

	// Status update state
	let updatingStatus = false;

	$: needsEvaluation = letter
		? ['rejection', 'provisional_award', 'final_award'].includes(letter.letter_type)
		: false;
	$: hasContent = body.trim().length > 0;
	$: nextStatusAction = letter ? getNextStatusAction(letter.status) : null;
	$: isEditable = letter?.status === 'draft' || letter?.status === 'ready';
	$: letterTitle = letter
		? (LETTER_TYPE_LABELS[letter.letter_type] ?? letter.letter_type)
		: 'Brief';

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

	function handleEditorFocus() {
		if (editorComponent) focusedEditor = editorComponent.getEditor();
	}

	async function generateWithAI() {
		generating = true;
		generateError = '';

		try {
			const requestBody: Record<string, string> = {
				letter_type: letter.letter_type
			};
			if (recipientName) requestBody.recipient = recipientName;
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

			const generated = result.data;
			if (generated.subject) subject = generated.subject;
			if (generated.body) body = generated.body;
			if (generated.recipient && !recipientName) recipientName = generated.recipient;

			await saveLetter();
		} catch {
			generateError = 'Netwerkfout bij het genereren van de brief.';
		}

		generating = false;
	}

	async function saveLetter() {
		saving = true;
		saveError = '';
		saveMessage = '';

		try {
			const response = await fetch(
				`/api/projects/${project.id}/correspondence/${letter.id}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ recipient: recipientName, subject, body })
				}
			);

			if (!response.ok) {
				const result = await response.json();
				saveError = result.message ?? 'Opslaan mislukt.';
			} else {
				saveMessage = 'Opgeslagen';
				setTimeout(() => { saveMessage = ''; }, 2000);
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
				recipient: recipientName,
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
	<title>{letterTitle} — Correspondentie — Tendermanager</title>
</svelte:head>

{#if !letter}
	<div class="flex h-screen items-center justify-center">
		<LoadingSpinner />
		<span class="ml-3 text-gray-500">Brief laden...</span>
	</div>
{:else}
<div class="fixed inset-0 z-[60] flex flex-col bg-[#F5F5F5]">
	<!-- Header bar -->
	<header class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6">
		<div class="flex items-center gap-4">
			<BackButton />
			<div class="hidden sm:block">
				<div class="flex items-center gap-2">
					<h1 class="text-sm font-semibold text-gray-900">{letterTitle}</h1>
					<StatusBadge status={letter.status} />
				</div>
				<p class="text-xs text-gray-500">
					{PROJECT_PHASE_LABELS[letter.phase] ?? letter.phase}
					{#if letter.sent_at}
						— Verzonden {new Date(letter.sent_at).toLocaleDateString('nl-NL', {
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
					on:click={updateStatus}
					disabled={updatingStatus}
					class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
				>
					{updatingStatus ? 'Bezig...' : nextStatusAction.label}
				</button>
			{/if}

			{#if isEditable}
				<button
					type="button"
					on:click={saveLetter}
					disabled={saving}
					class="rounded-md bg-primary-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{saving ? 'Opslaan...' : 'Opslaan'}
				</button>
			{/if}
		</div>
	</header>

	<!-- Editor Toolbar -->
	<EditorToolbar
		bind:focusedEditor
		bind:zoomLevel
		bind:fontSize
		showSearch={false}
		activeCommentsCount={0}
		isCommentsSidebarActive={false}
		on:toggleSearch={() => {}}
		on:toggleComments={() => {}}
	/>

	<!-- AI Generation toggle bar -->
	{#if letter.status === 'draft' && projectProfile}
		<div class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-primary-50 px-6 py-2">
			<div class="flex items-center gap-2">
				<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
				<span class="text-sm font-medium text-primary-800">AI Brief-generatie</span>
			</div>
			<button
				type="button"
				on:click={() => showAiPanel = !showAiPanel}
				class="text-xs font-medium text-primary-700 hover:text-primary-900"
			>
				{showAiPanel ? 'Verbergen' : 'Tonen'}
			</button>
		</div>

		{#if showAiPanel}
			<div class="shrink-0 border-b border-gray-200 bg-primary-50/50 px-6 py-4">
				<div class="mx-auto flex max-w-3xl flex-wrap items-end gap-4">
					{#if needsEvaluation && evaluations.length > 0}
						<div class="min-w-[200px] flex-1">
							<label for="evaluation-select" class="mb-1 block text-xs font-medium text-primary-800">
								Inschrijver
							</label>
							<select
								id="evaluation-select"
								bind:value={selectedEvaluationId}
								class="block w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-primary-500"
							>
								<option value="">— Selecteer —</option>
								{#each evaluations as evaluation}
									<option value={evaluation.id}>
										{evaluation.tenderer_name} — Score: {evaluation.total_score}
										{evaluation.ranking ? ` (Rang ${evaluation.ranking})` : ''}
									</option>
								{/each}
							</select>
						</div>
					{/if}

					<div class="min-w-[200px] flex-1">
						<label for="ai-instructions" class="mb-1 block text-xs font-medium text-primary-800">
							Instructies (optioneel)
						</label>
						<input
							id="ai-instructions"
							type="text"
							bind:value={instructions}
							class="block w-full rounded-md border border-primary-200 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-primary-500"
							placeholder="Bijv. 'Gebruik een informele toon'"
						/>
					</div>

					<button
						type="button"
						on:click={generateWithAI}
						disabled={generating || (needsEvaluation && evaluations.length > 0 && !selectedEvaluationId)}
						class="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
					>
						{#if generating}
							<LoadingSpinner />
							Genereren...
						{:else}
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							{hasContent ? 'Hergenereer' : 'Genereer'}
						{/if}
					</button>
				</div>

				{#if generateError}
					<div class="mx-auto mt-3 max-w-3xl">
						<ErrorAlert message={generateError} />
					</div>
				{/if}
			</div>
		{/if}
	{:else if letter.status === 'draft' && !projectProfile}
		<div class="shrink-0 border-b border-gray-200 bg-warning-50 px-6 py-2">
			<InfoBanner
				type="warning"
				title="Projectprofiel ontbreekt"
				message="Vul eerst het projectprofiel in voordat u een brief kunt genereren."
			/>
		</div>
	{/if}

	<!-- Paper content area -->
	<div class="flex min-h-0 flex-1 justify-center overflow-y-auto py-8">
		<div
			class="letter-paper"
			style="transform: scale({(zoomLevel / 100) * 1.25}); transform-origin: top center; --editor-font-size: {fontSize}pt;"
		>
			<!-- Address block -->
			<div class="letter-paper-content-padding">
				<LetterAddressBlock
					bind:senderName
					bind:senderStreet
					bind:senderPostalCode
					bind:senderCity
					bind:recipientName
					bind:recipientStreet
					bind:recipientPostalCode
					bind:recipientCity
					bind:date={letterDate}
					bind:reference={letterReference}
					bind:subject
					editable={isEditable}
				/>
			</div>

			<!-- Letter body (TipTap editor) -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="letter-editor-area"
				on:focusin={handleEditorFocus}
				role="none"
			>
				<TiptapEditor
					bind:this={editorComponent}
					content={body}
					editable={isEditable}
					placeholder="Begin met schrijven of gebruik AI om een concept te genereren..."
					showToolbar={false}
					on:change={handleEditorChange}
				/>
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.letter-paper {
		width: 794px;
		min-height: 1123px;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.letter-paper-content-padding {
		padding: 60px 72px 0 72px;
	}

	.letter-editor-area :global(.tiptap-editor-wrapper) {
		border: none;
		border-radius: 0;
		min-height: 600px;
	}

	.letter-editor-area :global(.tiptap-editor-wrapper .tiptap) {
		padding: 0 72px 60px 72px;
		min-height: 600px;
		font-family: 'Asap', sans-serif;
		font-size: var(--editor-font-size, 11pt);
		line-height: 1.6;
		color: #1a1a1a;
	}
</style>
