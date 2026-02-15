<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	export let projectId: string;
	export let artifacts: { id: string; title: string; section_key: string }[];
	export let reviewers: {
		id: string;
		email: string;
		name: string;
		review_status: string;
		token: string;
		artifact: { id: string; title: string } | null;
	}[];

	let showForm = false;
	let selectedArtifactId = '';
	let email = '';
	let name = '';
	let loading = false;
	let errorMessage = '';
	let copiedToken = '';

	const REVIEW_STATUS_LABELS: Record<string, string> = {
		pending: 'In afwachting',
		approved: 'Goedgekeurd',
		rejected: 'Afgewezen'
	};

	const REVIEW_STATUS_COLORS: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800',
		approved: 'bg-success-100 text-success-800',
		rejected: 'bg-error-100 text-error-800'
	};

	async function inviteReviewer() {
		if (!selectedArtifactId || !email || !name) return;
		loading = true;
		errorMessage = '';

		const response = await fetch(`/api/projects/${projectId}/reviewers`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ artifact_id: selectedArtifactId, email, name })
		});

		if (response.ok) {
			showForm = false;
			selectedArtifactId = '';
			email = '';
			name = '';
			await invalidateAll();
		} else {
			const data = await response.json();
			errorMessage = data.message ?? 'Er is een fout opgetreden';
		}

		loading = false;
	}

	function copyReviewLink(token: string) {
		const url = `${window.location.origin}/review/${token}`;
		navigator.clipboard.writeText(url);
		copiedToken = token;
		setTimeout(() => (copiedToken = ''), 2000);
	}
</script>

<div class="rounded-card border border-gray-200 bg-white shadow-card transition hover:shadow-sm">
	<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
		<h3 class="text-base font-semibold text-gray-900">Kennishouders</h3>
		<button
			on:click={() => (showForm = !showForm)}
			class="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
		>
			{showForm ? 'Annuleren' : 'Kennishouder uitnodigen'}
		</button>
	</div>

	{#if showForm}
		<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
			<div class="space-y-3">
				<div>
					<label for="artifact-select" class="block text-sm font-medium text-gray-700">
						Sectie voor review
					</label>
					<select
						id="artifact-select"
						bind:value={selectedArtifactId}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					>
						<option value="">Selecteer een sectie...</option>
						{#each artifacts as artifact}
							<option value={artifact.id}>{artifact.title}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="reviewer-name" class="block text-sm font-medium text-gray-700">
						Naam kennishouder
					</label>
					<input
						id="reviewer-name"
						type="text"
						bind:value={name}
						placeholder="Jan de Vries"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					/>
				</div>

				<div>
					<label for="reviewer-email" class="block text-sm font-medium text-gray-700">
						E-mailadres
					</label>
					<input
						id="reviewer-email"
						type="email"
						bind:value={email}
						placeholder="j.devries@gemeente.nl"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
					/>
				</div>

				{#if errorMessage}
					<p class="text-sm text-error-600" role="alert">{errorMessage}</p>
				{/if}

				<button
					on:click={inviteReviewer}
					disabled={!selectedArtifactId || !email || !name || loading}
					class="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
				>
					{loading ? 'Bezig...' : 'Uitnodigen'}
				</button>
			</div>
		</div>
	{/if}

	{#if reviewers.length === 0}
		<div class="px-6 py-8 text-center">
			<p class="text-sm text-gray-500">Nog geen kennishouders uitgenodigd.</p>
		</div>
	{:else}
		<ul class="divide-y divide-gray-200">
			{#each reviewers as reviewer}
				<li class="px-6 py-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="font-medium text-gray-900">{reviewer.name}</p>
							<p class="text-sm text-gray-500">{reviewer.email}</p>
							{#if reviewer.artifact}
								<p class="mt-0.5 text-xs text-gray-500">
									Sectie: {reviewer.artifact.title}
								</p>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {REVIEW_STATUS_COLORS[reviewer.review_status] ?? 'bg-gray-100 text-gray-700'}">
								{REVIEW_STATUS_LABELS[reviewer.review_status] ?? reviewer.review_status}
							</span>
							{#if reviewer.review_status === 'pending'}
								<button
									on:click={() => copyReviewLink(reviewer.token)}
									class="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
								>
									{copiedToken === reviewer.token ? 'Gekopieerd!' : 'Link kopieren'}
								</button>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
