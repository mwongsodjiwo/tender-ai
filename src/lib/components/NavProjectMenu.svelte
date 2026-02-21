<!-- NavProjectMenu — Project selector dropdown + sub-navigation links -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ProjectStatus } from '$types';

	export let projects: { id: string; name: string; status: ProjectStatus; updated_at: string }[] = [];
	export let activeProjectId: string | null = null;
	export let currentPath: string;
	export let onNavigate: (() => void) | undefined = undefined;

	const PROJECT_SUB_LINKS = [
		{ path: '', label: 'Overzicht', icon: 'layout-dashboard' },
		{ path: '/profile', label: 'Projectprofiel', icon: 'clipboard-list' },
		{ path: '/planning', label: 'Planning', icon: 'calendar-clock' },
		{ path: '/documents', label: 'Documenten', icon: 'file-text' },
		{ path: '/team', label: 'Team', icon: 'users' }
	];

	function handleProjectChange(e: Event) {
		const id = (e.currentTarget as HTMLSelectElement).value;
		if (id) {
			if (onNavigate) onNavigate();
			goto(`/projects/${id}`);
		}
	}
</script>

<div class="mt-6">
	<span class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
		Project
	</span>

	<div class="mt-1 px-1.5">
		<select
			value={activeProjectId ?? ''}
			on:change={handleProjectChange}
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

	{#if activeProjectId}
		<div class="mt-2 space-y-0.5">
			{#each PROJECT_SUB_LINKS as subLink (subLink.path)}
				{@const subFullPath = `/projects/${activeProjectId}${subLink.path}`}
				{@const subActive = subLink.path === '' ? currentPath === subFullPath : currentPath.startsWith(subFullPath)}
				<a
					href={subFullPath}
					on:click={onNavigate}
					class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors
						{subActive
							? 'text-primary-700 font-medium bg-primary-50/50'
							: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}"
					aria-current={subActive ? 'page' : undefined}
				>
					{#if subLink.icon === 'layout-dashboard'}
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
							<path d="m9 10 2 2 4-4"/>
						</svg>
					{:else if subLink.icon === 'clipboard-list'}
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M6 5h12"/>
							<path d="M4 12h10"/>
							<path d="M12 19h8"/>
						</svg>
					{:else if subLink.icon === 'calendar-clock'}
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M8 2v4"/>
							<path d="M16 2v4"/>
							<rect width="18" height="18" x="3" y="4" rx="2"/>
							<path d="M3 10h18"/>
						</svg>
					{:else if subLink.icon === 'file-text'}
						<svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
							<path d="M14 2v5a1 1 0 0 0 1 1h5"/>
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
</div>
