import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = 'src/lib/components/editor/A4PageLayout.svelte';

function readComponent(): string {
	return readFileSync(resolve(process.cwd(), COMPONENT_PATH), 'utf-8');
}

// =============================================================================
// A4 PAGE DIMENSIONS TESTS
// =============================================================================

describe('A4PageLayout — page dimensions', () => {
	it('defines A4 height as 297mm', () => {
		const source = readComponent();
		expect(source).toContain('A4_HEIGHT_MM = 297');
	});

	it('defines mm-to-px conversion factor', () => {
		const source = readComponent();
		expect(source).toContain('MM_TO_PX = 3.7795');
	});

	it('defines A4 width as 794px', () => {
		const source = readComponent();
		expect(source).toContain('A4_WIDTH_PX = 794');
	});

	it('sets A4 page width to 210mm in CSS', () => {
		const source = readComponent();
		expect(source).toContain('width: 210mm');
	});

	it('sets minimum height to 297mm', () => {
		const source = readComponent();
		expect(source).toContain('min-height: 297mm');
	});

	it('calculates content height from A4 minus margins', () => {
		const source = readComponent();
		expect(source).toContain('A4_HEIGHT_MM - pageMargins.top - pageMargins.bottom');
	});

	it('converts content height to px', () => {
		const source = readComponent();
		expect(source).toContain('contentHeightMm * MM_TO_PX');
	});
});

// =============================================================================
// PAGE MARGINS TESTS
// =============================================================================

describe('A4PageLayout — page margins', () => {
	it('has pageMargins prop with defaults', () => {
		const source = readComponent();
		expect(source).toContain('export let pageMargins');
		expect(source).toContain('top: 25, right: 25, bottom: 25, left: 25');
	});

	it('applies margins as CSS mm values', () => {
		const source = readComponent();
		expect(source).toContain(
			'style="padding: {pageMargins.top}mm {pageMargins.right}mm {pageMargins.bottom}mm {pageMargins.left}mm;"'
		);
	});
});

// =============================================================================
// PAGINATION TESTS
// =============================================================================

describe('A4PageLayout — pagination', () => {
	it('starts with pageCount of 1', () => {
		const source = readComponent();
		expect(source).toContain('let pageCount = 1');
	});

	it('has updatePageCount function', () => {
		const source = readComponent();
		expect(source).toContain('function updatePageCount()');
	});

	it('calculates pages from scroll height', () => {
		const source = readComponent();
		expect(source).toContain('Math.ceil(height / contentHeightPx)');
	});

	it('ensures at least 1 page', () => {
		const source = readComponent();
		expect(source).toContain('Math.max(1,');
	});

	it('caches scroll height to avoid unnecessary recalculations', () => {
		const source = readComponent();
		expect(source).toContain('cachedScrollHeight');
		expect(source).toContain('if (height === cachedScrollHeight) return');
	});

	it('renders page separators for multi-page documents', () => {
		const source = readComponent();
		expect(source).toContain('a4-page-separator');
		expect(source).toContain('{#if i > 0}');
	});

	it('renders page numbers', () => {
		const source = readComponent();
		expect(source).toContain('Pagina {i + 1}');
		expect(source).toContain('a4-page-number');
	});

	it('page separators are aria-hidden', () => {
		const source = readComponent();
		expect(source).toContain('aria-hidden="true"');
	});
});

// =============================================================================
// RESPONSIVE SCALING TESTS
// =============================================================================

describe('A4PageLayout — responsive scaling', () => {
	it('defines responsive threshold at 830px', () => {
		const source = readComponent();
		expect(source).toContain('RESPONSIVE_THRESHOLD = 830');
	});

	it('calculates responsive scale factor', () => {
		const source = readComponent();
		expect(source).toContain('innerWidth < RESPONSIVE_THRESHOLD');
		expect(source).toContain('(innerWidth - 32) / A4_WIDTH_PX');
	});

	it('applies CSS transform scale when below threshold', () => {
		const source = readComponent();
		expect(source).toContain('transform: scale(${responsiveScale})');
	});

	it('sets transform-origin to top center', () => {
		const source = readComponent();
		expect(source).toContain('transform-origin: top center');
	});

	it('binds to window innerWidth', () => {
		const source = readComponent();
		expect(source).toContain('bind:innerWidth');
	});
});

// =============================================================================
// RESIZE OBSERVER TESTS
// =============================================================================

describe('A4PageLayout — resize observer', () => {
	it('creates ResizeObserver on mount', () => {
		const source = readComponent();
		expect(source).toContain('new ResizeObserver');
		expect(source).toContain('onMount');
	});

	it('disconnects observer on destroy', () => {
		const source = readComponent();
		expect(source).toContain('onDestroy');
		expect(source).toContain('observer?.disconnect()');
	});

	it('observes content element', () => {
		const source = readComponent();
		expect(source).toContain('observer.observe(contentEl)');
	});
});

// =============================================================================
// PRINT SUPPORT TESTS
// =============================================================================

describe('A4PageLayout — print support', () => {
	it('has @media print styles', () => {
		const source = readComponent();
		expect(source).toContain('@media print');
	});

	it('removes box shadow in print mode', () => {
		const source = readComponent();
		expect(source).toContain('box-shadow: none');
	});

	it('hides page separators in print mode', () => {
		const source = readComponent();
		expect(source).toContain('.a4-page-separator');
		expect(source).toContain('display: none');
	});

	it('hides page numbers in print mode', () => {
		const source = readComponent();
		expect(source).toContain('.a4-page-number');
	});
});

// =============================================================================
// SLOT AND EDITOR INTEGRATION TESTS
// =============================================================================

describe('A4PageLayout — slot and editor integration', () => {
	it('uses <slot /> for editor content', () => {
		const source = readComponent();
		expect(source).toContain('<slot />');
	});

	it('has editor prop for reactive recalculation', () => {
		const source = readComponent();
		expect(source).toContain('export let editor: Editor | null = null');
	});

	it('configures TipTap editor wrapper styles', () => {
		const source = readComponent();
		expect(source).toContain('.tiptap-editor-wrapper');
	});

	it('sets default editor font to Asap', () => {
		const source = readComponent();
		expect(source).toContain("font-family: 'Asap', sans-serif");
	});
});

// =============================================================================
// QUALITY CHECKS
// =============================================================================

describe('A4PageLayout — quality checks', () => {
	it('has no console.log', () => {
		const source = readComponent();
		expect(source).not.toContain('console.log');
	});

	it('is under 200 lines', () => {
		const source = readComponent();
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});
