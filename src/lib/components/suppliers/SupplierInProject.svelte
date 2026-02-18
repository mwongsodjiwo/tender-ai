<!-- SupplierInProject — link/manage suppliers within a project context -->
<script lang="ts">
	import type { ProjectSupplier, Supplier } from '$types';
	import {
		SUPPLIER_PROJECT_STATUSES,
		SUPPLIER_PROJECT_STATUS_LABELS,
		SUPPLIER_PROJECT_ROLES,
		SUPPLIER_PROJECT_ROLE_LABELS
	} from '$types';
	import StatusBadge from '$components/StatusBadge.svelte';

	export let projectId: string;
	export let projectSuppliers: (ProjectSupplier & { supplier?: Supplier })[] = [];
	export let onStatusChange: (supplierId: string, status: string) => void = () => {};
	export let onRoleChange: (supplierId: string, role: string) => void = () => {};
	export let onAdd: () => void = () => {};

	let updatingId: string | null = null;

	async function handleStatusChange(psId: string, supplierId: string, event: Event): Promise<void> {
		const target = event.target as HTMLSelectElement;
		updatingId = psId;
		onStatusChange(supplierId, target.value);
		updatingId = null;
	}

	async function handleRoleChange(psId: string, supplierId: string, event: Event): Promise<void> {
		const target = event.target as HTMLSelectElement;
		updatingId = psId;
		onRoleChange(supplierId, target.value);
		updatingId = null;
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold text-gray-900">Leveranciers</h3>
		<button
			type="button"
			on:click={onAdd}
			class="rounded-card bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
		>
			+ Leverancier koppelen
		</button>
	</div>

	{#if projectSuppliers.length === 0}
		<p class="text-sm text-gray-400">Nog geen leveranciers gekoppeld aan dit project</p>
	{:else}
		<div class="rounded-card bg-white shadow-card overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b border-gray-200">
						<th scope="col" class="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
							Leverancier
						</th>
						<th scope="col" class="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
							Status
						</th>
						<th scope="col" class="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
							Rol
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each projectSuppliers as ps (ps.id)}
						<tr class="transition-colors hover:bg-gray-50 {updatingId === ps.id ? 'opacity-60' : ''}">
							<td class="px-4 py-3">
								<p class="text-sm font-medium text-gray-900">
									{ps.supplier?.company_name ?? ps.supplier_id}
								</p>
								{#if ps.supplier?.city}
									<p class="text-xs text-gray-500">{ps.supplier.city}</p>
								{/if}
							</td>
							<td class="px-4 py-3">
								<label for="ps-status-{ps.id}" class="sr-only">Status</label>
								<select
									id="ps-status-{ps.id}"
									value={ps.status}
									on:change={(e) => handleStatusChange(ps.id, ps.supplier_id, e)}
									class="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
								>
									{#each SUPPLIER_PROJECT_STATUSES as status}
										<option value={status}>{SUPPLIER_PROJECT_STATUS_LABELS[status]}</option>
									{/each}
								</select>
							</td>
							<td class="px-4 py-3">
								<label for="ps-role-{ps.id}" class="sr-only">Rol</label>
								<select
									id="ps-role-{ps.id}"
									value={ps.role}
									on:change={(e) => handleRoleChange(ps.id, ps.supplier_id, e)}
									class="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
								>
									{#each SUPPLIER_PROJECT_ROLES as role}
										<option value={role}>{SUPPLIER_PROJECT_ROLE_LABELS[role]}</option>
									{/each}
								</select>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
