<script lang="ts">
	import type { Organization } from '$types';
	import {
		ORGANIZATION_TYPE_LABELS,
		CONTRACTING_AUTHORITY_TYPE_LABELS
	} from '$types';
	import type { OrganizationType, ContractingAuthorityType } from '$types';

	export let organization: Partial<Organization> | null = null;

	function formatAddress(org: Partial<Organization>): string {
		const parts = [org.straat, org.postcode, org.plaats].filter(Boolean);
		return parts.length > 0 ? parts.join(', ') : '';
	}

	function formatOrgType(orgType: string | undefined): string {
		if (!orgType) return '';
		return ORGANIZATION_TYPE_LABELS[orgType as OrganizationType] ?? orgType;
	}

	function formatAuthorityType(authType: string | null | undefined): string {
		if (!authType) return '';
		return CONTRACTING_AUTHORITY_TYPE_LABELS[authType as ContractingAuthorityType] ?? authType;
	}

	const FIELD_LABELS: Record<string, string> = {
		name: 'Naam',
		handelsnaam: 'Handelsnaam',
		kvk_nummer: 'KVK-nummer',
		rechtsvorm: 'Rechtsvorm',
		address: 'Adres',
		organization_type: 'Type organisatie',
		aanbestedende_dienst_type: 'Type aanbestedende dienst',
		nuts_codes: 'NUTS-codes',
		sbi_codes: 'SBI-codes'
	};
</script>

{#if !organization}
	<div class="rounded-card bg-white p-8 shadow-card text-center">
		<svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
				d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
		</svg>
		<p class="mt-4 text-sm text-gray-500">Geen organisatiegegevens beschikbaar.</p>
	</div>
{:else}
	<div class="rounded-card bg-white shadow-card">
		<div class="flex items-center gap-3 border-b border-gray-100 px-6 pt-6 pb-4">
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
				<svg class="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round"
						d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
				</svg>
			</div>
			<h2 class="text-base font-semibold text-gray-900">Organisatie</h2>
		</div>

		<dl class="divide-y divide-gray-100">
			<div class="flex items-center justify-between px-6 py-4">
				<dt class="text-sm text-gray-500">{FIELD_LABELS.name}</dt>
				<dd class="text-sm text-gray-900">{organization.name || '—'}</dd>
			</div>

			{#if organization.handelsnaam}
				<div class="flex items-center justify-between px-6 py-4">
					<dt class="text-sm text-gray-500">{FIELD_LABELS.handelsnaam}</dt>
					<dd class="text-sm text-gray-900">{organization.handelsnaam}</dd>
				</div>
			{/if}

			<div class="flex items-center justify-between px-6 py-4">
				<dt class="text-sm text-gray-500">{FIELD_LABELS.kvk_nummer}</dt>
				<dd class="text-sm text-gray-900">{organization.kvk_nummer || '—'}</dd>
			</div>

			{#if organization.rechtsvorm}
				<div class="flex items-center justify-between px-6 py-4">
					<dt class="text-sm text-gray-500">{FIELD_LABELS.rechtsvorm}</dt>
					<dd class="text-sm text-gray-900">{organization.rechtsvorm}</dd>
				</div>
			{/if}

			<div class="flex items-center justify-between px-6 py-4">
				<dt class="text-sm text-gray-500">{FIELD_LABELS.address}</dt>
				<dd class="text-sm text-gray-900">{formatAddress(organization) || '—'}</dd>
			</div>

			<div class="flex items-center justify-between px-6 py-4">
				<dt class="text-sm text-gray-500">{FIELD_LABELS.organization_type}</dt>
				<dd class="text-sm text-gray-900">
					{formatOrgType(organization.organization_type) || '—'}
				</dd>
			</div>

			{#if organization.aanbestedende_dienst_type}
				<div class="flex items-center justify-between px-6 py-4">
					<dt class="text-sm text-gray-500">{FIELD_LABELS.aanbestedende_dienst_type}</dt>
					<dd class="text-sm text-gray-900">
						{formatAuthorityType(organization.aanbestedende_dienst_type)}
					</dd>
				</div>
			{/if}

			<div class="flex items-center justify-between px-6 py-4">
				<dt class="text-sm text-gray-500">{FIELD_LABELS.nuts_codes}</dt>
				<dd class="flex flex-wrap gap-1">
					{#if organization.nuts_codes && organization.nuts_codes.length > 0}
						{#each organization.nuts_codes as code}
							<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{code}</span>
						{/each}
					{:else}
						<span class="text-sm text-gray-900">—</span>
					{/if}
				</dd>
			</div>

			{#if organization.sbi_codes && organization.sbi_codes.length > 0}
				<div class="flex items-center justify-between px-6 py-4">
					<dt class="text-sm text-gray-500">{FIELD_LABELS.sbi_codes}</dt>
					<dd class="flex flex-wrap gap-1">
						{#each organization.sbi_codes as code}
							<span class="rounded-badge bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{code}</span>
						{/each}
					</dd>
				</div>
			{/if}
		</dl>
	</div>
{/if}
