<!-- RetentionProfileSelector — dropdown for selectielijst profiles (VNG 2020, PROVISA) -->
<!-- Auto-fills retention periods on profile change, allows manual override -->
<script lang="ts">
	import type { RetentionProfile } from '$types';
	import type { RetentionProfileValues } from '$utils/governance';

	export let profiles: RetentionProfile[] = [];
	export let selectedProfileId = 'vng_2020';
	export let archiveYearsGranted = 7;
	export let archiveYearsNotGranted = 5;
	export let personalDataYears = 1;
	export let operationalYears = 1;
	export let disabled = false;

	/** Dispatched when any value changes (profile or override) */
	export let onChange: (values: RetentionProfileValues) => void = () => {};

	$: selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;

	function handleProfileChange(): void {
		if (!selectedProfile) return;
		archiveYearsGranted = selectedProfile.archive_years_granted;
		archiveYearsNotGranted = selectedProfile.archive_years_not_granted;
		personalDataYears = selectedProfile.personal_data_years;
		operationalYears = selectedProfile.operational_years;
		emitChange();
	}

	function emitChange(): void {
		onChange({
			profileId: selectedProfileId,
			archiveYearsGranted,
			archiveYearsNotGranted,
			personalDataYears,
			operationalYears
		});
	}

	const INPUT_BASE =
		'mt-1 block w-full rounded-md border-gray-300 shadow-sm ' +
		'focus:border-primary-500 focus:ring-primary-500 sm:text-sm';
	const DISABLED_CLASS = 'bg-gray-50 text-gray-500';
</script>

<fieldset class="space-y-4" {disabled}>
	<div>
		<label for="retention-profile" class="block text-sm font-medium text-gray-700">
			Selectielijst profiel
		</label>
		<select
			id="retention-profile"
			bind:value={selectedProfileId}
			on:change={handleProfileChange}
			class="{INPUT_BASE} {disabled ? DISABLED_CLASS : ''}"
			aria-describedby="profile-description"
		>
			{#each profiles as profile (profile.id)}
				<option value={profile.id}>{profile.name}</option>
			{/each}
		</select>
	</div>

	{#if selectedProfile}
		<div
			id="profile-description"
			class="rounded-md bg-blue-50 p-3 text-sm text-blue-800"
			role="note"
		>
			<p class="font-medium">{selectedProfile.name}</p>
			{#if selectedProfile.description}
				<p class="mt-1">{selectedProfile.description}</p>
			{/if}
			{#if selectedProfile.source}
				<p class="mt-1 text-xs text-blue-600">Bron: {selectedProfile.source}</p>
			{/if}
			<p class="mt-1 text-xs">
				Standaard: {selectedProfile.archive_years_granted} jaar gegund,
				{selectedProfile.archive_years_not_granted} jaar niet-gegund
			</p>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div>
			<label for="archive-granted" class="block text-sm font-medium text-gray-700">
				Bewaartermijn gegund (jaren)
			</label>
			<input
				id="archive-granted"
				type="number"
				bind:value={archiveYearsGranted}
				on:change={emitChange}
				min="0"
				max="100"
				class="{INPUT_BASE} {disabled ? DISABLED_CLASS : ''}"
			/>
		</div>
		<div>
			<label for="archive-not-granted" class="block text-sm font-medium text-gray-700">
				Bewaartermijn niet-gegund (jaren)
			</label>
			<input
				id="archive-not-granted"
				type="number"
				bind:value={archiveYearsNotGranted}
				on:change={emitChange}
				min="0"
				max="100"
				class="{INPUT_BASE} {disabled ? DISABLED_CLASS : ''}"
			/>
		</div>
		<div>
			<label for="personal-years" class="block text-sm font-medium text-gray-700">
				Persoonsgegevens (jaren)
			</label>
			<input
				id="personal-years"
				type="number"
				bind:value={personalDataYears}
				on:change={emitChange}
				min="0"
				max="100"
				class="{INPUT_BASE} {disabled ? DISABLED_CLASS : ''}"
			/>
		</div>
		<div>
			<label for="operational-years" class="block text-sm font-medium text-gray-700">
				Operationele data (jaren)
			</label>
			<input
				id="operational-years"
				type="number"
				bind:value={operationalYears}
				on:change={emitChange}
				min="0"
				max="100"
				class="{INPUT_BASE} {disabled ? DISABLED_CLASS : ''}"
			/>
		</div>
	</div>
</fieldset>
