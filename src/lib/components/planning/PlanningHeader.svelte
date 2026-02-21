<script lang="ts">
	export let showExportMenu: boolean;
	export let onExport: (format: 'ical' | 'csv') => void;
	export let onToggleExportMenu: () => void;
	export let onAdd: () => void;
</script>

<div class="flex items-center justify-between">
	<h1 class="text-2xl font-semibold text-gray-900">Planning</h1>
	<div class="flex items-center gap-3">
		<!-- Export dropdown -->
		<div class="export-menu-wrapper relative">
			<button
				type="button"
				on:click|stopPropagation={onToggleExportMenu}
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
			>
				Exporteren
			</button>
			{#if showExportMenu}
				<div class="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
					<button
						type="button"
						on:click={() => onExport('ical')}
						class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
					>
						iCal (.ics)
					</button>
					<button
						type="button"
						on:click={() => onExport('csv')}
						class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
					>
						CSV (.csv)
					</button>
				</div>
			{/if}
		</div>
		<button
			type="button"
			on:click={onAdd}
			class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
		>
			+ Toevoegen
		</button>
	</div>
</div>
