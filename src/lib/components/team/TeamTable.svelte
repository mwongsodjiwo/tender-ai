<script lang="ts">
	import { PROJECT_ROLE_LABELS, type ProjectRole } from '$lib/types/enums.js';
	import type { TeamMember } from './types.js';

	export let members: TeamMember[] = [];
	export let onRowClick: ((member: TeamMember) => void) | null = null;

	function primaryRole(roles: { role: ProjectRole }[]): string {
		if (roles.length === 0) return '—';
		return PROJECT_ROLE_LABELS[roles[0].role];
	}

	function handleKeydown(event: KeyboardEvent, member: TeamMember): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onRowClick?.(member);
		}
	}
</script>

{#if members.length === 0}
	<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center">
		<svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
		</svg>
		<p class="mt-2 text-sm text-gray-500">Geen teamleden gevonden.</p>
	</div>
{:else}
	<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
		<table class="min-w-full divide-y divide-gray-200" role="grid" aria-label="Teamleden overzicht">
			<thead class="bg-gray-50">
				<tr>
					<th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Naam</th>
					<th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">E-mail</th>
					<th scope="col" class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">Telefoon</th>
					<th scope="col" class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">Functie</th>
					<th scope="col" class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rol</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#each members as member (member.id)}
					<tr
						class="cursor-pointer transition-colors hover:bg-gray-50"
						tabindex="0"
						on:click={() => onRowClick?.(member)}
						on:keydown={(e) => handleKeydown(e, member)}
						aria-label="Details van {member.profile.first_name} {member.profile.last_name}"
					>
						<td class="whitespace-nowrap px-4 py-3">
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
									{member.profile.first_name.charAt(0)}{member.profile.last_name.charAt(0)}
								</div>
								<span class="text-sm font-medium text-gray-900">
									{member.profile.first_name} {member.profile.last_name}
								</span>
							</div>
						</td>
						<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
							{member.profile.email}
						</td>
						<td class="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 md:table-cell">
							{member.profile.phone ?? '—'}
						</td>
						<td class="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 lg:table-cell">
							{member.profile.job_title ?? '—'}
						</td>
						<td class="whitespace-nowrap px-4 py-3">
							<span class="inline-flex rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
								{primaryRole(member.roles)}
							</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
