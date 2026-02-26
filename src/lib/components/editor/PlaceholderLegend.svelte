<script lang="ts">
	export let visible = false;
</script>

{#if visible}
	<div
		class="absolute right-0 top-full z-10 mt-1 w-56 rounded-md border border-gray-200 bg-white p-3 shadow-lg"
		role="tooltip"
		aria-label="Legenda markeringen"
	>
		<p class="mb-2 text-xs font-semibold text-gray-700">Legenda markeringen</p>
		<div class="space-y-1.5">
			<div class="flex items-center gap-2">
				<span class="inline-block h-4 w-4 rounded-sm bg-[#E3F2FD]"></span>
				<span class="text-xs text-gray-600">Database-waarde</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="inline-block h-4 w-4 rounded-sm bg-[#F3E5F5]"></span>
				<span class="text-xs text-gray-600">AI-gegenereerd</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="inline-block h-4 w-4 rounded-sm bg-[#FFF3E0]"></span>
				<span class="text-xs text-gray-600">Onbekend veld</span>
			</div>
		</div>
	</div>
{/if}
