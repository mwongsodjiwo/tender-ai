<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-medium text-gray-900">Overzicht</h2>
		<p class="mt-1 text-sm text-gray-500">Platform statistieken.</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-sm">
			<dt class="text-sm font-medium text-gray-500">Organisaties</dt>
			<dd class="mt-2 text-3xl font-bold text-gray-900">{data.orgCount}</dd>
		</div>
		<div class="rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-sm">
			<dt class="text-sm font-medium text-gray-500">Gebruikers</dt>
			<dd class="mt-2 text-3xl font-bold text-gray-900">{data.userCount}</dd>
		</div>
	</div>
</div>
