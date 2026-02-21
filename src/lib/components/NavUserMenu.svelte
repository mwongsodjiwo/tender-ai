<!-- NavUserMenu — User profile link and logout button -->
<script lang="ts">
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { goto } from '$app/navigation';
	import type { Profile } from '$types';

	export let supabase: SupabaseClient;
	export let profile: Profile | null;

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

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
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
			<polyline points="16 17 21 12 16 7" stroke-linecap="round" stroke-linejoin="round" />
			<line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round" />
		</svg>
		Uitloggen
	</button>
</div>
