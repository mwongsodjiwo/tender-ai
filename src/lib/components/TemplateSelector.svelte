<script lang="ts">
	import type { DocumentTemplate } from '$types/db/document-templates';
	import { createEventDispatcher } from 'svelte';

	export let templates: DocumentTemplate[] = [];
	export let selectedTemplateId: string | null = null;
	export let disabled = false;
	export let label = 'Template';

	const dispatch = createEventDispatcher<{
		select: { templateId: string | null };
	}>();

	$: hasMultiple = templates.length > 1;
	$: singleTemplate = templates.length === 1 ? templates[0] : null;

	$: if (singleTemplate && !selectedTemplateId) {
		selectedTemplateId = singleTemplate.id;
		dispatch('select', { templateId: singleTemplate.id });
	}

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const value = target.value || null;
		selectedTemplateId = value;
		dispatch('select', { templateId: value });
	}
</script>

{#if templates.length === 0}
	<p class="text-sm text-gray-500">Geen templates beschikbaar</p>
{:else if singleTemplate}
	<div class="flex items-center gap-2 text-sm text-gray-700">
		<span class="font-medium">{label}:</span>
		<span>{singleTemplate.name}</span>
		{#if singleTemplate.is_default}
			<span class="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">
				Standaard
			</span>
		{/if}
	</div>
{:else if hasMultiple}
	<div>
		<label for="template-select" class="block text-sm font-medium text-gray-700 mb-1">
			{label}
		</label>
		<select
			id="template-select"
			class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
			value={selectedTemplateId ?? ''}
			on:change={handleChange}
			{disabled}
			aria-label="Selecteer template"
		>
			<option value="">Kies een template...</option>
			{#each templates as tpl (tpl.id)}
				<option value={tpl.id}>
					{tpl.name}{tpl.is_default ? ' (standaard)' : ''}{tpl.category_type ? ` — ${tpl.category_type}` : ''}
				</option>
			{/each}
		</select>
	</div>
{/if}
