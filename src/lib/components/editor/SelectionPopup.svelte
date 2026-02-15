<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let visible = false;
	export let y = 0;

	const dispatch = createEventDispatcher<{ aiRewrite: void; addComment: void }>();
</script>

{#if visible}
	<div class="comment-popup absolute z-20 flex flex-col gap-2" style="right: -3.5rem; top: {y}px;">
		<button
			on:click={() => dispatch('aiRewrite')}
			class="flex h-9 w-9 items-center justify-center rounded-full shadow-md ring-2 ring-white transition-transform hover:scale-110"
			title="AI herschrijven"
			aria-label="AI herschrijven"
			type="button"
		>
			<img src="/avatar.png" alt="AI" class="h-9 w-9 rounded-full" />
		</button>
		<button
			on:click={() => dispatch('addComment')}
			class="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 shadow-md ring-2 ring-white transition-transform hover:scale-110 hover:bg-amber-500"
			title="Opmerking toevoegen"
			aria-label="Opmerking toevoegen"
			type="button"
		>
			<svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
		</button>
	</div>
{/if}

<style>
	.comment-popup {
		animation: comment-pop 0.15s ease-out;
	}
	@keyframes comment-pop {
		from { transform: scale(0.8); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
</style>
