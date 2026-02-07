<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Profile } from '$types';

	export let supabase: SupabaseClient;
	export let profile: Profile | null;
	export let isSuperadmin: boolean = false;

	let menuOpen = false;
	let mobileMenuOpen = false;

	const BASE_NAV_LINKS = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/kennisbank', label: 'Kennisbank' }
	];

	$: NAV_LINKS = isSuperadmin
		? [...BASE_NAV_LINKS, { href: '/admin', label: 'Beheer' }]
		: BASE_NAV_LINKS;

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMenus() {
		menuOpen = false;
		mobileMenuOpen = false;
	}

	function isActive(href: string): boolean {
		return $page.url.pathname.startsWith(href);
	}
</script>

<svelte:window on:click={closeMenus} />

<nav class="border-b border-gray-200 bg-white" aria-label="Hoofdnavigatie">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 justify-between">
			<div class="flex items-center">
				<a href="/dashboard" class="text-xl font-bold text-primary-600">
					Tendermanager
				</a>
				<!-- Desktop navigation -->
				<div class="ml-10 hidden space-x-8 sm:flex">
					{#each NAV_LINKS as link (link.href)}
						<a
							href={link.href}
							class="inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium {isActive(link.href)
								? 'border-primary-500 text-gray-900'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
							aria-current={isActive(link.href) ? 'page' : undefined}
						>
							{link.label}
						</a>
					{/each}
				</div>
			</div>

			<div class="flex items-center gap-2">
				<!-- User menu (desktop) -->
				<div class="relative hidden sm:block">
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<button
						on:click|stopPropagation={toggleMenu}
						class="flex items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
						aria-expanded={menuOpen}
						aria-haspopup="true"
					>
						<span class="sr-only">Gebruikersmenu openen</span>
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
							{profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
						</div>
					</button>

					{#if menuOpen}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div
							class="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
							role="menu"
							on:click|stopPropagation
						>
							<div class="border-b border-gray-100 px-4 py-2">
								<p class="text-sm font-medium text-gray-900">{profile?.full_name}</p>
								<p class="truncate text-xs text-gray-500">{profile?.email}</p>
							</div>
							<a
								href="/settings/profile"
								class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
								role="menuitem"
							>
								Instellingen
							</a>
							<button
								on:click={handleLogout}
								class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
								role="menuitem"
							>
								Uitloggen
							</button>
						</div>
					{/if}
				</div>

				<!-- Mobile hamburger -->
				<button
					on:click|stopPropagation={toggleMobileMenu}
					class="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:hidden"
					aria-expanded={mobileMenuOpen}
					aria-label="Hoofdmenu openen"
				>
					{#if mobileMenuOpen}
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
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="border-t border-gray-200 sm:hidden">
			<div class="space-y-1 px-4 pb-3 pt-2">
				{#each NAV_LINKS as link (link.href)}
					<a
						href={link.href}
						class="block rounded-md px-3 py-2 text-base font-medium {isActive(link.href)
							? 'bg-primary-50 text-primary-700'
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}"
						aria-current={isActive(link.href) ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</div>
			<div class="border-t border-gray-200 px-4 pb-3 pt-4">
				<div class="flex items-center">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
						{profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
					</div>
					<div class="ml-3">
						<p class="text-base font-medium text-gray-800">{profile?.full_name}</p>
						<p class="text-sm text-gray-500">{profile?.email}</p>
					</div>
				</div>
				<div class="mt-3 space-y-1">
					<a
						href="/settings/profile"
						class="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800"
					>
						Instellingen
					</a>
					<button
						on:click={handleLogout}
						class="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800"
					>
						Uitloggen
					</button>
				</div>
			</div>
		</div>
	{/if}
</nav>
