<!-- Reusable error alert component -->
<script lang="ts">
	export let title: string = 'Er is een fout opgetreden';
	export let message: string;
	export let retryLabel: string = 'Opnieuw proberen';
	export let onRetry: (() => void) | null = null;
</script>

<div class="rounded-lg border border-red-200 bg-red-50 p-4 sm:p-6" role="alert">
	<div class="flex">
		<div class="flex-shrink-0">
			<svg class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
			</svg>
		</div>
		<div class="ml-3">
			<h3 class="text-sm font-medium text-red-800">{title}</h3>
			<p class="mt-1 text-sm text-red-700">{message}</p>
			{#if onRetry}
				<button
					on:click={onRetry}
					class="mt-3 rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
				>
					{retryLabel}
				</button>
			{/if}
		</div>
	</div>
</div>
