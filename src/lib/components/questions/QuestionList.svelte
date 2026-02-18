<!-- Question list — displays incoming questions with inline answering -->
<script lang="ts">
	import type { IncomingQuestion } from '$types';
	import { QUESTION_STATUS_LABELS } from '$types';
	import StatusBadge from '$components/StatusBadge.svelte';

	export let questions: IncomingQuestion[] = [];
	export let onAnswer: (id: string, answerText: string) => void = () => {};
	export let onApprove: (id: string) => void = () => {};
	export let onStatusChange: (id: string, status: string) => void = () => {};

	let expandedId: string | null = null;
	let answerDraft = '';

	function toggleExpand(id: string): void {
		if (expandedId === id) {
			expandedId = null;
			answerDraft = '';
		} else {
			expandedId = id;
			const q = questions.find((q) => q.id === id);
			answerDraft = q?.answer_text ?? '';
		}
	}

	function submitAnswer(id: string): void {
		if (!answerDraft.trim()) return;
		onAnswer(id, answerDraft.trim());
		expandedId = null;
		answerDraft = '';
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric', month: 'short', year: 'numeric'
		});
	}
</script>

<div class="space-y-3">
	{#each questions as question (question.id)}
		<div class="rounded-card bg-white shadow-card overflow-hidden">
			<button
				type="button"
				class="w-full px-6 py-4 text-left"
				on:click={() => toggleExpand(question.id)}
				on:keydown={(e) => { if (e.key === 'Enter') toggleExpand(question.id); }}
				aria-expanded={expandedId === question.id}
				aria-label="Vraag {question.question_number}"
			>
				<div class="flex items-start justify-between gap-4">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<span class="text-xs font-semibold text-gray-400">#{question.question_number}</span>
							<StatusBadge status={question.status} />
							{#if question.is_rectification}
								<span class="rounded-badge bg-warning-100 px-2 py-0.5 text-[10px] font-medium text-warning-700">Rectificatie</span>
							{/if}
						</div>
						<p class="mt-1 text-sm text-gray-900">{question.question_text}</p>
						{#if question.reference_document}
							<p class="mt-0.5 text-xs text-gray-400">Ref: {question.reference_document}</p>
						{/if}
					</div>
					<span class="shrink-0 text-xs text-gray-400">{formatDate(question.received_at)}</span>
				</div>

				{#if question.answer_text && expandedId !== question.id}
					<p class="mt-2 truncate text-sm text-gray-500">
						<span class="font-medium text-gray-600">Antwoord:</span> {question.answer_text}
					</p>
				{/if}
			</button>

			{#if expandedId === question.id}
				<div class="border-t border-gray-100 px-6 py-4 space-y-3">
					<label for="answer-{question.id}" class="block text-sm font-medium text-gray-700">
						Antwoord
					</label>
					<textarea
						id="answer-{question.id}"
						bind:value={answerDraft}
						rows="4"
						class="block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
						placeholder="Typ hier uw antwoord..."
					></textarea>
					<div class="flex items-center justify-between">
						<div class="flex gap-2">
							{#if question.status === 'answered' || question.answer_text}
								<button
									type="button"
									on:click={() => onApprove(question.id)}
									class="rounded-card bg-success-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-success-700"
								>
									Goedkeuren
								</button>
							{/if}
							{#if question.status === 'received'}
								<button
									type="button"
									on:click={() => onStatusChange(question.id, 'in_review')}
									class="rounded-card border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
								>
									In behandeling
								</button>
							{/if}
						</div>
						<button
							type="button"
							on:click={() => submitAnswer(question.id)}
							disabled={!answerDraft.trim()}
							class="rounded-card bg-primary-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
						>
							Antwoord opslaan
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/each}
</div>
