<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: ActionData;

	const TABLE_LABELS: Record<string, string> = {
		correspondence: 'Correspondentie',
		artifacts: 'Artefacten',
		evaluations: 'Evaluaties',
		documents: 'Documenten',
		conversations: 'Gesprekken',
		messages: 'Berichten',
		time_entries: 'Tijdregistraties',
		document_comments: 'Opmerkingen',
		section_reviewers: 'Reviewers',
		suppliers: 'Leveranciers',
		supplier_contacts: 'Contactpersonen',
		project_suppliers: 'Projectleveranciers',
		incoming_questions: 'Binnenkomende vragen'
	};

	const CLASSIFICATION_LABELS: Record<string, string> = {
		archive: 'Archief',
		personal: 'Persoonsgegevens',
		operational: 'Operationeel'
	};

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('nl-NL', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function daysExpired(iso: string): number {
		const diff = Date.now() - new Date(iso).getTime();
		return Math.floor(diff / (1000 * 60 * 60 * 24));
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-medium text-gray-900">Retentie-overzicht</h2>
		<p class="mt-1 text-sm text-gray-500">
			Records waarvan de bewaartermijn is verlopen.
			Kies per record of u wilt anonimiseren, verlengen of vernietigen.
		</p>
	</div>

	{#if form?.success}
		<div class="rounded-md bg-green-50 border border-green-200 p-4">
			<p class="text-sm text-green-800">
				{#if form.action === 'anonymize'}
					Record(s) geanonimiseerd.
				{:else if form.action === 'extend'}
					Bewaartermijn verlengd.
				{:else if form.action === 'destroy'}
					Record vernietigd.
				{/if}
			</p>
		</div>
	{/if}

	{#if form?.message}
		<div class="rounded-md bg-red-50 border border-red-200 p-4">
			<p class="text-sm text-red-800">{form.message}</p>
		</div>
	{/if}

	<!-- Summary cards -->
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="rounded-lg border border-amber-200 bg-amber-50 p-6">
			<dt class="text-sm font-medium text-amber-800">Verlopen termijnen</dt>
			<dd class="mt-2 text-3xl font-semibold text-amber-900">
				{data.statusCounts.retention_expired}
			</dd>
		</div>
		<div class="rounded-lg border border-orange-200 bg-orange-50 p-6">
			<dt class="text-sm font-medium text-orange-800">
				Gearchiveerd (termijn voorbij)
			</dt>
			<dd class="mt-2 text-3xl font-semibold text-orange-900">
				{data.statusCounts.archived}
			</dd>
		</div>
	</div>

	<!-- Records table -->
	{#if data.expiredRecords.length === 0}
		<div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
			<p class="text-sm text-gray-500">
				Geen records met verlopen bewaartermijn gevonden.
			</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
							Tabel
						</th>
						<th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
							Classificatie
						</th>
						<th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
							Verlopen op
						</th>
						<th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
							Dagen over
						</th>
						<th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
							Status
						</th>
						<th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
							Acties
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each data.expiredRecords as record (record.id)}
						<tr class="hover:bg-gray-50">
							<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
								{TABLE_LABELS[record.table_name] ?? record.table_name}
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
								{CLASSIFICATION_LABELS[record.data_classification] ?? record.data_classification}
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
								{formatDate(record.retention_until)}
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-sm">
								<span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
									{daysExpired(record.retention_until)}d
								</span>
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
								{data.statusLabels[record.archive_status as keyof typeof data.statusLabels] ?? record.archive_status}
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-right text-sm">
								<div class="flex justify-end gap-2">
									<form method="POST" action="?/anonymize" use:enhance>
										<input type="hidden" name="table_name" value={record.table_name} />
										<input type="hidden" name="record_id" value={record.id} />
										<input type="hidden" name="strategy" value="replace" />
										<button
											type="submit"
											class="rounded bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
										>
											Anonimiseren
										</button>
									</form>
									<form method="POST" action="?/extend" use:enhance>
										<input type="hidden" name="table_name" value={record.table_name} />
										<input type="hidden" name="record_id" value={record.id} />
										<input type="hidden" name="years" value="1" />
										<button
											type="submit"
											class="rounded bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
										>
											Verlengen
										</button>
									</form>
									<form
										method="POST"
										action="?/destroy"
										use:enhance={({ cancel }) => {
											if (!confirm('Weet u zeker dat u dit record wilt vernietigen? Dit kan niet ongedaan worden gemaakt.')) {
												cancel();
												return;
											}
											return async ({ update }) => { await update(); };
										}}
									>
										<input type="hidden" name="table_name" value={record.table_name} />
										<input type="hidden" name="record_id" value={record.id} />
										<button
											type="submit"
											class="rounded bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
										>
											Vernietigen
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
