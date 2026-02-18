<!-- Supplier drawer — Kwalificatie tab: UEA, GVA, certifications -->
<script lang="ts">
	interface Qualification {
		id: string;
		type: 'uea' | 'gva' | 'certificering' | 'referentie';
		label: string;
		status: 'geldig' | 'verlopen' | 'ontbreekt';
		expiresAt: string | null;
	}

	export let qualifications: Qualification[] = [];

	const STATUS_STYLES: Record<string, string> = {
		geldig: 'bg-success-100 text-success-700',
		verlopen: 'bg-error-100 text-error-700',
		ontbreekt: 'bg-gray-100 text-gray-500'
	};

	const TYPE_LABELS: Record<string, string> = {
		uea: 'UEA',
		gva: 'GVA',
		certificering: 'Certificering',
		referentie: 'Referentie'
	};

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('nl-NL', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<div class="space-y-4">
	<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
		Kwalificatie & certificeringen
	</h4>

	{#if qualifications.length === 0}
		<p class="text-sm text-gray-400">Geen kwalificatiegegevens beschikbaar</p>
	{:else}
		<ul class="divide-y divide-gray-100" role="list">
			{#each qualifications as qual (qual.id)}
				<li class="flex items-center justify-between py-3">
					<div>
						<p class="text-sm font-medium text-gray-900">{qual.label}</p>
						<p class="text-xs text-gray-500">
							{TYPE_LABELS[qual.type] ?? qual.type}
							{#if qual.expiresAt}
								&middot; Geldig tot {formatDate(qual.expiresAt)}
							{/if}
						</p>
					</div>
					<span
						class="inline-flex rounded-badge px-2 py-0.5 text-xs font-medium {STATUS_STYLES[qual.status] ?? STATUS_STYLES.ontbreekt}"
						role="status"
					>
						{qual.status.charAt(0).toUpperCase() + qual.status.slice(1)}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
