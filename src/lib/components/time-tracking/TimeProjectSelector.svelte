<script lang="ts">
	export let value: string;
	export let projects: { id: string; name: string }[];
	export let id: string;
	export let isWeekend = false;
	export let onChange: (projectId: string) => void;
</script>

<div class="min-w-[180px] flex-1">
	<label for={id} class="sr-only">Project</label>
	<select
		{id}
		{value}
		on:change={(e) => onChange(e.currentTarget.value)}
		class="w-full rounded-lg border {isWeekend ? 'border-gray-200' : 'border-gray-300'} bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
	>
		{#each projects as project (project.id)}
			<option value={project.id}>{project.name}</option>
		{/each}
	</select>
</div>
