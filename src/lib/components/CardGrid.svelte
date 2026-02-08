<script lang="ts">
	export let columns: 1 | 2 | 3 | 4 = 3;

	const COLUMN_CLASSES = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 sm:grid-cols-2',
		3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
		4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
	} as const;
</script>

<div class="grid gap-4 {COLUMN_CLASSES[columns]}">
	<slot />
</div>
