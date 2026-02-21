<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let currentLogoUrl: string | null = null;
	export let uploadEndpoint: string;
	export let organizationName = '';

	const dispatch = createEventDispatcher<{ uploaded: { logo_url: string } }>();

	const MAX_FILE_SIZE = 2 * 1024 * 1024;
	const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

	let uploading = false;
	let dragOver = false;
	let errorMessage = '';
	let fileInput: HTMLInputElement;

	function validateFile(file: File): string | null {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			return 'Alleen PNG, JPG, SVG of WebP bestanden zijn toegestaan.';
		}
		if (file.size > MAX_FILE_SIZE) {
			return 'Bestand mag maximaal 2 MB zijn.';
		}
		return null;
	}

	async function uploadFile(file: File): Promise<void> {
		const validationError = validateFile(file);
		if (validationError) {
			errorMessage = validationError;
			return;
		}

		uploading = true;
		errorMessage = '';

		try {
			const formData = new FormData();
			formData.append('logo', file);

			const response = await fetch(uploadEndpoint, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const result = await response.json();
				errorMessage = result.message ?? 'Upload mislukt.';
				return;
			}

			const result = await response.json();
			currentLogoUrl = result.data.logo_url;
			dispatch('uploaded', { logo_url: result.data.logo_url });
		} catch {
			errorMessage = 'Er is een netwerkfout opgetreden.';
		} finally {
			uploading = false;
		}
	}

	function handleFileSelect(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) uploadFile(file);
	}

	function handleDrop(event: DragEvent): void {
		dragOver = false;
		const file = event.dataTransfer?.files[0];
		if (file) uploadFile(file);
	}

	function handleDragOver(): void {
		dragOver = true;
	}

	function handleDragLeave(): void {
		dragOver = false;
	}

	$: initials = organizationName
		.split(' ')
		.slice(0, 2)
		.map((w) => w.charAt(0).toUpperCase())
		.join('');
</script>

<div class="space-y-3">
	<label for="logo-upload" class="block text-sm font-medium text-gray-700">Logo</label>

	<div class="flex items-center gap-5">
		<!-- Preview -->
		<div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
			{#if currentLogoUrl}
				<img
					src={currentLogoUrl}
					alt="Logo van {organizationName}"
					class="h-full w-full object-contain"
				/>
			{:else}
				<span class="text-lg font-semibold text-gray-400">{initials || '?'}</span>
			{/if}
		</div>

		<!-- Upload area -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<button
			type="button"
			class="relative flex flex-1 cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-4 transition-colors
				{dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}"
			on:click={() => fileInput.click()}
			on:drop|preventDefault={handleDrop}
			on:dragover|preventDefault={handleDragOver}
			on:dragleave={handleDragLeave}
			disabled={uploading}
		>
			{#if uploading}
				<svg class="h-5 w-5 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24" aria-hidden="true">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				<span class="mt-1 text-xs text-gray-500">Uploaden...</span>
			{:else}
				<svg class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
				<span class="mt-1 text-xs text-gray-500">
					Sleep een bestand of <span class="font-medium text-primary-600">klik om te uploaden</span>
				</span>
				<span class="mt-0.5 text-[10px] text-gray-400">PNG, JPG, SVG of WebP &middot; max 2 MB</span>
			{/if}
		</button>

		<input
			id="logo-upload"
			bind:this={fileInput}
			type="file"
			accept=".png,.jpg,.jpeg,.svg,.webp"
			class="hidden"
			on:change={handleFileSelect}
		/>
	</div>

	{#if errorMessage}
		<p class="text-sm text-error-600" role="alert">{errorMessage}</p>
	{/if}
</div>
