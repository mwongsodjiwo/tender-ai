<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	let { supabase, session } = data;
	$: ({ supabase, session } = data);

	onMount(() => {
		const { data: authData } = supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => authData.subscription.unsubscribe();
	});
</script>

<!-- Global navigation loading indicator -->
{#if $navigating}
	<div class="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-primary-100" role="progressbar" aria-label="Pagina wordt geladen">
		<div class="h-full w-1/3 animate-pulse bg-primary-600" style="animation: loading-bar 1s ease-in-out infinite;"></div>
	</div>
{/if}

<slot />

<style>
	@keyframes loading-bar {
		0% { transform: translateX(-100%); }
		50% { transform: translateX(200%); }
		100% { transform: translateX(400%); }
	}
</style>
