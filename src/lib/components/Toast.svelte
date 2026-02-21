<!--
  Toast — floating notification messages (success / error).
  Driven by the $lib/stores/toast store.
-->
<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts } from '$lib/stores/toast';
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
	{#each $toasts as toast (toast.id)}
		<div
			transition:fly={{ y: 20, duration: 250 }}
			class="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg
				{toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}"
			role="status"
		>
			{toast.message}
			<button
				type="button"
				on:click={() => toasts.remove(toast.id)}
				class="ml-2 rounded p-0.5 hover:bg-white/20"
				aria-label="Sluiten"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/each}
</div>
