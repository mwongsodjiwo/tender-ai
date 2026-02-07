<script lang="ts">
	import type { PageData } from './$types';
	import { PROCEDURE_TYPE_LABELS } from '$types';
	import type { Document } from '$types';
	import TeamManager from '$components/TeamManager.svelte';
	import ReviewerInvite from '$components/ReviewerInvite.svelte';
	import RoleSwitcher from '$components/RoleSwitcher.svelte';
	import AuditLog from '$components/AuditLog.svelte';
	import DocumentUpload from '$components/DocumentUpload.svelte';
	import DocumentList from '$components/DocumentList.svelte';

	export let data: PageData;

	$: project = data.project;
	$: artifacts = data.artifacts;
	$: members = data.members as { id: string; profile: { first_name: string; last_name: string; email: string }; roles: { role: import('$types').ProjectRole }[] }[];
	$: reviewers = data.reviewers as { id: string; email: string; name: string; review_status: string; token: string; artifact: { id: string; title: string } | null }[];
	$: organizationMembers = data.organizationMembers as { profile_id: string; profile: { first_name: string; last_name: string; email: string } }[];
	$: uploadedDocuments = (data.uploadedDocuments ?? []) as Document[];

	// Determine current user's roles in this project
	$: currentUserRoles = (() => {
		const currentMember = members.find(
			(m) => m.profile?.email === data.profile?.email
		);
		return currentMember?.roles?.map((r) => r.role) ?? [];
	})();
	let activeRole: import('$types').ProjectRole = 'viewer';
	$: if (currentUserRoles.length > 0 && !currentUserRoles.includes(activeRole)) {
		activeRole = currentUserRoles[0];
	}

	let activeTab: 'documents' | 'uploads' | 'team' | 'reviewers' | 'audit' = 'documents';

	function reloadUploads(): void {
		window.location.reload();
	}

	const STATUS_LABELS: Record<string, string> = {
		draft: 'Concept',
		briefing: 'Briefing',
		generating: 'Genereren',
		review: 'Review',
		approved: 'Goedgekeurd',
		published: 'Gepubliceerd',
		archived: 'Gearchiveerd'
	};

	const STATUS_COLORS: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-800',
		briefing: 'bg-blue-100 text-blue-800',
		generating: 'bg-yellow-100 text-yellow-800',
		review: 'bg-purple-100 text-purple-800',
		approved: 'bg-green-100 text-green-800',
		published: 'bg-green-200 text-green-900',
		archived: 'bg-gray-200 text-gray-600'
	};

	const ARTIFACT_STATUS_COLORS: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700',
		generated: 'bg-blue-100 text-blue-700',
		review: 'bg-purple-100 text-purple-700',
		approved: 'bg-green-100 text-green-700',
		rejected: 'bg-red-100 text-red-700'
	};

	const ARTIFACT_STATUS_LABELS: Record<string, string> = {
		draft: 'Concept',
		generated: 'Gegenereerd',
		review: 'In review',
		approved: 'Goedgekeurd',
		rejected: 'Afgewezen'
	};

	// Group artifacts by document type
	type ArtifactWithType = (typeof artifacts)[number];
	$: groupedArtifacts = artifacts.reduce<Record<string, { docType: { id: string; name: string; slug: string }; items: ArtifactWithType[] }>>((acc, artifact) => {
		const docType = (artifact as Record<string, unknown>).document_type as { id: string; name: string; slug: string } | null;
		const key = docType?.id ?? 'unknown';
		if (!acc[key]) acc[key] = { docType: docType ?? { id: 'unknown', name: 'Overig', slug: 'overig' }, items: [] };
		acc[key].items.push(artifact);
		return acc;
	}, {});

	let exporting = '';

	async function handleExport(docTypeId: string, format: 'docx' | 'pdf') {
		exporting = `${docTypeId}-${format}`;

		const response = await fetch(`/api/projects/${project.id}/export`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ document_type_id: docTypeId, format })
		});

		if (response.ok) {
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const disposition = response.headers.get('Content-Disposition') ?? '';
			const filenameMatch = disposition.match(/filename="(.+)"/);
			const filename = filenameMatch?.[1] ?? `document.${format}`;

			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
		}

		exporting = '';
	}
</script>

<svelte:head>
	<title>{project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<div class="mb-4">
		<a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">&larr; Terug naar dashboard</a>
	</div>

	<!-- Project header -->
	<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">{project.name}</h1>
				{#if project.description}
					<p class="mt-1 text-gray-600">{project.description}</p>
				{/if}
			</div>
			<span class="rounded-full px-3 py-1 text-sm font-medium {STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-800'}">
				{STATUS_LABELS[project.status] ?? project.status}
			</span>
		</div>

		<div class="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
			{#if project.procedure_type}
				<span>Procedure: {PROCEDURE_TYPE_LABELS[project.procedure_type] ?? project.procedure_type}</span>
			{/if}
			{#if project.estimated_value}
				<span>Waarde: &euro;{project.estimated_value.toLocaleString('nl-NL')}</span>
			{/if}
		</div>

		<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			{#if project.status === 'draft' || project.status === 'briefing'}
				<a
					href="/projects/{project.id}/briefing"
					class="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:justify-start"
				>
					{project.status === 'draft' ? 'Briefing starten' : 'Briefing voortzetten'}
				</a>
			{:else}
				<div></div>
			{/if}

			<RoleSwitcher roles={currentUserRoles} bind:activeRole />
		</div>
	</div>

	<!-- Tab navigation (scrollable on mobile) -->
	<div class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
		<div class="inline-flex min-w-full border-b border-gray-200" role="tablist" aria-label="Projectonderdelen">
			{#each [
				{ id: 'documents', label: 'Documenten' },
				{ id: 'uploads', label: 'Uploads' },
				{ id: 'team', label: 'Team' },
				{ id: 'reviewers', label: 'Kennishouders' },
				{ id: 'audit', label: 'Audit log' }
			] as tab}
				<button
					role="tab"
					aria-selected={activeTab === tab.id}
					on:click={() => (activeTab = tab.id)}
					class="inline-flex shrink-0 items-center border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap {activeTab === tab.id
						? 'border-primary-500 text-primary-600'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Documents tab -->
	{#if activeTab !== 'documents'}
		<!-- Hidden when not active -->
	{:else if artifacts.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<h3 class="text-sm font-semibold text-gray-900">Nog geen documentsecties</h3>
			<p class="mt-1 text-sm text-gray-500">
				{#if project.status === 'draft' || project.status === 'briefing'}
					Voltooi eerst de briefing om documenten te laten genereren.
				{:else}
					Er worden documentsecties gegenereerd...
				{/if}
			</p>
		</div>
	{:else}
		<h2 class="text-lg font-semibold text-gray-900">Documenten</h2>
		{#each Object.entries(groupedArtifacts) as [docTypeId, { docType, items }]}
			<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
					<h3 class="text-base font-semibold text-gray-900">{docType.name}</h3>
					<div class="flex gap-2">
						<button
							on:click={() => handleExport(docType.id, 'docx')}
							disabled={exporting === `${docType.id}-docx`}
							class="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							{exporting === `${docType.id}-docx` ? 'Bezig...' : 'Word'}
						</button>
						<button
							on:click={() => handleExport(docType.id, 'pdf')}
							disabled={exporting === `${docType.id}-pdf`}
							class="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							{exporting === `${docType.id}-pdf` ? 'Bezig...' : 'PDF'}
						</button>
					</div>
				</div>
				<ul class="divide-y divide-gray-200">
					{#each items as artifact}
						<li>
							<a
								href="/projects/{project.id}/sections/{artifact.id}"
								class="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
							>
								<div>
									<p class="font-medium text-gray-900">{artifact.title}</p>
									<p class="mt-0.5 text-xs text-gray-400">Versie {artifact.version}</p>
								</div>
								<span class="rounded-full px-2.5 py-0.5 text-xs font-medium {ARTIFACT_STATUS_COLORS[artifact.status] ?? 'bg-gray-100 text-gray-700'}">
									{ARTIFACT_STATUS_LABELS[artifact.status] ?? artifact.status}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	{/if}

	<!-- Uploads tab -->
	{#if activeTab === 'uploads'}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="lg:col-span-2">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Geüploade documenten</h2>
				<DocumentList
					documents={uploadedDocuments}
					projectId={project.id}
					onDelete={reloadUploads}
				/>
			</div>
			<div>
				<DocumentUpload
					projectId={project.id}
					organizationId={project.organization_id}
					onUploadComplete={reloadUploads}
				/>
			</div>
		</div>
	{/if}

	<!-- Team tab -->
	{#if activeTab === 'team'}
		<TeamManager
			projectId={project.id}
			{members}
			{organizationMembers}
		/>
	{/if}

	<!-- Reviewers tab -->
	{#if activeTab === 'reviewers'}
		<ReviewerInvite
			projectId={project.id}
			artifacts={artifacts.map((a) => ({ id: a.id, title: a.title, section_key: a.section_key }))}
			{reviewers}
		/>
	{/if}

	<!-- Audit tab -->
	{#if activeTab === 'audit'}
		{@const auditUrl = `/api/projects/${project.id}/audit`}
		<AuditLog url={auditUrl} />
	{/if}
</div>
