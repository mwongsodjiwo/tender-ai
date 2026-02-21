<script lang="ts">
	import DocumentUpload from '$lib/components/DocumentUpload.svelte';

	export let projectId: string;
	export let organizationId: string;
	export let onClose: () => void;
	export let onUploadComplete: () => void;
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center"
	role="dialog"
	tabindex="-1"
	aria-modal="true"
	aria-label="Document uploaden"
	on:keydown={(e) => { if (e.key === 'Escape') onClose(); }}
>
	<button
		type="button"
		class="absolute inset-0 bg-black/40 backdrop-blur-sm"
		on:click={onClose}
		aria-label="Sluiten"
		tabindex="-1"
	></button>
	<div class="relative w-full max-w-lg mx-4 animate-in">
		<button
			type="button"
			on:click={onClose}
			class="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-md hover:text-gray-600 transition-colors"
			aria-label="Sluiten"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
		<DocumentUpload
			{projectId}
			{organizationId}
			{onUploadComplete}
		/>
	</div>
</div>
