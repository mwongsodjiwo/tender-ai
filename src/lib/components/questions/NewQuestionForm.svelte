<!-- New question form — inline form to register incoming question -->
<script lang="ts">
	export let onSubmit: (data: {
		question_text: string;
		reference_document: string;
		is_rectification: boolean;
		rectification_text: string;
	}) => void = () => {};
	export let onCancel: () => void = () => {};
	export let submitting = false;

	let questionText = '';
	let referenceDocument = '';
	let isRectification = false;
	let rectificationText = '';

	function handleSubmit(): void {
		if (!questionText.trim()) return;
		onSubmit({
			question_text: questionText.trim(),
			reference_document: referenceDocument.trim() || '',
			is_rectification: isRectification,
			rectification_text: rectificationText.trim() || ''
		});
	}

	function handleReset(): void {
		questionText = '';
		referenceDocument = '';
		isRectification = false;
		rectificationText = '';
		onCancel();
	}
</script>

<div class="rounded-card bg-white p-6 shadow-card space-y-4">
	<h3 class="text-base font-semibold text-gray-900">Nieuwe vraag registreren</h3>

	<div>
		<label for="question-text" class="block text-sm font-medium text-gray-700">
			Vraagtekst <span class="text-error-500">*</span>
		</label>
		<textarea
			id="question-text"
			bind:value={questionText}
			rows="3"
			class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
			placeholder="Voer de vraag in..."
			required
		></textarea>
	</div>

	<div>
		<label for="ref-doc" class="block text-sm font-medium text-gray-700">
			Documentreferentie
		</label>
		<input
			id="ref-doc"
			type="text"
			bind:value={referenceDocument}
			class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
			placeholder="Bijv. Aanbestedingsleidraad §3.2"
		/>
	</div>

	<div class="flex items-center gap-2">
		<input
			id="is-rectification"
			type="checkbox"
			bind:checked={isRectification}
			class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
		/>
		<label for="is-rectification" class="text-sm text-gray-700">
			Dit is een rectificatie
		</label>
	</div>

	{#if isRectification}
		<div>
			<label for="rectification-text" class="block text-sm font-medium text-gray-700">
				Rectificatietekst
			</label>
			<textarea
				id="rectification-text"
				bind:value={rectificationText}
				rows="2"
				class="mt-1 block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
				placeholder="Corrigerend antwoord..."
			></textarea>
		</div>
	{/if}

	<div class="flex items-center justify-end gap-2 pt-2">
		<button
			type="button"
			on:click={handleReset}
			class="rounded-card border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
		>
			Annuleren
		</button>
		<button
			type="button"
			on:click={handleSubmit}
			disabled={!questionText.trim() || submitting}
			class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
		>
			{#if submitting}Registreren...{:else}Vraag registreren{/if}
		</button>
	</div>
</div>
