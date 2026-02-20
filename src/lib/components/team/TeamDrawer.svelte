<script lang="ts">
	import { PROJECT_ROLE_LABELS } from '$lib/types/enums.js';
	import DrawerDocumentRoles from './DrawerDocumentRoles.svelte';
	import type { TeamMember } from './types.js';

	export let member: TeamMember | null = null;
	export let projectId: string;
	export let onClose: (() => void) | null = null;
	export let onEdit: ((member: TeamMember) => void) | null = null;
	export let onRemove: ((member: TeamMember) => void) | null = null;

	$: isOpen = member !== null;

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') onClose?.();
	}

	function handleBackdropClick(): void {
		onClose?.();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && member}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black/20 transition-opacity"
		on:click={handleBackdropClick}
		role="presentation"
	></div>

	<!-- Drawer panel -->
	<div
		class="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-xl"
		role="dialog"
		aria-modal="true"
		aria-label="Details van {member.profile.first_name} {member.profile.last_name}"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
			<h2 class="text-lg font-semibold text-gray-900">Teamlid details</h2>
			<button
				type="button"
				on:click={() => onClose?.()}
				class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				aria-label="Sluiten"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Profile header -->
		<div class="border-b border-gray-200 px-6 py-6">
			<div class="flex items-center gap-4">
				<div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
					{member.profile.first_name.charAt(0)}{member.profile.last_name.charAt(0)}
				</div>
				<div>
					<h3 class="text-base font-semibold text-gray-900">
						{member.profile.first_name} {member.profile.last_name}
					</h3>
					<p class="text-sm text-gray-500">{member.profile.job_title ?? 'Geen functie'}</p>
				</div>
			</div>
		</div>

		<!-- Details -->
		<div class="px-6 py-6">
			<dl class="space-y-4">
				<div>
					<dt class="text-xs font-medium uppercase tracking-wider text-gray-500">E-mail</dt>
					<dd class="mt-1 text-sm text-gray-900">{member.profile.email}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium uppercase tracking-wider text-gray-500">Telefoon</dt>
					<dd class="mt-1 text-sm text-gray-900">{member.profile.phone ?? '—'}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium uppercase tracking-wider text-gray-500">Functie</dt>
					<dd class="mt-1 text-sm text-gray-900">{member.profile.job_title ?? '—'}</dd>
				</div>
				<div>
					<dt class="text-xs font-medium uppercase tracking-wider text-gray-500">Projectrollen</dt>
					<dd class="mt-2 flex flex-wrap gap-2">
						{#each member.roles as { role }}
							<span class="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
								{PROJECT_ROLE_LABELS[role]}
							</span>
						{/each}
						{#if member.roles.length === 0}
							<span class="text-sm text-gray-400">Geen rollen toegewezen</span>
						{/if}
					</dd>
				</div>
			</dl>
		</div>

		<!-- Document roles -->
		<DrawerDocumentRoles
			{projectId}
			memberId={member.id}
			memberName="{member.profile.first_name} {member.profile.last_name}"
		/>

		<!-- Actions -->
		<div class="border-t border-gray-200 px-6 py-4">
			<div class="flex gap-3">
				<button
					type="button"
					on:click={() => onEdit?.(member)}
					class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Bewerken
				</button>
				<button
					type="button"
					on:click={() => onRemove?.(member)}
					class="flex-1 rounded-lg border border-error-300 bg-white px-4 py-2 text-sm font-medium text-error-600 hover:bg-error-50"
				>
					Verwijderen
				</button>
			</div>
		</div>
	</div>
{/if}
