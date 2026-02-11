<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Profile, ProjectStatus, Notification } from '$types';
	import { lastProjectId } from '$lib/stores/lastProject';
	import NotificationBell from '$lib/components/notifications/NotificationBell.svelte';

	export let supabase: SupabaseClient;
	export let profile: Profile | null;
	export let isSuperadmin: boolean = false;
	export let projects: { id: string; name: string; status: ProjectStatus; updated_at: string }[] = [];
	export let notifications: Notification[] = [];
	export let unreadNotificationCount: number = 0;

	let mobileOpen = false;

	const BASE_NAV_LINKS = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'home' },
		{ href: '/planning', label: 'Planning', icon: 'calendar' },
		{ href: '/kennisbank', label: 'Kennisbank', icon: 'book' },
		{ href: '/time-tracking', label: 'Urenregistratie', icon: 'clock' }
	];

	$: NAV_LINKS = isSuperadmin
		? [...BASE_NAV_LINKS, { href: '/admin', label: 'Beheer', icon: 'settings' }]
		: BASE_NAV_LINKS;

	// Reactive path tracking — ensures sidebar re-renders on navigation
	$: currentPath = $page.url.pathname;
	$: urlProjectId = $page.params.id ?? null;

	// When visiting a project page, persist the project id
	$: if (urlProjectId) {
		lastProjectId.set(urlProjectId);
	}

	// Use URL project id when on a project page, otherwise fall back to last visited project
	// (only if that project still exists in the loaded projects list)
	$: activeProjectId = urlProjectId
		?? (projects.some((p) => p.id === $lastProjectId) ? $lastProjectId : null);

	const PROJECT_SUB_LINKS = [
		{ path: '', label: 'Overzicht', icon: 'layout-dashboard' },
		{ path: '/profile', label: 'Projectprofiel', icon: 'clipboard-list' },
		{ path: '/planning', label: 'Planning', icon: 'calendar-clock' },
		{ path: '/documents', label: 'Documenten', icon: 'file-text' },
		{ path: '/correspondence', label: 'Correspondentie', icon: 'mail' },
		{ path: '/team', label: 'Team', icon: 'users' }
	];

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
		if (n.project_id) {
			goto(`/projects/${n.project_id}/planning`);
		}
	}

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}

	function closeMobile() {
		mobileOpen = false;
	}
</script>

<!-- Mobile top bar -->
<div class="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
	<a href="/dashboard" class="flex items-center gap-2 text-lg font-bold text-primary-600">
		<img src="/logo.png" alt="Tendermanager logo" class="h-7 w-7 rounded-full" />
		Tendermanager
	</a>
	<div class="flex items-center gap-1">
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
		<img src="/logo.png" alt="Tendermanager logo" class="h-8 w-8 rounded-full" />
		<a href="/dashboard" class="text-lg font-bold text-gray-900">
			Tendermanager
		</a>
	</div>

	<!-- Navigation links -->
	<nav class="flex-1 overflow-y-auto px-3 py-4">
		<!-- Main links -->
		<div class="space-y-1">
			{#each NAV_LINKS as link (link.href)}
				<a
					href={link.href}
					on:click={closeMobile}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
						{currentPath.startsWith(link.href)
							? 'bg-primary-50 text-primary-700'
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
					aria-current={currentPath.startsWith(link.href) ? 'page' : undefined}
				>
					{#if link.icon === 'home'}
						<!-- Lucide: LayoutDashboard -->
						<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 9h4V3H3v6zm0 12h4v-8H3v8zm6 0h4V11H9v10zm0-18v6h4V3H9zm6 18h4v-8h-4v8zm0-12v4h4V9h-4z" />
						</svg>
					{:else if link.icon === 'calendar'}
						<!-- Lucide: CalendarRange -->
						<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<rect x="3" y="4" width="18" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M16 2v4M8 2v4M3 10h18M17 14h-6M7 14h.01M7 18h.01M11 18h6" />
						</svg>
					{:else if link.icon === 'book'}
						<!-- Lucide: BookOpen -->
						<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
						</svg>
				{:else if link.icon === 'clock'}
					<!-- Lucide: Clock -->
					<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				{:else if link.icon === 'settings'}
					<!-- Lucide: Settings -->
						<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					{/if}
					{link.label}
				</a>
			{/each}
		</div>

		<!-- Project selector -->
		<div class="mt-6">
			<span class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
				Project
			</span>

			<div class="mt-1 px-1.5">
				<select
					value={activeProjectId ?? ''}
					on:change={(e) => {
						const id = e.currentTarget.value;
						if (id) { closeMobile(); goto(`/projects/${id}`); }
					}}
					class="w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1
						{activeProjectId
							? 'border-violet-200 bg-violet-50 focus:border-violet-500 focus:ring-violet-500'
							: 'border-gray-200 bg-white focus:border-primary-500 focus:ring-primary-500'}"
					aria-label="Selecteer een project"
				>
					<option value="" disabled>Kies een project...</option>
					{#each projects as proj (proj.id)}
						<option value={proj.id}>{proj.name}</option>
					{/each}
				</select>
			</div>

			<!-- Sub-navigation for active project -->
			{#if activeProjectId}
				<div class="mt-2 space-y-0.5">
					{#each PROJECT_SUB_LINKS as subLink (subLink.path)}
						{@const subFullPath = `/projects/${activeProjectId}${subLink.path}`}
						{@const subActive = subLink.path === '' ? currentPath === subFullPath : currentPath.startsWith(subFullPath)}
						<a
							href={subFullPath}
							on:click={closeMobile}
							class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors
								{subActive
									? 'text-primary-700 font-medium bg-primary-50/50'
									: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}"
							aria-current={subActive ? 'page' : undefined}
						>
							{#if subLink.icon === 'layout-dashboard'}
								<!-- Lucide: Grid2x2Check -->
								<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3"/>
									<path d="m16 19 2 2 4-4"/>
								</svg>
							{:else if subLink.icon === 'clipboard-list'}
								<!-- Lucide: ChartNoAxesGantt -->
								<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d="M6 5h12"/>
									<path d="M4 12h10"/>
									<path d="M12 19h8"/>
								</svg>
							{:else if subLink.icon === 'calendar-clock'}
							<!-- Lucide: CalendarClock -->
							<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M16 14v2.2l1.6 1"/>
								<path d="M16 2v4"/>
								<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/>
								<path d="M3 10h5"/>
								<path d="M8 2v4"/>
								<circle cx="16" cy="16" r="6"/>
							</svg>
						{:else if subLink.icon === 'search'}
								<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
									<circle cx="11" cy="11" r="8" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35" />
								</svg>
							{:else if subLink.icon === 'file-text'}
								<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z" />
									<polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round" />
									<line x1="16" y1="13" x2="8" y2="13" stroke-linecap="round" />
									<line x1="16" y1="17" x2="8" y2="17" stroke-linecap="round" />
									<line x1="10" y1="9" x2="8" y2="9" stroke-linecap="round" />
								</svg>
							{:else if subLink.icon === 'mail'}
								<!-- Lucide: Folder -->
								<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
									<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
								</svg>
							{:else if subLink.icon === 'users'}
								<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
									<path d="M18 21a8 8 0 0 0-16 0" />
									<circle cx="10" cy="8" r="5" />
									<path d="M22 20c0-3.37-2.15-6.23-5.15-7.3" />
									<circle cx="18" cy="6" r="3" />
								</svg>
							{/if}
							{subLink.label}
						</a>
					{/each}
				</div>
			{/if}

			<!-- New project link -->
			<a
				href="/projects/new"
				on:click={closeMobile}
				class="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
			>
				<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Nieuw project
			</a>
		</div>
	</nav>

	<!-- Notification bell (desktop sidebar) -->
	<div class="hidden shrink-0 border-t border-gray-200 px-3 py-2 lg:block">
		<div class="flex items-center gap-2">
			<NotificationBell
				unreadCount={unreadNotificationCount}
				{notifications}
				onMarkAllRead={handleMarkAllRead}
				onViewAll={() => goto('/notifications')}
				onNotificationClick={handleNotificationClick}
			/>
			<span class="text-xs text-gray-500">Notificaties</span>
		</div>
	</div>

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
			<!-- Lucide: LogOut -->
			<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
				<polyline points="16 17 21 12 16 7" stroke-linecap="round" stroke-linejoin="round" />
				<line x1="21" y1="12" x2="9" y2="12" stroke-linecap="round" />
			</svg>
			Uitloggen
		</button>
	</div>
</aside>
