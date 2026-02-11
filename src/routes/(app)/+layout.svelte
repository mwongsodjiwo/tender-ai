<script lang="ts">
	import Navigation from '$components/Navigation.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<div class="min-h-screen bg-[#F5F5F5]">
	<Navigation
		supabase={data.supabase}
		profile={data.profile}
		isSuperadmin={data.isSuperadmin}
		projects={data.projects}
		notifications={data.notifications}
		unreadNotificationCount={data.unreadNotificationCount}
	/>

	<!-- Main content area offset by sidebar width -->
	<main class="pt-14 lg:pl-60 lg:pt-0">
		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<slot />
		</div>
	</main>
</div>
