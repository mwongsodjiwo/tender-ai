<script lang="ts">
	import type { PageData } from './$types';
	import AuditLog from '$components/AuditLog.svelte';
	import BackButton from '$lib/components/BackButton.svelte';

	export let data: PageData;

	$: project = data.project;
</script>

<svelte:head>
	<title>Audit log — {project.name} — Tendermanager</title>
</svelte:head>

<div class="space-y-6">
	<BackButton />

	<div>
		<h1 class="text-2xl font-bold text-gray-900">Audit log</h1>
		<p class="mt-1 text-sm text-gray-500">Alle activiteit voor {project.name}</p>
	</div>

	<AuditLog url="/api/projects/{project.id}/audit" />
</div>
