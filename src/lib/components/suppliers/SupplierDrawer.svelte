<!-- SupplierDrawer — 40% wide slide-in panel with 5 tabs -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { focusTrap } from '$lib/utils/focus-trap';
	import type { Supplier, SupplierContact, ProjectSupplier } from '$types';
	import SupplierOverviewTab from './SupplierOverviewTab.svelte';
	import SupplierTendersTab from './SupplierTendersTab.svelte';
	import SupplierCorrespondenceTab from './SupplierCorrespondenceTab.svelte';
	import SupplierQualificationTab from './SupplierQualificationTab.svelte';
	import SupplierNotesTab from './SupplierNotesTab.svelte';

	export let supplier: Supplier | null = null;
	export let contacts: SupplierContact[] = [];
	export let projectLinks: { projectSupplier: ProjectSupplier; projectName: string }[] = [];
	export let onClose: () => void = () => {};
	export let onSaveNotes: (notes: string) => void = () => {};

	const TABS = [
		{ key: 'overzicht', label: 'Overzicht' },
		{ key: 'aanbestedingen', label: 'Aanbestedingen' },
		{ key: 'correspondentie', label: 'Correspondentie' },
		{ key: 'kwalificatie', label: 'Kwalificatie' },
		{ key: 'notities', label: 'Notities' }
	] as const;

	type TabKey = (typeof TABS)[number]['key'];
	let activeTab: TabKey = 'overzicht';
</script>

{#if supplier}
	<div
		class="fixed inset-0 z-40"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label="Leverancier details: {supplier.company_name}"
		on:keydown={(e) => { if (e.key === 'Escape') onClose(); }}
		use:focusTrap
	>
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px]"
			transition:fly={{ duration: 250, opacity: 0 }}
			on:click={onClose}
			aria-label="Sluiten"
			tabindex="-1"
		></button>

		<!-- Panel: 40% wide -->
		<div
			class="absolute right-0 top-0 bottom-0 z-10 flex w-[40vw] min-w-[400px] flex-col overflow-hidden rounded-l-2xl bg-white shadow-2xl"
			transition:fly={{ x: 500, duration: 350, easing: cubicOut }}
		>
			<!-- Header -->
			<div class="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-4">
				<div class="flex items-center justify-between">
					<h2 class="text-base font-semibold text-gray-900">{supplier.company_name}</h2>
					<button
						type="button"
						on:click={onClose}
						class="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
						aria-label="Sluiten"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Tab bar -->
				<nav class="mt-3 flex gap-1 overflow-x-auto" aria-label="Leverancier tabs">
					{#each TABS as tab (tab.key)}
						<button
							type="button"
							on:click={() => { activeTab = tab.key; }}
							class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
								{activeTab === tab.key
									? 'bg-primary-50 text-primary-700'
									: 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
							aria-selected={activeTab === tab.key}
							role="tab"
						>
							{tab.label}
						</button>
					{/each}
				</nav>
			</div>

			<!-- Tab content (scrollable) -->
			<div class="flex-1 overflow-y-auto p-6">
				{#if activeTab === 'overzicht'}
					<SupplierOverviewTab {supplier} {contacts} />
				{:else if activeTab === 'aanbestedingen'}
					<SupplierTendersTab {projectLinks} />
				{:else if activeTab === 'correspondentie'}
					<SupplierCorrespondenceTab letters={[]} />
				{:else if activeTab === 'kwalificatie'}
					<SupplierQualificationTab qualifications={[]} />
				{:else if activeTab === 'notities'}
					<SupplierNotesTab notes={supplier.notes} onSave={onSaveNotes} />
				{/if}
			</div>
		</div>
	</div>
{/if}
