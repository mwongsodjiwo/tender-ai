<script lang="ts">
	import Navigation from '$components/Navigation.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { initOrganizationContext } from '$stores/organization-context';
	import { sidebarWidth } from '$lib/stores/sidebarWidth';
	import { browser } from '$app/environment';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: initOrganizationContext(data.organizations ?? []);

	// Sync sidebar width to :root so CSS inherits it everywhere.
	// The blocking script in app.html handles the initial value before hydration.
	$: if (browser) {
		document.documentElement.style.setProperty('--sidebar-width', $sidebarWidth + 'px');
	}
</script>

<div class="min-h-screen bg-[#F5F5F5]">
	<Navigation
		supabase={data.supabase}
		profile={data.profile}
		isSuperadmin={data.isSuperadmin}
		organizations={data.organizations}
		projects={data.projects}
		notifications={data.notifications}
		unreadNotificationCount={data.unreadNotificationCount}
	/>

	<!-- Main content area offset by sidebar width -->
	<main class="pt-14 lg:pt-0">
		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<slot />
		</div>
	</main>
</div>

<Toast />

<style>
	@media (min-width: 1024px) {
		main {
			padding-left: var(--sidebar-width, 240px);
		}
	}
</style>
