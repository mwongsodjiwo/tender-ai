<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Organization, Profile, ProjectStatus, Notification } from '$types';
	import { lastProjectId } from '$lib/stores/lastProject';
	import { initOrganizationContext } from '$stores/organization-context';
	import OrganizationSwitcher from '$components/OrganizationSwitcher.svelte';
	import ContextBadge from '$components/ContextBadge.svelte';
	import NotificationBell from '$lib/components/notifications/NotificationBell.svelte';
	import NavBreadcrumbs from '$components/NavBreadcrumbs.svelte';
	import NavProjectMenu from '$components/NavProjectMenu.svelte';
	import NavUserMenu from '$components/NavUserMenu.svelte';
	import { focusTrap } from '$lib/utils/focus-trap';
	import SidebarResizeHandle from '$components/SidebarResizeHandle.svelte';

	export let supabase: SupabaseClient;
	export let profile: Profile | null;
	export let isSuperadmin: boolean = false;
	export let organizations: Organization[] = [];
	export let projects: { id: string; name: string; status: ProjectStatus; updated_at: string }[] = [];
	export let notifications: Notification[] = [];
	export let unreadNotificationCount: number = 0;

	$: initOrganizationContext(organizations);

	let mobileOpen = false;

	const BASE_NAV_LINKS = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'home' },
		{ href: '/planning', label: 'Planning', icon: 'calendar' },
		{ href: '/suppliers', label: 'Leveranciers', icon: 'building' },
		{ href: '/time-tracking', label: 'Urenregistratie', icon: 'clock' }
	];

	$: NAV_LINKS = isSuperadmin
		? [...BASE_NAV_LINKS, { href: '/admin', label: 'Beheer', icon: 'settings' }]
		: BASE_NAV_LINKS;

	$: currentPath = $page.url.pathname;
	$: urlProjectId = $page.params.id ?? null;

	$: if (urlProjectId) {
		lastProjectId.set(urlProjectId);
	}

	$: activeProjectId = urlProjectId
		?? (projects.some((p) => p.id === $lastProjectId) ? $lastProjectId : null);

	function handleOrgSwitch() { invalidateAll(); }
	function closeMobile() { mobileOpen = false; }

	async function handleMarkAllRead() {
		await fetch('/api/notifications', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mark_all_read: true })
		});
		unreadNotificationCount = 0;
		notifications = notifications.map((n) => ({ ...n, is_read: true }));
	}

	function handleNotificationClick(n: Notification) {
		if (n.project_id) goto(`/projects/${n.project_id}/planning`);
	}
</script>

<!-- Mobile top bar -->
<div class="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
	<a href="/dashboard" class="flex items-center gap-2 text-lg font-semibold text-primary-600">
		<img src="/logo.png" alt="Tendermanager logo" class="h-7 w-7 rounded-full" />
		Tendermanager
	</a>
	<div class="flex items-center gap-1">
		<ContextBadge />
		<NotificationBell
			unreadCount={unreadNotificationCount}
			{notifications}
			onMarkAllRead={handleMarkAllRead}
			onViewAll={() => goto('/notifications')}
			onNotificationClick={handleNotificationClick}
		/>
		<button
			on:click={() => (mobileOpen = !mobileOpen)}
			class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
			aria-label="Menu openen"
			aria-expanded={mobileOpen}
		>
		{#if mobileOpen}
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		{:else}
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		{/if}
	</button>
	</div>
</div>

<!-- Mobile overlay -->
{#if mobileOpen}
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black/30 lg:hidden"
		on:click={closeMobile}
		on:keydown={(e) => { if (e.key === 'Escape') closeMobile(); }}
		aria-label="Navigatie sluiten"
		tabindex="-1"
	></button>
{/if}

<svelte:window on:keydown={(e) => { if (e.key === 'Escape' && mobileOpen) closeMobile(); }} />

<!-- Sidebar -->
<aside
	class="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-200
		{mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0"
	aria-label="Hoofdnavigatie"
	use:focusTrap={mobileOpen}
>
	<div class="flex h-16 shrink-0 items-center gap-2 px-5">
		<img src="/logo.png" alt="Tendermanager logo" class="h-8 w-8 rounded-full" />
		<a href="/dashboard" class="text-[19px] font-semibold text-gray-900">Tendermanager</a>
	</div>

	<nav class="flex-1 overflow-y-auto px-3 py-4">
		<NavBreadcrumbs {currentPath} navLinks={NAV_LINKS} onNavigate={closeMobile} />

		{#if organizations.length > 1}
			<div class="mt-4 border-t border-gray-100 pt-4">
				<OrganizationSwitcher {organizations} onSwitch={handleOrgSwitch} />
			</div>
		{/if}

		<NavProjectMenu {projects} {activeProjectId} {currentPath} onNavigate={closeMobile} />
	</nav>

	<div class="hidden shrink-0 border-t border-gray-200 px-3 py-2 lg:block">
		<NotificationBell
			unreadCount={unreadNotificationCount}
			{notifications}
			onMarkAllRead={handleMarkAllRead}
			onViewAll={() => goto('/notifications')}
			onNotificationClick={handleNotificationClick}
		/>
	</div>

	<NavUserMenu {supabase} {profile} />
	<SidebarResizeHandle />
</aside>

<style>
	@media (min-width: 1024px) {
		aside {
			width: var(--sidebar-width, 240px) !important;
		}
	}
</style>
