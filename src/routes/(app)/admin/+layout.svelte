<script lang="ts">
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const NAV_ITEMS = [
		{ href: '/admin', label: 'Overzicht', icon: 'chart' },
		{ href: '/admin/organizations', label: 'Organisaties', icon: 'building' }
	] as const;

	const ICON_PATHS: Record<string, string> = {
		chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
		building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
	};

	function isItemActive(href: string): boolean {
		if (href === '/admin') {
			return $page.url.pathname === '/admin';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>Beheer — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">Beheer</h1>

	<div class="lg:grid lg:grid-cols-12 lg:gap-x-8">
		<aside class="lg:col-span-3">
			<nav class="space-y-1" aria-label="Beheer navigatie">
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
							class="mr-3 h-5 w-5 flex-shrink-0 {active ? 'text-primary-500' : 'text-gray-500'}"
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
