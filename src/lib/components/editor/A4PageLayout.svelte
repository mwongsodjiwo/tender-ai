<script lang="ts">
	import type { Editor } from '@tiptap/core';

	/** TipTap Editor instance (kept for API compatibility) */
	export let editor: Editor | null = null;
	/** When true, Pages extension handles page breaks internally */
	export let enablePagination = false;

	const A4_WIDTH_PX = 794;
	const RESPONSIVE_THRESHOLD = 830;

	let innerWidth = 1024;

	$: responsiveScale = innerWidth < RESPONSIVE_THRESHOLD
		? (innerWidth - 32) / A4_WIDTH_PX
		: 1;

	void editor;
</script>

<svelte:window bind:innerWidth />

<div
	class="a4-responsive-wrap"
	style={responsiveScale < 1
		? `transform: scale(${responsiveScale}); transform-origin: top center;`
		: ''}
>
	<div class="a4-page" class:a4-page--paginated={enablePagination}>
		<div class="a4-content">
			<slot />
		</div>
	</div>
</div>

<style>
	.a4-responsive-wrap {
		width: 210mm;
		margin: 0 auto 40px;
	}

	.a4-page {
		position: relative;
		background: white;
		width: 210mm;
		min-height: 297mm;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.a4-content {
		position: relative;
		z-index: 0;
	}

	/* Reset editor-wrapper styles inside A4 layout */
	.a4-page :global(.tiptap-editor-wrapper) {
		border: none;
		border-radius: 0;
		min-height: unset;
		background: transparent;
	}

	/* Override editor font/line-height for A4 page view */
	.a4-page :global(.tiptap-editor-wrapper .tiptap) {
		padding: 0;
		min-height: unset;
		font-family: 'Asap', sans-serif;
		font-size: var(--editor-font-size, 11pt);
		line-height: 1.6;
		color: #1a1a1a;
	}

	/* Pages active: transparent wrapper, no shadow */
	.a4-page--paginated {
		min-height: unset;
		background: transparent;
		box-shadow: none;
		width: auto;
		border: none;
	}

	@media print {
		.a4-responsive-wrap {
			margin: 0;
		}

		.a4-page {
			box-shadow: none;
			break-after: page;
		}

		.a4-page :global(.tiptap-pagination-gap) {
			display: none;
		}
	}
</style>
