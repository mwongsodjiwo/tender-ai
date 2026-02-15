<!-- Audit log component — receives data via props, pagination via URL -->
<script lang="ts">
	import { goto } from '$app/navigation';

	interface AuditEntry {
		id: string;
		actor_email: string | null;
		action: string;
		entity_type: string;
		entity_id: string | null;
		changes: Record<string, unknown>;
		created_at: string;
	}

	export let entries: AuditEntry[] = [];
	export let total: number = 0;
	export let page: number = 1;
	export let perPage: number = 25;
	export let baseUrl: string = '';

	const ACTION_LABELS: Record<string, string> = {
		create: 'Aangemaakt',
		update: 'Bijgewerkt',
		delete: 'Verwijderd',
		login: 'Ingelogd',
		logout: 'Uitgelogd',
		invite: 'Uitgenodigd',
		approve: 'Goedgekeurd',
		reject: 'Afgewezen',
		generate: 'Gegenereerd',
		export: 'Geexporteerd'
	};

	const ENTITY_LABELS: Record<string, string> = {
		project: 'Project',
		artifact: 'Sectie',
		project_member: 'Projectlid',
		project_member_roles: 'Projectrollen',
		section_reviewer: 'Kennishouder',
		conversation: 'Gesprek',
		document: 'Document',
		organization: 'Organisatie'
	};

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('nl-NL', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function goToPage(newPage: number): void {
		const separator = baseUrl.includes('?') ? '&' : '?';
		goto(`${baseUrl}${separator}page=${newPage}`);
	}

	$: totalPages = Math.ceil(total / perPage);
</script>

<div class="rounded-card border border-gray-200 bg-white shadow-card transition hover:shadow-sm">
	<div class="border-b border-gray-200 px-6 py-4">
		<h3 class="text-base font-semibold text-gray-900">Audit log</h3>
		<p class="mt-1 text-sm text-gray-500">Alle acties op dit project worden hier vastgelegd.</p>
	</div>

	{#if entries.length === 0}
		<div class="px-6 py-8 text-center">
			<p class="text-sm text-gray-500">Nog geen acties vastgelegd.</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Datum
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Gebruiker
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Actie
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Onderdeel
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							Details
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each entries as entry}
						<tr>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
								{formatDate(entry.created_at)}
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
								{entry.actor_email ?? 'Systeem'}
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm">
								<span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
									{ACTION_LABELS[entry.action] ?? entry.action}
								</span>
							</td>
							<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
								{ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}
							</td>
							<td class="max-w-xs truncate px-6 py-4 text-sm text-gray-500">
								{#if Object.keys(entry.changes).length > 0}
									{JSON.stringify(entry.changes).slice(0, 80)}
								{:else}
									—
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if totalPages > 1}
			<div class="flex items-center justify-between border-t border-gray-200 px-6 py-3">
				<p class="text-sm text-gray-500">
					{total} resultaten, pagina {page} van {totalPages}
				</p>
				<div class="flex gap-2">
					<button
						on:click={() => goToPage(page - 1)}
						disabled={page <= 1}
						class="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
					>
						Vorige
					</button>
					<button
						on:click={() => goToPage(page + 1)}
						disabled={page >= totalPages}
						class="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
					>
						Volgende
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
