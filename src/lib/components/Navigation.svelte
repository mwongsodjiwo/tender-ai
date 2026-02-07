<script lang="ts">
	import { goto } from '$app/navigation';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Profile } from '$types';

	export let supabase: SupabaseClient;
	export let profile: Profile | null;

	let menuOpen = false;

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}
</script>

<nav class="border-b border-gray-200 bg-white" aria-label="Hoofdnavigatie">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 justify-between">
			<div class="flex items-center">
				<a href="/dashboard" class="text-xl font-bold text-primary-600">
					Tendermanager
				</a>
				<div class="ml-10 hidden space-x-8 sm:flex">
					<a
						href="/dashboard"
						class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
					>
						Dashboard
					</a>
				</div>
			</div>

			<div class="flex items-center">
				<div class="relative">
					<button
						on:click={toggleMenu}
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
						<div
							class="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
							role="menu"
						>
							<div class="border-b border-gray-100 px-4 py-2">
								<p class="text-sm font-medium text-gray-900">{profile?.full_name}</p>
								<p class="truncate text-xs text-gray-500">{profile?.email}</p>
							</div>
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
			</div>
		</div>
	</div>
</nav>
