<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { Editor } from '@tiptap/core';
	import type { PageData } from './$types';
	import type { Correspondence, Evaluation, CorrespondenceStatus } from '$types';
	import EditorToolbar from '$lib/components/editor/EditorToolbar.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import LetterPreview from '$lib/components/correspondence/LetterPreview.svelte';
	import LetterActions from '$lib/components/correspondence/LetterActions.svelte';
	import LetterEditor from '$lib/components/correspondence/LetterEditor.svelte';

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

	let subject = (data.letter as Correspondence)?.subject ?? '';
	let body = (data.letter as Correspondence)?.body ?? '';

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

	let focusedEditor: Editor | null = null;
	let zoomLevel = 100;
	let fontSize = '11';

	let generating = false;
	let generateError = '';
	let saving = false;
	let saveError = '';
	let saveMessage = '';
	let updatingStatus = false;

	$: needsEvaluation = letter ? ['rejection', 'provisional_award', 'final_award'].includes(letter.letter_type) : false;
	$: hasContent = body.trim().length > 0;
	$: isEditable = letter?.status === 'draft' || letter?.status === 'ready';
	$: letterTitle = letter ? (LETTER_TYPE_LABELS[letter.letter_type] ?? letter.letter_type) : 'Brief';

	function handleEditorFocus(event: CustomEvent<Editor>) {
		focusedEditor = event.detail;
	}

	async function generateWithAI(event: CustomEvent<{ instructions: string; selectedEvaluationId: string }>) {
		generating = true;
		generateError = '';
		try {
			const requestBody: Record<string, string> = { letter_type: letter.letter_type };
			if (recipientName) requestBody.recipient = recipientName;
			if (event.detail.instructions) requestBody.instructions = event.detail.instructions;
			if (event.detail.selectedEvaluationId) requestBody.evaluation_id = event.detail.selectedEvaluationId;
			const response = await fetch(`/api/projects/${project.id}/correspondence/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody)
			});
			const result = await response.json();
			if (!response.ok) { generateError = result.message ?? 'Brief generatie mislukt.'; generating = false; return; }
			const generated = result.data;
			if (generated.subject) subject = generated.subject;
			if (generated.body) body = generated.body;
			if (generated.recipient && !recipientName) recipientName = generated.recipient;
			await saveLetter();
		} catch { generateError = 'Netwerkfout bij het genereren van de brief.'; }
		generating = false;
	}

	async function saveLetter() {
		saving = true;
		saveError = '';
		saveMessage = '';
		try {
			const response = await fetch(`/api/projects/${project.id}/correspondence/${letter.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ recipient: recipientName, subject, body })
			});
			if (!response.ok) { saveError = (await response.json()).message ?? 'Opslaan mislukt.'; }
			else { saveMessage = 'Opgeslagen'; setTimeout(() => { saveMessage = ''; }, 2000); await invalidateAll(); }
		} catch { saveError = 'Netwerkfout bij het opslaan.'; }
		saving = false;
	}

	async function updateStatus() {
		const action = getNextStatus(letter.status);
		if (!action) return;
		updatingStatus = true;
		saveError = '';
		try {
			const updateData: Record<string, unknown> = { recipient: recipientName, subject, body, status: action.newStatus };
			if (action.extraFields) Object.assign(updateData, action.extraFields);
			const response = await fetch(`/api/projects/${project.id}/correspondence/${letter.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});
			if (!response.ok) { saveError = (await response.json()).message ?? 'Status wijzigen mislukt.'; }
			else { await invalidateAll(); }
		} catch { saveError = 'Netwerkfout bij het wijzigen van de status.'; }
		updatingStatus = false;
	}

	function getNextStatus(s: CorrespondenceStatus): { newStatus: CorrespondenceStatus; extraFields?: Record<string, string> } | null {
		if (s === 'draft') return { newStatus: 'ready' };
		if (s === 'ready') return { newStatus: 'sent', extraFields: { sent_at: new Date().toISOString() } };
		if (s === 'sent') return { newStatus: 'archived' };
		return null;
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
	<LetterPreview {letterTitle} status={letter.status} phase={letter.phase} sentAt={letter.sent_at} {saveError} {saveMessage} {isEditable} {saving} {updatingStatus} on:save={saveLetter} on:updateStatus={updateStatus} />

	<EditorToolbar bind:focusedEditor bind:zoomLevel bind:fontSize showSearch={false} activeCommentsCount={0} isCommentsSidebarActive={false} on:toggleSearch={() => {}} on:toggleComments={() => {}} />

	<LetterActions letterStatus={letter.status} {projectProfile} {needsEvaluation} {evaluations} {hasContent} {generating} {generateError} on:generate={generateWithAI} />

	<LetterEditor bind:senderName bind:senderStreet bind:senderPostalCode bind:senderCity bind:recipientName bind:recipientStreet bind:recipientPostalCode bind:recipientCity bind:letterDate bind:letterReference bind:subject {body} {isEditable} {zoomLevel} {fontSize} on:change={(e) => body = e.detail} on:editorFocus={handleEditorFocus} />
</div>
{/if}
