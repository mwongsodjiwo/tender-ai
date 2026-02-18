<!-- Settings Retention tab — retention profile, archive years, anonymization -->
<script lang="ts">
	import type { OrganizationSettings, RetentionProfile } from '$types';
	import { ANONYMIZATION_STRATEGIES } from '$types';

	export let settings: OrganizationSettings | null = null;
	export let retentionProfiles: RetentionProfile[] = [];
	export let canEdit = false;
	export let onSave: (data: Record<string, unknown>) => void = () => {};

	let retentionProfile = settings?.retention_profile ?? 'vng_2020';
	let archiveYearsGranted = settings?.retention_archive_years_granted ?? 7;
	let archiveYearsNotGranted = settings?.retention_archive_years_not_granted ?? 5;
	let personalDataYears = settings?.retention_personal_data_years ?? 1;
	let operationalYears = settings?.retention_operational_years ?? 1;
	let anonymizationStrategy = settings?.anonymization_strategy ?? 'replace';
	let autoArchive = settings?.auto_archive_on_contract_end ?? true;
	let notifyExpired = settings?.notify_retention_expired ?? true;

	const STRATEGY_LABELS: Record<string, string> = {
		replace: 'Vervangen door placeholder',
		remove: 'Volledig verwijderen'
	};

	function applyProfile(profileId: string): void {
		const profile = retentionProfiles.find((p) => p.id === profileId);
		if (!profile) return;
		archiveYearsGranted = profile.archive_years_granted;
		archiveYearsNotGranted = profile.archive_years_not_granted;
		personalDataYears = profile.personal_data_years;
		operationalYears = profile.operational_years;
	}

	function handleProfileChange(): void {
		applyProfile(retentionProfile);
	}

	function handleSave(): void {
		onSave({
			retention_profile: retentionProfile,
			retention_archive_years_granted: archiveYearsGranted,
			retention_archive_years_not_granted: archiveYearsNotGranted,
			retention_personal_data_years: personalDataYears,
			retention_operational_years: operationalYears,
			anonymization_strategy: anonymizationStrategy,
			auto_archive_on_contract_end: autoArchive,
			notify_retention_expired: notifyExpired
		});
	}
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-base font-medium text-gray-900">Retentie-instellingen</h3>
		<p class="mt-1 text-sm text-gray-500">
			Configureer bewaartermijnen conform de Archiefwet 2015.
		</p>
	</div>

	<div class="rounded-card border border-gray-200 bg-white p-6 shadow-card space-y-4">
		<div>
			<label for="retention-profile" class="block text-sm font-medium text-gray-700">
				Selectielijst profiel
			</label>
			<select
				id="retention-profile"
				bind:value={retentionProfile}
				on:change={handleProfileChange}
				disabled={!canEdit}
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
					{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
				aria-label="Selectielijst profiel"
			>
				{#each retentionProfiles as profile (profile.id)}
					<option value={profile.id}>{profile.name}</option>
				{/each}
			</select>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div>
				<label for="archive-granted" class="block text-sm font-medium text-gray-700">
					Bewaartermijn gegund (jaren)
				</label>
				<input id="archive-granted" type="number" bind:value={archiveYearsGranted}
					disabled={!canEdit} min="0" max="100"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}" />
			</div>
			<div>
				<label for="archive-not-granted" class="block text-sm font-medium text-gray-700">
					Bewaartermijn niet-gegund (jaren)
				</label>
				<input id="archive-not-granted" type="number" bind:value={archiveYearsNotGranted}
					disabled={!canEdit} min="0" max="100"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}" />
			</div>
			<div>
				<label for="personal-years" class="block text-sm font-medium text-gray-700">
					Persoonsgegevens (jaren)
				</label>
				<input id="personal-years" type="number" bind:value={personalDataYears}
					disabled={!canEdit} min="0" max="100"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}" />
			</div>
			<div>
				<label for="operational-years" class="block text-sm font-medium text-gray-700">
					Operationele data (jaren)
				</label>
				<input id="operational-years" type="number" bind:value={operationalYears}
					disabled={!canEdit} min="0" max="100"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
						{!canEdit ? 'bg-gray-50 text-gray-500' : ''}" />
			</div>
		</div>

		<div>
			<label for="anonymization" class="block text-sm font-medium text-gray-700">
				Anonimisatie strategie
			</label>
			<select id="anonymization" bind:value={anonymizationStrategy} disabled={!canEdit}
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm
					{!canEdit ? 'bg-gray-50 text-gray-500' : ''}"
				aria-label="Anonimisatie strategie">
				{#each ANONYMIZATION_STRATEGIES as s (s)}
					<option value={s}>{STRATEGY_LABELS[s]}</option>
				{/each}
			</select>
		</div>

		<div class="space-y-2">
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={autoArchive} disabled={!canEdit}
					class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
				<span class="text-sm text-gray-700">Automatisch archiveren bij contracteinde</span>
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={notifyExpired} disabled={!canEdit}
					class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
				<span class="text-sm text-gray-700">Melding bij verlopen bewaartermijn</span>
			</label>
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
