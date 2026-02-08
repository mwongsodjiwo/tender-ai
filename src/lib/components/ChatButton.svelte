<script lang="ts">
	export let label: string = 'Chat met AI';
	export let onClick: () => void;
</script>

<button
	type="button"
	class="inline-flex items-center gap-2 rounded-card bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-card transition-all hover:bg-primary-700 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
	aria-label={label}
	title={label}
	on:click={onClick}
>
	<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
	</svg>
	<span>{label}</span>
</button>
