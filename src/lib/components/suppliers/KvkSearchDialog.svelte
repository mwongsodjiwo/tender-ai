<!-- KVK Search Dialog — search KVK register, select result, auto-fill supplier -->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { focusTrap } from '$lib/utils/focus-trap';

	interface KvkResult {
		kvkNummer: string;
		handelsnaam: string;
		straatnaam: string | null;
		postcode: string | null;
		plaats: string | null;
		type: string | null;
		rechtsvorm: string | null;
	}

	export let open: boolean = false;
	export let onClose: () => void = () => {};
	export let onSelect: (result: KvkResult) => void = () => {};

	let searchNaam = '';
	let searchKvk = '';
	let searchPlaats = '';
	let results: KvkResult[] = [];
	let searching = false;
	let errorMessage = '';
	let hasSearched = false;

	async function handleSearch(): Promise<void> {
		if (!searchNaam && !searchKvk) {
			errorMessage = 'Vul ten minste een naam of KVK-nummer in';
			return;
		}

		searching = true;
		errorMessage = '';
		hasSearched = true;

		try {
			const params = new URLSearchParams();
			if (searchNaam) params.set('naam', searchNaam);
			if (searchKvk) params.set('kvkNummer', searchKvk);
			if (searchPlaats) params.set('plaats', searchPlaats);

			const response = await fetch(`/api/kvk/search?${params.toString()}`);
			const json = await response.json();

			if (!response.ok) {
				errorMessage = json.message ?? 'KVK zoeken mislukt';
				results = [];
				return;
			}

			const raw = json.data?.resultaten ?? [];
			results = raw.map((r: Record<string, unknown>) => {
				const adres = (r.adres as Record<string, unknown>) ?? {};
				const binnenlands = (adres.binnenlandsAdres as Record<string, unknown>) ?? {};
				return {
					kvkNummer: (r.kvkNummer as string) ?? '',
					handelsnaam: (r.naam as string) ?? '',
					straatnaam: (binnenlands.straatnaam as string) ?? null,
					postcode: (binnenlands.postcode as string) ?? null,
					plaats: (binnenlands.plaats as string) ?? null,
					type: (r.type as string) ?? null
				};
			});
		} catch {
			errorMessage = 'Netwerkfout. Probeer het opnieuw.';
			results = [];
		} finally {
			searching = false;
		}
	}

	async function handleSelect(result: KvkResult): Promise<void> {
		try {
			const res = await fetch(`/api/kvk/${result.kvkNummer}`);
			if (res.ok) {
				const json = await res.json();
				const profiel = json.data;
				const eigenaar = profiel?._embedded?.eigenaar ?? {};
				const hoofdvestiging = profiel?._embedded?.hoofdvestiging ?? {};
				const bezoekadres = (hoofdvestiging.adressen ?? [])
					.find((a: Record<string, unknown>) => a.type === 'bezoekadres');

				result.rechtsvorm = (eigenaar.rechtsvorm as string) ?? null;
				if (!result.straatnaam && bezoekadres?.straatnaam) {
					result.straatnaam = bezoekadres.straatnaam;
				}
				if (!result.postcode && bezoekadres?.postcode) {
					result.postcode = bezoekadres.postcode;
				}
				if (!result.plaats && bezoekadres?.plaats) {
					result.plaats = bezoekadres.plaats;
				}
			}
		} catch { /* gebruik zoekresultaat als fallback */ }

		onSelect(result);
		resetForm();
	}

	function resetForm(): void {
		searchNaam = '';
		searchKvk = '';
		searchPlaats = '';
		results = [];
		errorMessage = '';
		hasSearched = false;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		role="dialog"
		aria-modal="true"
		aria-label="KVK zoeken"
		on:keydown={(e) => { if (e.key === 'Escape') { resetForm(); onClose(); } }}
		use:focusTrap
	>
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px]"
			transition:fly={{ duration: 200, opacity: 0 }}
			on:click={() => { resetForm(); onClose(); }}
			aria-label="Sluiten"
			tabindex="-1"
		></button>

		<!-- Modal -->
		<div
			class="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
			transition:fly={{ y: 20, duration: 300 }}
		>
			<div class="flex items-center justify-between">
				<h3 class="text-base font-semibold text-gray-900">KVK Zoeken</h3>
				<button
					type="button"
					on:click={() => { resetForm(); onClose(); }}
					class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					aria-label="Sluiten"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Search form -->
			<form on:submit|preventDefault={handleSearch} class="mt-4 space-y-3">
				<div>
					<label for="kvk-search-naam" class="block text-sm font-medium text-gray-700">Bedrijfsnaam</label>
					<input id="kvk-search-naam" type="text" bind:value={searchNaam}
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
						placeholder="Bijv. Rijkswaterstaat" />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="kvk-search-kvk" class="block text-sm font-medium text-gray-700">KVK-nummer</label>
						<input id="kvk-search-kvk" type="text" bind:value={searchKvk}
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
							placeholder="12345678" />
					</div>
					<div>
						<label for="kvk-search-plaats" class="block text-sm font-medium text-gray-700">Plaats</label>
						<input id="kvk-search-plaats" type="text" bind:value={searchPlaats}
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
							placeholder="Amsterdam" />
					</div>
				</div>
				<button
					type="submit"
					disabled={searching}
					class="w-full rounded-card bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
				>
					{#if searching}Zoeken...{:else}Zoeken in KVK{/if}
				</button>
			</form>

			<!-- Error -->
			{#if errorMessage}
				<div class="mt-3 rounded-card bg-error-50 p-3" role="alert">
					<p class="text-sm text-error-700">{errorMessage}</p>
				</div>
			{/if}

			<!-- Results -->
			{#if results.length > 0}
				<ul class="mt-4 max-h-60 divide-y divide-gray-100 overflow-y-auto" role="listbox" aria-label="KVK resultaten">
					{#each results as result, i (i)}
						<li>
							<button
								type="button"
								on:click={() => handleSelect(result)}
								class="w-full px-3 py-3 text-left transition-colors hover:bg-primary-50"
								role="option"
							>
								<p class="text-sm font-medium text-gray-900">{result.handelsnaam}</p>
								<p class="text-xs text-gray-500">
									KVK {result.kvkNummer}
									{#if result.plaats} &middot; {result.plaats}{/if}
								</p>
							</button>
						</li>
					{/each}
				</ul>
			{:else if hasSearched && !searching && !errorMessage}
				<p class="mt-4 text-center text-sm text-gray-400">Geen resultaten gevonden</p>
			{/if}
		</div>
	</div>
{/if}
