<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Profile } from '$types';

	export let supabase: SupabaseClient;
	export let profile: Profile | null;
	export let isSuperadmin: boolean = false;

	let mobileOpen = false;

	const BASE_NAV_LINKS = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'home' },
		{ href: '/kennisbank', label: 'Kennisbank', icon: 'book' }
	];

	$: NAV_LINKS = isSuperadmin
		? [...BASE_NAV_LINKS, { href: '/admin', label: 'Beheer', icon: 'settings' }]
		: BASE_NAV_LINKS;

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}

	function isActive(href: string): boolean {
		return $page.url.pathname.startsWith(href);
	}

	function closeMobile() {
		mobileOpen = false;
	}
</script>

<!-- Mobile top bar -->
<div class="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
	<a href="/dashboard" class="flex items-center gap-2 text-lg font-bold text-primary-600">
		<svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<circle cx="12" cy="12" r="10" opacity="0.2" />
			<circle cx="12" cy="12" r="6" />
		</svg>
		Tendermanager
	</a>
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

<!-- Mobile overlay -->
{#if mobileOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="fixed inset-0 z-40 bg-black/30 lg:hidden" on:click={closeMobile}></div>
{/if}

<!-- Sidebar -->
<aside
	class="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-200
		{mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0"
	aria-label="Hoofdnavigatie"
>
	<!-- Logo -->
	<div class="flex h-16 shrink-0 items-center gap-2 px-5">
		<svg class="h-7 w-7 text-primary-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<circle cx="12" cy="12" r="10" opacity="0.2" />
			<circle cx="12" cy="12" r="6" />
		</svg>
		<a href="/dashboard" class="text-lg font-bold text-gray-900">
			Tendermanager
		</a>
	</div>

	<!-- Navigation links -->
	<nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
		{#each NAV_LINKS as link (link.href)}
			<a
				href={link.href}
				on:click={closeMobile}
				class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
					{isActive(link.href)
						? 'bg-primary-50 text-primary-700'
						: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
				aria-current={isActive(link.href) ? 'page' : undefined}
			>
				{#if link.icon === 'home'}
					<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
					</svg>
				{:else if link.icon === 'book'}
					<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
					</svg>
				{:else if link.icon === 'settings'}
					<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				{/if}
				{link.label}
			</a>
		{/each}
	</nav>

	<!-- User section at bottom -->
	<div class="shrink-0 border-t border-gray-200 p-3">
		<a
			href="/settings/profile"
			class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
		>
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
				{profile?.first_name?.charAt(0)?.toUpperCase() ?? '?'}
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-medium text-gray-900">{profile?.first_name} {profile?.last_name}</p>
				<p class="truncate text-xs text-gray-500">{profile?.email}</p>
			</div>
		</a>
		<button
			on:click={handleLogout}
			class="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
		>
			<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
			</svg>
			Uitloggen
		</button>
	</div>
</aside>
