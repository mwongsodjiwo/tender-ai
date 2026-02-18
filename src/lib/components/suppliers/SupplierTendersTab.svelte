<!-- Supplier drawer — Aanbestedingen tab: projects with status + role -->
<script lang="ts">
	import type { ProjectSupplier } from '$types';
	import {
		SUPPLIER_PROJECT_STATUS_LABELS,
		SUPPLIER_PROJECT_ROLE_LABELS
	} from '$types';
	import StatusBadge from '$components/StatusBadge.svelte';

	export let projectSuppliers: ProjectSupplier[] = [];

	interface ProjectLink {
		projectSupplier: ProjectSupplier;
		projectName: string;
	}

	export let projectLinks: ProjectLink[] = [];
</script>

<div class="space-y-4">
	<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
		Gekoppelde aanbestedingen
	</h4>

	{#if projectLinks.length === 0 && projectSuppliers.length === 0}
		<p class="text-sm text-gray-400">Nog niet gekoppeld aan aanbestedingen</p>
	{:else}
		<ul class="divide-y divide-gray-100" role="list">
			{#each projectLinks as link (link.projectSupplier.id)}
				<li class="py-3">
					<div class="flex items-center justify-between">
						<a
							href="/projects/{link.projectSupplier.project_id}"
							class="text-sm font-medium text-gray-900 hover:text-primary-600"
						>
							{link.projectName}
						</a>
						<StatusBadge status={link.projectSupplier.status} />
					</div>
					<div class="mt-1 flex gap-3 text-xs text-gray-500">
						<span>Rol: {SUPPLIER_PROJECT_ROLE_LABELS[link.projectSupplier.role]}</span>
						<span>Status: {SUPPLIER_PROJECT_STATUS_LABELS[link.projectSupplier.status]}</span>
					</div>
					{#if link.projectSupplier.offer_amount != null}
						<p class="mt-1 text-xs text-gray-500">
							Offerte: &euro;{link.projectSupplier.offer_amount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
