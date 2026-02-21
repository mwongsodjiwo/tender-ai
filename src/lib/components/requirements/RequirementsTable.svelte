<script lang="ts">
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { Requirement } from '$types/database';
	import type { RequirementCategory } from '$types';
	import { REQUIREMENT_CATEGORIES } from '$types';

	export let groupedRequirements: { category: RequirementCategory; label: string; items: Requirement[] }[];
	export let editingId: string | null;
	export let editForm: { title: string; description: string; priority: number };
	export let saving: boolean;
	export let onStartEdit: (req: Requirement) => void;
	export let onCancelEdit: () => void;
	export let onSaveEdit: (id: string) => void;
	export let onDelete: (id: string) => void;
	export let onDuplicate: (req: Requirement) => void;
	export let onReorder: (orderedIds: string[]) => void;

	let expandedCategories: Set<string> = new Set(REQUIREMENT_CATEGORIES);
	let draggedId: string | null = null;
	let dragOverId: string | null = null;

	const TYPE_BADGE_MAP: Record<string, string> = { eis: 'verplicht', wens: 'concept' };

	function toggleCategory(cat: string) {
		if (expandedCategories.has(cat)) {
			expandedCategories.delete(cat);
		} else {
			expandedCategories.add(cat);
		}
		expandedCategories = new Set(expandedCategories);
	}

	function renderStars(count: number): string {
		return '\u2605'.repeat(count) + '\u2606'.repeat(5 - count);
	}

	function handleDragStart(id: string) { draggedId = id; }

	function handleDragOver(id: string, event: DragEvent) {
		event.preventDefault();
		dragOverId = id;
	}

	function handleDragLeave() { dragOverId = null; }

	function handleDrop(targetId: string, categoryItems: Requirement[]) {
		if (!draggedId || draggedId === targetId) {
			draggedId = null;
			dragOverId = null;
			return;
		}
		const ids = categoryItems.map((r) => r.id);
		const fromIndex = ids.indexOf(draggedId);
		const toIndex = ids.indexOf(targetId);
		if (fromIndex === -1 || toIndex === -1) {
			draggedId = null;
			dragOverId = null;
			return;
		}
		ids.splice(fromIndex, 1);
		ids.splice(toIndex, 0, draggedId);
		draggedId = null;
		dragOverId = null;
		onReorder(ids);
	}
</script>

{#each groupedRequirements as group}
	<div class="rounded-card bg-white shadow-card">
		<button
			type="button"
			on:click={() => toggleCategory(group.category)}
			class="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
			aria-expanded={expandedCategories.has(group.category)}
		>
			<div class="flex items-center gap-3">
				<svg
					class="h-5 w-5 text-gray-500 transition-transform {expandedCategories.has(group.category) ? 'rotate-90' : ''}"
					fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
				<h2 class="text-base font-semibold text-gray-900">{group.label}</h2>
				<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
					{group.items.length}
				</span>
			</div>
		</button>

		{#if expandedCategories.has(group.category)}
			<div class="border-t border-gray-100">
				{#each group.items as req (req.id)}
					<div
						class="border-b border-gray-50 px-6 py-4 transition-colors last:border-b-0 {dragOverId === req.id ? 'bg-primary-50' : ''} {editingId === req.id ? 'bg-gray-50' : 'hover:bg-gray-50'}"
						draggable={editingId !== req.id}
						on:dragstart={() => handleDragStart(req.id)}
						on:dragover={(e) => handleDragOver(req.id, e)}
						on:dragleave={handleDragLeave}
						on:drop={() => handleDrop(req.id, group.items)}
						role="listitem"
					>
						{#if editingId === req.id}
							<div class="space-y-3">
								<input type="text" bind:value={editForm.title} class="block w-full rounded-card border border-gray-300 px-3 py-2 text-sm font-medium focus:border-primary-500 focus:ring-primary-500" />
								<textarea bind:value={editForm.description} rows="3" class="block w-full rounded-card border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"></textarea>
								<div class="flex items-center gap-4">
									<div class="flex items-center gap-2">
										<label for="edit-priority" class="text-xs text-gray-500">Prioriteit:</label>
										<input id="edit-priority" type="number" bind:value={editForm.priority} min="1" max="5" class="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:ring-primary-500" />
									</div>
								</div>
								<div class="flex items-center gap-2">
									<button type="button" on:click={() => onSaveEdit(req.id)} disabled={saving} class="rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50">
										{saving ? 'Opslaan...' : 'Opslaan'}
									</button>
									<button type="button" on:click={onCancelEdit} class="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
										Annuleren
									</button>
								</div>
							</div>
						{:else}
							<div class="flex items-start justify-between gap-4">
								<div class="flex items-start gap-3 min-w-0">
									<div class="mt-1 cursor-grab text-gray-300 hover:text-gray-500" aria-hidden="true">
										<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
											<circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
											<circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
											<circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
										</svg>
									</div>
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<span class="text-xs font-mono text-gray-500">{req.requirement_number}</span>
											<StatusBadge status={TYPE_BADGE_MAP[req.requirement_type] ?? 'concept'} />
										</div>
										<h3 class="mt-1 text-sm font-medium text-gray-900">{req.title}</h3>
										{#if req.description}
											<p class="mt-1 text-sm text-gray-500 line-clamp-2">{req.description}</p>
										{/if}
										<div class="mt-2 flex items-center gap-4 text-xs text-gray-500">
											<span class="text-warning-500" title="Prioriteit {req.priority}/5" aria-label="Prioriteit {req.priority} van 5">
												{renderStars(req.priority)}
											</span>
										</div>
									</div>
								</div>
								<div class="flex shrink-0 items-center gap-1">
									<button type="button" on:click={() => onStartEdit(req)} class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-600" title="Bewerken" aria-label="Eis bewerken">
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
									</button>
									<button type="button" on:click={() => onDuplicate(req)} class="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-600" title="Kopiëren" aria-label="Eis kopiëren">
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
										</svg>
									</button>
									<button type="button" on:click={() => onDelete(req.id)} class="rounded p-1.5 text-gray-500 hover:bg-error-50 hover:text-error-600" title="Verwijderen" aria-label="Eis verwijderen">
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/each}
