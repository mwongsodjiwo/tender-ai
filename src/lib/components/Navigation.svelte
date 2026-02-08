<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import type { Profile, ProjectStatus } from '$types';

	export let supabase: SupabaseClient;
	export let profile: Profile | null;
	export let isSuperadmin: boolean = false;
	export let projects: { id: string; name: string; status: ProjectStatus; updated_at: string }[] = [];

	let mobileOpen = false;
	let projectsExpanded = true;

	const BASE_NAV_LINKS = [
		{ href: '/dashboard', label: 'Dashboard', icon: 'home' },
		{ href: '/kennisbank', label: 'Kennisbank', icon: 'book' }
	];

	$: NAV_LINKS = isSuperadmin
		? [...BASE_NAV_LINKS, { href: '/admin', label: 'Beheer', icon: 'settings' }]
		: BASE_NAV_LINKS;

	// Determine the active project from the URL
	$: activeProjectId = $page.params.id ?? null;
	$: isOnProjectPage = $page.url.pathname.startsWith('/projects/') && activeProjectId != null;

	const PROJECT_SUB_LINKS = [
		{ path: '', label: 'Overzicht', icon: 'overview' },
		{ path: '/team', label: 'Team', icon: 'team' },
		{ path: '/documents', label: 'Documenten', icon: 'documents' },
		{ path: '/audit', label: 'Audit log', icon: 'audit' }
	];

	const STATUS_DOTS: Record<string, string> = {
		draft: 'bg-gray-400',
		briefing: 'bg-primary-400',
		generating: 'bg-warning-400',
		review: 'bg-purple-400',
		approved: 'bg-success-500',
		published: 'bg-success-600',
		archived: 'bg-gray-300'
	};

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}

	function isActive(href: string): boolean {
		return $page.url.pathname.startsWith(href);
	}

	function isSubLinkActive(projectId: string, subPath: string): boolean {
		const fullPath = `/projects/${projectId}${subPath}`;
		if (subPath === '') {
			return $page.url.pathname === fullPath;
		}
		return $page.url.pathname.startsWith(fullPath);
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
	<nav class="flex-1 overflow-y-auto px-3 py-4">
		<!-- Main links -->
		<div class="space-y-1">
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
		</div>

		<!-- Projects section -->
		<div class="mt-6">
			<button
				on:click={() => (projectsExpanded = !projectsExpanded)}
				class="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
				aria-expanded={projectsExpanded}
			>
				<span>Projecten</span>
				<svg
					class="h-4 w-4 transition-transform duration-200 {projectsExpanded ? 'rotate-0' : '-rotate-90'}"
					fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if projectsExpanded}
				<div class="mt-1 space-y-0.5">
					{#if projects.length === 0}
						<p class="px-3 py-2 text-xs text-gray-400">Geen projecten</p>
					{:else}
						{#each projects as project (project.id)}
							{@const isSelected = activeProjectId === project.id}
							<div>
								<a
									href="/projects/{project.id}"
									on:click={closeMobile}
									class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors
										{isSelected
											? 'bg-primary-50 text-primary-700 font-medium'
											: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
									aria-current={isSelected ? 'page' : undefined}
								>
									<span class="h-2 w-2 shrink-0 rounded-full {STATUS_DOTS[project.status] ?? 'bg-gray-400'}" aria-hidden="true"></span>
									<span class="truncate">{project.name}</span>
								</a>

								<!-- Sub-navigation for selected project -->
								{#if isSelected}
									<div class="ml-5 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-3">
										{#each PROJECT_SUB_LINKS as subLink (subLink.path)}
											{@const subActive = isSubLinkActive(project.id, subLink.path)}
											<a
												href="/projects/{project.id}{subLink.path}"
												on:click={closeMobile}
												class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors
													{subActive
														? 'text-primary-700 font-medium bg-primary-50/50'
														: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}"
												aria-current={subActive ? 'page' : undefined}
											>
												{#if subLink.icon === 'overview'}
													<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
														<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
													</svg>
												{:else if subLink.icon === 'team'}
													<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
														<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
													</svg>
												{:else if subLink.icon === 'documents'}
													<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
														<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
													</svg>
												{:else if subLink.icon === 'audit'}
													<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
														<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
												{/if}
												{subLink.label}
											</a>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					{/if}

					<!-- New project link -->
					<a
						href="/projects/new"
						on:click={closeMobile}
						class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
					>
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
						Nieuw project
					</a>
				</div>
			{/if}
		</div>
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
