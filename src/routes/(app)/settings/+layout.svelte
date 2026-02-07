<script lang="ts">
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	// Settings navigation items with Dutch labels
	const NAV_ITEMS = [
		{ href: '/settings/profile', label: 'Profiel', icon: 'user' },
		{ href: '/settings/organization', label: 'Organisatie', icon: 'building' },
		{ href: '/settings/notifications', label: 'Meldingen', icon: 'bell' }
	] as const;

	// SVG path data for each icon to avoid duplication
	const ICON_PATHS: Record<string, string> = {
		user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
		building:
			'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
		bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
	};

	// Determine active state based on current pathname
	function isItemActive(href: string): boolean {
		return $page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>Instellingen — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Instellingen</h1>

	<div class="lg:grid lg:grid-cols-12 lg:gap-x-8">
		<aside class="lg:col-span-3">
			<nav class="space-y-1" aria-label="Instellingen navigatie">
				{#each NAV_ITEMS as item (item.href)}
					{@const active = isItemActive(item.href)}
					<a
						href={item.href}
						class="group flex items-center rounded-md px-3 py-2 text-sm font-medium
							{active
							? 'bg-primary-50 text-primary-700'
							: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}"
						aria-current={active ? 'page' : undefined}
					>
						<svg
							class="mr-3 h-5 w-5 flex-shrink-0 {active ? 'text-primary-500' : 'text-gray-400'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={ICON_PATHS[item.icon]}
							/>
						</svg>
						{item.label}
					</a>
				{/each}
			</nav>
		</aside>

		<div class="mt-6 lg:col-span-9 lg:mt-0">
			<slot />
		</div>
	</div>
</div>
