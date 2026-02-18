<!-- Settings Thresholds tab — EU procurement thresholds per category -->
<script lang="ts">
	import type { OrganizationSettings } from '$types';

	export let settings: OrganizationSettings | null = null;
	export let canEdit = false;
	export let onSave: (data: Record<string, unknown>) => void = () => {};

	let thresholdWorks = settings?.threshold_works ?? 5538000;
	let thresholdServicesCentral = settings?.threshold_services_central ?? 143000;
	let thresholdServicesDecentral = settings?.threshold_services_decentral ?? 221000;
	let thresholdSocialServices = settings?.threshold_social_services ?? 750000;
	let defaultCurrency = settings?.default_currency ?? 'EUR';

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('nl-NL', {
			style: 'currency',
			currency: defaultCurrency,
			minimumFractionDigits: 0
		}).format(value);
	}

	function handleSave(): void {
		onSave({
			threshold_works: thresholdWorks,
			threshold_services_central: thresholdServicesCentral,
			threshold_services_decentral: thresholdServicesDecentral,
			threshold_social_services: thresholdSocialServices,
			default_currency: defaultCurrency
		});
	}
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-base font-medium text-gray-900">Drempelwaarden</h3>
		<p class="mt-1 text-sm text-gray-500">
			Europese aanbestedingsdrempels voor procedureadvies.
		</p>
	</div>

	<div class="rounded-card border border-gray-200 bg-white p-6 shadow-card space-y-4">
		<div>
			<label for="threshold-works" class="block text-sm font-medium text-gray-700">
				Werken
			</label>
			<div class="mt-1 flex items-center gap-2">
				<input id="threshold-works" type="number" bind:value={thresholdWorks}
					disabled={!canEdit} min="0" step="1000"
					class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}" />
				<span class="text-xs text-gray-400 whitespace-nowrap">{formatCurrency(thresholdWorks)}</span>
			</div>
		</div>

		<div>
			<label for="threshold-services-central" class="block text-sm font-medium text-gray-700">
				Diensten (centrale overheid)
			</label>
			<div class="mt-1 flex items-center gap-2">
				<input id="threshold-services-central" type="number" bind:value={thresholdServicesCentral}
					disabled={!canEdit} min="0" step="1000"
					class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}" />
				<span class="text-xs text-gray-400 whitespace-nowrap">{formatCurrency(thresholdServicesCentral)}</span>
			</div>
		</div>

		<div>
			<label for="threshold-services-decentral" class="block text-sm font-medium text-gray-700">
				Diensten (decentrale overheid)
			</label>
			<div class="mt-1 flex items-center gap-2">
				<input id="threshold-services-decentral" type="number" bind:value={thresholdServicesDecentral}
					disabled={!canEdit} min="0" step="1000"
					class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}" />
				<span class="text-xs text-gray-400 whitespace-nowrap">{formatCurrency(thresholdServicesDecentral)}</span>
			</div>
		</div>

		<div>
			<label for="threshold-social" class="block text-sm font-medium text-gray-700">
				Sociale en specifieke diensten
			</label>
			<div class="mt-1 flex items-center gap-2">
				<input id="threshold-social" type="number" bind:value={thresholdSocialServices}
					disabled={!canEdit} min="0" step="1000"
					class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}" />
				<span class="text-xs text-gray-400 whitespace-nowrap">{formatCurrency(thresholdSocialServices)}</span>
			</div>
		</div>

		{#if canEdit}
			<div class="flex justify-end pt-2">
				<button type="button" on:click={handleSave}
					class="rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
					Opslaan
				</button>
			</div>
		{/if}
	</div>
</div>
