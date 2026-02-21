<script lang="ts">
	import { onDestroy } from 'svelte';
	import { sidebarWidth, MIN_WIDTH, MAX_WIDTH } from '$lib/stores/sidebarWidth';

	let dragging = false;
	let startX = 0;
	let startWidth = 0;

	function handleDragStart(event: MouseEvent): void {
		if (window.innerWidth < 1024) return;
		dragging = true;
		startX = event.clientX;
		startWidth = $sidebarWidth;
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
		window.addEventListener('mousemove', handleDragMove);
		window.addEventListener('mouseup', handleDragEnd);
	}

	function handleDragMove(event: MouseEvent): void {
		if (!dragging) return;
		const delta = event.clientX - startX;
		sidebarWidth.set(startWidth + delta);
	}

	function handleDragEnd(): void {
		dragging = false;
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
		window.removeEventListener('mousemove', handleDragMove);
		window.removeEventListener('mouseup', handleDragEnd);
	}

	function handleDragReset(): void {
		sidebarWidth.reset();
	}

	onDestroy(() => {
		if (dragging) handleDragEnd();
	});
</script>

<!-- Resize handle (desktop only) -->
<div
	class="absolute inset-y-0 -right-1 hidden w-2 cursor-col-resize lg:block"
	on:mousedown={handleDragStart}
	on:dblclick={handleDragReset}
	role="separator"
	aria-orientation="vertical"
	aria-valuenow={$sidebarWidth}
	aria-valuemin={MIN_WIDTH}
	aria-valuemax={MAX_WIDTH}
	aria-label="Zijbalk breedte aanpassen"
	tabindex="0"
>
	<div
		class="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors
			{dragging ? 'bg-primary-500' : 'bg-transparent hover:bg-primary-400'}"
	></div>
</div>
