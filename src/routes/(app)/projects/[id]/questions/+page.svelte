<!-- Incoming questions page — list, filter, answer inline, new question form -->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import type { IncomingQuestion } from '$types';
	import { QUESTION_STATUSES, QUESTION_STATUS_LABELS } from '$types';
	import FilterBar from '$components/FilterBar.svelte';
	import EmptyState from '$components/EmptyState.svelte';
	import QuestionList from '$components/questions/QuestionList.svelte';
	import NewQuestionForm from '$components/questions/NewQuestionForm.svelte';

	export let data: PageData;

	let statusFilter = '';
	let showNewForm = false;
	let submitting = false;
	let errorMessage = '';

	$: projectId = $page.params.id;
	$: questions = (data.questions ?? []) as IncomingQuestion[];
	$: filtered = statusFilter
		? questions.filter((q) => q.status === statusFilter)
		: questions;

	$: filterConfig = [{
		key: 'status',
		label: 'Status',
		options: QUESTION_STATUSES.map((s) => ({
			value: s, label: QUESTION_STATUS_LABELS[s]
		}))
	}];

	function handleFilter(key: string, value: string): void {
		if (key === 'status') statusFilter = value;
	}

	async function handleNewQuestion(formData: {
		question_text: string;
		reference_document: string;
		is_rectification: boolean;
		rectification_text: string;
	}): Promise<void> {
		submitting = true;
		errorMessage = '';
		try {
			const res = await fetch(`/api/projects/${projectId}/questions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Vraag registreren mislukt';
				return;
			}
			showNewForm = false;
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
		finally { submitting = false; }
	}

	async function handleAnswer(id: string, answerText: string): Promise<void> {
		errorMessage = '';
		try {
			const res = await fetch(`/api/projects/${projectId}/questions/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ answer_text: answerText, status: 'answered' })
			});
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Antwoord opslaan mislukt';
				return;
			}
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}

	async function handleApprove(id: string): Promise<void> {
		errorMessage = '';
		try {
			const res = await fetch(`/api/projects/${projectId}/questions/${id}/approve`, {
				method: 'POST'
			});
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Goedkeuring mislukt';
				return;
			}
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}

	async function handleStatusChange(id: string, status: string): Promise<void> {
		errorMessage = '';
		try {
			const res = await fetch(`/api/projects/${projectId}/questions/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});
			if (!res.ok) {
				const json = await res.json();
				errorMessage = json.message ?? 'Status wijzigen mislukt';
				return;
			}
			await invalidateAll();
		} catch { errorMessage = 'Netwerkfout. Probeer het opnieuw.'; }
	}
</script>

<svelte:head>
	<title>Binnenkomende vragen — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-lg font-semibold text-gray-900">Binnenkomende vragen</h1>
			<p class="mt-1 text-sm text-gray-500">Beheer vragen van leveranciers voor dit project</p>
		</div>
		<button
			type="button"
			on:click={() => { showNewForm = !showNewForm; }}
			class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
		>
			+ Nieuwe vraag
		</button>
	</div>

	{#if errorMessage}
		<div class="rounded-card bg-error-50 p-4" role="alert">
			<p class="text-sm text-error-700">{errorMessage}</p>
		</div>
	{/if}

	{#if data.loadError}
		<div class="rounded-card bg-error-50 p-4" role="alert">
			<p class="text-sm text-error-700">{data.loadError}</p>
		</div>
	{/if}

	{#if showNewForm}
		<NewQuestionForm
			onSubmit={handleNewQuestion}
			onCancel={() => { showNewForm = false; }}
			{submitting}
		/>
	{/if}

	{#if questions.length > 0}
		<FilterBar
			placeholder="Zoeken in vragen..."
			filters={filterConfig}
			onSearch={() => {}}
			onFilter={handleFilter}
		/>
	{/if}

	{#if questions.length === 0 && !data.loadError}
		<EmptyState
			title="Nog geen vragen"
			description="Registreer een nieuwe binnenkomende vraag."
			icon="document"
		/>
	{/if}

	{#if questions.length > 0 && filtered.length === 0}
		<EmptyState
			title="Geen resultaten"
			description="Geen vragen gevonden met deze status."
			icon="search"
		/>
	{/if}

	{#if filtered.length > 0}
		<QuestionList
			questions={filtered}
			onAnswer={handleAnswer}
			onApprove={handleApprove}
			onStatusChange={handleStatusChange}
		/>
	{/if}
</div>
