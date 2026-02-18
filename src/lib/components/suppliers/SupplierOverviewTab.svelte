<!-- Supplier drawer — Overzicht tab: company details, contacts, tags, rating -->
<script lang="ts">
	import type { Supplier, SupplierContact } from '$types';

	export let supplier: Supplier;
	export let contacts: SupplierContact[] = [];

	function renderStars(rating: number | null): string {
		if (!rating) return '—';
		return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
	}
</script>

<div class="space-y-6">
	<!-- Company details -->
	<section>
		<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
			Bedrijfsgegevens
		</h4>
		<dl class="mt-3 space-y-2">
			{#if supplier.kvk_nummer}
				<div class="flex justify-between text-sm">
					<dt class="text-gray-500">KVK</dt>
					<dd class="font-medium text-gray-900">{supplier.kvk_nummer}</dd>
				</div>
			{/if}
			{#if supplier.trade_name}
				<div class="flex justify-between text-sm">
					<dt class="text-gray-500">Handelsnaam</dt>
					<dd class="font-medium text-gray-900">{supplier.trade_name}</dd>
				</div>
			{/if}
			{#if supplier.legal_form}
				<div class="flex justify-between text-sm">
					<dt class="text-gray-500">Rechtsvorm</dt>
					<dd class="font-medium text-gray-900">{supplier.legal_form}</dd>
				</div>
			{/if}
			{#if supplier.street || supplier.postal_code || supplier.city}
				<div class="flex justify-between text-sm">
					<dt class="text-gray-500">Adres</dt>
					<dd class="text-right font-medium text-gray-900">
						{#if supplier.street}{supplier.street}<br />{/if}
						{supplier.postal_code ?? ''} {supplier.city ?? ''}
					</dd>
				</div>
			{/if}
			{#if supplier.website}
				<div class="flex justify-between text-sm">
					<dt class="text-gray-500">Website</dt>
					<dd>
						<a
							href={supplier.website}
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-primary-600 hover:underline"
						>{supplier.website}</a>
					</dd>
				</div>
			{/if}
		</dl>
	</section>

	<!-- Rating -->
	<section>
		<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
			Beoordeling
		</h4>
		<p class="mt-2 text-lg tracking-wide" aria-label="Beoordeling {supplier.rating ?? 0} van 5">
			{renderStars(supplier.rating)}
		</p>
	</section>

	<!-- Tags -->
	{#if (supplier.tags ?? []).length > 0}
		<section>
			<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tags</h4>
			<div class="mt-2 flex flex-wrap gap-1.5">
				{#each supplier.tags as tag}
					<span class="inline-flex rounded-badge bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
						{tag}
					</span>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Contacts -->
	<section>
		<h4 class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
			Contactpersonen
		</h4>
		{#if contacts.length === 0}
			<p class="mt-2 text-sm text-gray-400">Geen contactpersonen</p>
		{:else}
			<ul class="mt-2 divide-y divide-gray-100" role="list">
				{#each contacts as contact (contact.id)}
					<li class="py-2.5">
						<div class="flex items-center gap-2">
							<p class="text-sm font-medium text-gray-900">{contact.name}</p>
							{#if contact.is_primary}
								<span class="rounded-badge bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700">
									Primair
								</span>
							{/if}
						</div>
						{#if contact.function_title}
							<p class="text-xs text-gray-500">{contact.function_title}</p>
						{/if}
						<div class="mt-1 flex gap-3 text-xs text-gray-500">
							{#if contact.email}
								<a href="mailto:{contact.email}" class="hover:text-primary-600">{contact.email}</a>
							{/if}
							{#if contact.phone}
								<span>{contact.phone}</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
