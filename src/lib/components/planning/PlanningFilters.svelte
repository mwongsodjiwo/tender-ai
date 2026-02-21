<script lang="ts">
	type PlanningTab = 'deadlines' | 'timeline' | 'ai';

	export let activeTab: PlanningTab;
	export let deadlineView: 'list' | 'calendar';
	export let onTabChange: (tab: PlanningTab) => void;
	export let onViewChange: (view: 'list' | 'calendar') => void;

	const TABS: { id: PlanningTab; label: string; disabled: boolean }[] = [
		{ id: 'deadlines', label: 'Deadlines', disabled: false },
		{ id: 'timeline', label: 'Tijdlijn', disabled: false },
		{ id: 'ai', label: 'AI Suggesties', disabled: false }
	];
</script>

<!-- Tabs -->
<div class="border-b border-gray-200">
	<nav class="-mb-px flex space-x-6" aria-label="Planning tabs">
		<div role="tablist" class="flex space-x-6">
		{#each TABS as tab (tab.id)}
			<button
				role="tab"
				on:click={() => { if (!tab.disabled) onTabChange(tab.id); }}
				class="border-b-2 px-1 py-3 text-sm font-medium transition-colors
					{activeTab === tab.id
						? 'border-primary-500 text-primary-600'
						: tab.disabled
							? 'border-transparent text-gray-300 cursor-not-allowed'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
				disabled={tab.disabled}
				aria-selected={activeTab === tab.id}
			>
				{tab.label}
				{#if tab.disabled}
					<span class="ml-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
						Binnenkort
					</span>
				{/if}
			</button>
		{/each}
		</div>
	</nav>
</div>

<!-- View toggle (only for deadlines tab) -->
{#if activeTab === 'deadlines'}
	<div class="mb-4 mt-6 flex items-center justify-between">
		<div class="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
			<button
				type="button"
				on:click={() => onViewChange('list')}
				class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
					{deadlineView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
				aria-label="Lijstweergave"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
				</svg>
				Lijst
			</button>
			<button
				type="button"
				on:click={() => onViewChange('calendar')}
				class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
					{deadlineView === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
				aria-label="Kalenderweergave"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
				Kalender
			</button>
		</div>
	</div>
{/if}
