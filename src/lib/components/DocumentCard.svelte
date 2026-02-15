<script lang="ts">
	import type { Artifact } from '$types';
	import { getProgressPercentage, getStatusColor, getStatusLabel } from '$lib/utils/progressUtils';

	export let artifact: Artifact;
	export let projectId: string;

	const progressPercentage = getProgressPercentage(artifact.status);
	const statusColor = getStatusColor(artifact.status);
	const statusLabel = getStatusLabel(artifact.status);
</script>

<a
	href="/projects/{projectId}/documents/{artifact.document_type_id}?section={artifact.id}"
	class="block rounded-lg border border-gray-200 bg-white p-4 hover:border-primary-500 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
	aria-label="Bewerk {artifact.title}"
>
	<div class="flex items-start justify-between">
		<h3 class="font-medium text-gray-900 truncate flex-1 min-w-0">{artifact.title}</h3>
		<span class="ml-2 shrink-0 rounded-full px-2 py-1 text-xs font-medium {statusColor}">
			{statusLabel}
		</span>
	</div>
	
	<!-- Voortgangsbalk -->
	<div class="mt-3">
		<div class="flex items-center justify-between text-xs text-gray-500 mb-1">
			<span>Voortgang</span>
			<span>{progressPercentage}%</span>
		</div>
		<div class="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin="0" aria-valuemax="100">
			<div 
				class="bg-primary-600 h-2 rounded-full transition-all duration-300" 
				style="width: {progressPercentage}%"
			></div>
		</div>
	</div>
	
	<!-- Extra metadata -->
	<div class="mt-3 flex items-center justify-between text-xs text-gray-500">
		<span>Versie {artifact.version}</span>
		<span class="truncate">{artifact.section_key}</span>
	</div>
</a>