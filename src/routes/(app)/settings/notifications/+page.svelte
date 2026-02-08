<script lang="ts">
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	export let data: PageData;

	// Local storage key for notification preferences
	const STORAGE_KEY = 'tendermanager_notification_prefs';

	// Notification preference definitions with Dutch labels
	const NOTIFICATION_OPTIONS = [
		{
			key: 'email_on_review',
			label: 'Review-verzoeken',
			description: 'Ontvang een e-mail wanneer een sectie ter review aan u wordt toegewezen.'
		},
		{
			key: 'email_on_comment',
			label: 'Opmerkingen',
			description: 'Ontvang een e-mail wanneer er een opmerking wordt geplaatst bij uw secties.'
		},
		{
			key: 'email_on_mention',
			label: 'Vermeldingen',
			description: 'Ontvang een e-mail wanneer u wordt vermeld in een opmerking of bespreking.'
		},
		{
			key: 'email_on_status_change',
			label: 'Statuswijzigingen',
			description: 'Ontvang een e-mail wanneer de status van een project of sectie wijzigt.'
		}
	] as const;

	// Default preferences — all enabled
	const DEFAULT_PREFERENCES: Record<string, boolean> = {
		email_on_review: true,
		email_on_comment: true,
		email_on_mention: true,
		email_on_status_change: false
	};

	// Load preferences from localStorage
	function loadPreferences(): Record<string, boolean> {
		if (!browser) return { ...DEFAULT_PREFERENCES };

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed: unknown = JSON.parse(stored);
				if (typeof parsed === 'object' && parsed !== null) {
					return { ...DEFAULT_PREFERENCES, ...(parsed as Record<string, boolean>) };
				}
			}
		} catch {
			// Ignore parse errors, return defaults
		}
		return { ...DEFAULT_PREFERENCES };
	}

	// Save preferences to localStorage
	function savePreferences(prefs: Record<string, boolean>): void {
		if (!browser) return;

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
		} catch {
			// Ignore storage errors
		}
	}

	let preferences = loadPreferences();
	let successMessage = '';

	function handleToggle(key: string): void {
		preferences[key] = !preferences[key];
		preferences = preferences; // Trigger reactivity
	}

	function handleSave(): void {
		savePreferences(preferences);
		successMessage = 'Meldingsvoorkeuren succesvol opgeslagen.';

		// Auto-dismiss after a delay
		const DISMISS_DELAY_MS = 3000;
		setTimeout(() => {
			successMessage = '';
		}, DISMISS_DELAY_MS);
	}
</script>

<svelte:head>
	<title>Meldingen — Instellingen — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-medium text-gray-900">Meldingen</h2>
		<p class="mt-1 text-sm text-gray-500">
			Configureer wanneer u e-mailmeldingen wilt ontvangen.
		</p>
	</div>

	<!-- Success message -->
	{#if successMessage}
		<div class="rounded-md bg-green-50 p-4" role="status">
			<div class="flex">
				<svg class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<p class="ml-3 text-sm text-green-700">{successMessage}</p>
			</div>
		</div>
	{/if}

	<!-- Info banner about MVP storage -->
	<div class="rounded-md bg-blue-50 p-4" role="note">
		<div class="flex">
			<svg class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<p class="ml-3 text-sm text-blue-700">
				Meldingsvoorkeuren worden lokaal opgeslagen. E-mailmeldingen worden in een toekomstige versie geactiveerd.
			</p>
		</div>
	</div>

	<form
		on:submit|preventDefault={handleSave}
		class="rounded-lg border border-gray-200 bg-white transition hover:shadow-sm"
	>
		<div class="p-6">
			<h3 class="text-base font-medium text-gray-900">E-mailmeldingen</h3>
			<p class="mt-1 text-sm text-gray-500">
				Selecteer welke meldingen u per e-mail wilt ontvangen.
			</p>
		</div>

		<div class="border-t border-gray-200">
			<ul class="divide-y divide-gray-200" role="list" aria-label="Meldingsvoorkeuren">
				{#each NOTIFICATION_OPTIONS as option (option.key)}
					<li class="flex items-center justify-between px-6 py-4">
						<div class="flex-1">
							<label
								for="toggle-{option.key}"
								class="text-sm font-medium text-gray-900 cursor-pointer"
							>
								{option.label}
							</label>
							<p class="mt-0.5 text-sm text-gray-500">{option.description}</p>
						</div>
						<div class="ml-4">
							<button
								id="toggle-{option.key}"
								type="button"
								role="switch"
								aria-checked={preferences[option.key]}
								on:click={() => handleToggle(option.key)}
								class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
									{preferences[option.key] ? 'bg-primary-600' : 'bg-gray-200'}"
							>
								<span class="sr-only">{option.label} inschakelen</span>
								<span
									aria-hidden="true"
									class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
										{preferences[option.key] ? 'translate-x-5' : 'translate-x-0'}"
								/>
							</button>
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<div class="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-3">
			<button
				type="submit"
				class="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
			>
				Voorkeuren opslaan
			</button>
		</div>
	</form>
</div>
