<script lang="ts">
	import Navigation from '$components/Navigation.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<div class="min-h-screen bg-gray-50">
	<Navigation supabase={data.supabase} profile={data.profile} isSuperadmin={data.isSuperadmin} />
	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<slot />
	</main>
</div>
