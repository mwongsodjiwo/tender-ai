<script lang="ts">
	import type { LayoutData } from './$types';
	export let data: LayoutData;
</script>

<div class="flex min-h-screen">
	<!-- Left: form area -->
	<div class="flex w-full flex-col justify-center px-8 py-12 sm:px-12 lg:w-1/2 lg:px-24">
		<div class="mx-auto w-full max-w-md">
			<div class="mb-8 flex items-center gap-3">
				<img src="/logo.png" alt="Tendermanager logo" class="h-10 w-10 rounded-full" />
				<span class="text-xl font-bold text-gray-900">Tendermanager</span>
			</div>
			<slot />
		</div>
	</div>

	<!-- Right: marketing panel (hidden on mobile) -->
	<div class="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:bg-[#EBEBEB] lg:px-16 xl:px-24">
		<div class="max-w-lg">
			<h2 class="text-4xl font-semibold leading-tight tracking-tight text-gray-900 xl:text-5xl">
				Beheer en bewaak je aanbestedingen met Tendermanager.
			</h2>

			<ul class="mt-10 space-y-5">
				<li class="flex items-center gap-4">
					<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-400">
						<svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
						</svg>
					</span>
					<span class="text-base text-gray-700">Overzicht van al je lopende aanbestedingen</span>
				</li>
				<li class="flex items-center gap-4">
					<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-400">
						<svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
						</svg>
					</span>
					<span class="text-base text-gray-700">Automatische planning en deadline bewaking</span>
				</li>
				<li class="flex items-center gap-4">
					<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-400">
						<svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
						</svg>
					</span>
					<span class="text-base text-gray-700">Documentbeheer en versiebeheer</span>
				</li>
				<li class="flex items-center gap-4">
					<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-400">
						<svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
						</svg>
					</span>
					<span class="text-base text-gray-700">Samenwerken met je hele team</span>
				</li>
				<li class="flex items-center gap-4">
					<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-400">
						<svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H6m10.5-2.625V6.75a2.25 2.25 0 0 1-2.25 2.25H9.75a2.25 2.25 0 0 1-2.25-2.25V4.875m7.5 0a48.667 48.667 0 0 0-7.5 0" />
						</svg>
					</span>
					<span class="text-base text-gray-700">PvE generator op basis van jouw projectprofiel</span>
				</li>
				<li class="flex items-center gap-4">
					<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-400">
						<svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
						</svg>
					</span>
					<span class="text-base text-gray-700">Documenten automatisch gegenereerd met AI</span>
				</li>
			</ul>
		</div>
	</div>
</div>
