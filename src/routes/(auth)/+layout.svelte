<script lang="ts">
	import type { LayoutData } from './$types';
	export let data: LayoutData;
</script>

<div class="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h1 class="text-3xl font-bold tracking-tight text-gray-900">Tendermanager</h1>
			<p class="mt-2 text-sm text-gray-600">
				AI-gestuurd platform voor aanbestedingsdocumenten
			</p>
		</div>
		<slot />
	</div>
</div>
