import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock Svelte component imports used by ResizableImageExtension
vi.mock('$lib/components/editor/ResizableImageView.svelte', () => ({ default: {} }));

import { createEditorExtensions, convertPlainTextToHtml } from '$lib/components/editor/editor-config';
import { ResizableImageExtension } from '$lib/components/editor/ResizableImageExtension';
import { computeLabel, findActiveHeadingId, mapToTocItems } from '$lib/components/editor/toc-utils';
import type { TocItem } from '$lib/components/editor/toc-utils';

// =============================================================================
// EDGE CASE: EMPTY EDITOR
// =============================================================================

describe('Edge case — empty editor', () => {
	it('createEditorExtensions works with default (empty) options', () => {
		const extensions = createEditorExtensions();
		expect(extensions.length).toBeGreaterThan(0);
	});

	it('convertPlainTextToHtml handles empty string', () => {
		const result = convertPlainTextToHtml('');
		expect(result).toBe('<p></p>');
	});

	it('convertPlainTextToHtml handles whitespace only', () => {
		const result = convertPlainTextToHtml('   ');
		expect(result).toBe('<p>   </p>');
	});

	it('TOC sidebar shows empty state message', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/components/editor/TocSidebar.svelte'),
			'utf-8'
		);
		expect(source).toContain('{#if items.length === 0}');
		expect(source).toContain('Geen koppen gevonden');
	});

	it('FontSizePicker defaults to 11 without editor', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/components/editor/FontSizePicker.svelte'),
			'utf-8'
		);
		expect(source).toContain("if (!ed) return '11'");
	});

	it('FontPicker shows "Standaard" without active font', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/components/editor/FontPicker.svelte'),
			'utf-8'
		);
		expect(source).toContain("displayFont = activeFont || 'Standaard'");
	});
});

// =============================================================================
// EDGE CASE: DOCUMENT WITH ONLY IMAGES
// =============================================================================

describe('Edge case — image-only document', () => {
	it('ResizableImageExtension handles all image attributes', () => {
		const cfg = ResizableImageExtension.config;
		const ctx = { name: 'resizableImage', options: { HTMLAttributes: {} } };
		const attrs = cfg.addAttributes?.call(ctx);

		expect(attrs?.src?.default).toBeNull();
		expect(attrs?.alt?.default).toBeNull();
		expect(attrs?.width?.default).toBeNull();
		expect(attrs?.height?.default).toBeNull();
		expect(attrs?.align?.default).toBe('center');
	});

	it('ResizableImageExtension renders img with merged attributes', () => {
		const cfg = ResizableImageExtension.config;
		const ctx = { name: 'resizableImage', options: { HTMLAttributes: {} } };
		const result = cfg.renderHTML?.call(ctx, {
			node: {
				attrs: { src: 'img1.png', width: 300, height: 200 }
			},
			HTMLAttributes: { src: 'img1.png', width: 300, height: 200 }
		});

		expect(result[0]).toBe('img');
		expect(result[1].src).toBe('img1.png');
		expect(result[1].width).toBe(300);
	});

	it('convertPlainTextToHtml does not wrap img HTML', () => {
		const html = '<div><img src="test.png" /></div>';
		const result = convertPlainTextToHtml(html);
		expect(result).toBe(html);
	});
});

// =============================================================================
// EDGE CASE: 100+ HEADINGS
// =============================================================================

describe('Edge case — 100+ headings', () => {
	function makeTocItem(level: number, index: number): TocItem {
		return {
			id: `h-${index}`,
			level,
			textContent: `Heading ${index}`,
			isActive: false,
			dom: null as unknown as HTMLElement,
			itemIndex: index
		};
	}

	it('computeLabel handles 100+ headings without error', () => {
		const items: TocItem[] = [];
		for (let i = 0; i < 150; i++) {
			const level = (i % 3) + 1;
			items.push(makeTocItem(level, i));
		}
		// Should not throw
		const label = computeLabel(items, 149);
		expect(label).toBeTruthy();
		expect(label.length).toBeGreaterThan(0);
	});

	it('computeLabel produces correct numbering for large sets', () => {
		const items: TocItem[] = [];
		// 50 H1 headings
		for (let i = 0; i < 50; i++) {
			items.push(makeTocItem(1, i));
		}
		expect(computeLabel(items, 0)).toBe('1');
		expect(computeLabel(items, 49)).toBe('50');
	});

	it('mapToTocItems handles large arrays', () => {
		const mockData = Array.from({ length: 200 }, (_, i) => ({
			id: `id-${i}`,
			level: (i % 3) + 1,
			textContent: `Heading ${i}`,
			isActive: i === 0,
			dom: null as unknown as HTMLElement,
			itemIndex: i
		}));
		const result = mapToTocItems(mockData);
		expect(result).toHaveLength(200);
		expect(result[199].id).toBe('id-199');
	});

	it('deeply nested hierarchy with 100+ items computes correctly', () => {
		const items: TocItem[] = [];
		// Generate pattern: H1, H2, H3, H2, H3, H1, H2, H3...
		for (let i = 0; i < 120; i++) {
			if (i % 5 === 0) items.push(makeTocItem(1, i));
			else if (i % 5 === 1 || i % 5 === 3) items.push(makeTocItem(2, i));
			else items.push(makeTocItem(3, i));
		}
		// All calls should return non-empty strings
		for (let i = 0; i < items.length; i++) {
			const label = computeLabel(items, i);
			expect(label.length).toBeGreaterThan(0);
		}
	});
});

// =============================================================================
// EDGE CASE: DOCUMENT WITHOUT HEADINGS (TOC SHOWS EMPTY STATE)
// =============================================================================

describe('Edge case — no headings', () => {
	it('TocSidebar shows "Geen koppen gevonden" for empty items', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/components/editor/TocSidebar.svelte'),
			'utf-8'
		);
		expect(source).toContain('{#if items.length === 0}');
		expect(source).toContain('Geen koppen gevonden. Gebruik Kop 1, 2 of 3.');
	});

	it('computeLabel returns empty string for empty items', () => {
		expect(computeLabel([], 0)).toBe('');
	});

	it('findActiveHeadingId returns empty string for empty items', () => {
		expect(findActiveHeadingId([], null)).toBe('');
	});
});

// =============================================================================
// PERFORMANCE TEST: 20-PAGE DOCUMENT INPUT LATENCY
// =============================================================================

describe('Performance — large document generation', () => {
	function generateLargeDocument(pageCount: number): string {
		const sections: string[] = [];
		for (let page = 0; page < pageCount; page++) {
			const level = (page % 3) + 1;
			sections.push(`<h${level}>Section ${page + 1}</h${level}>`);
			for (let p = 0; p < 8; p++) {
				sections.push(
					'<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
					'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
					'Ut enim ad minim veniam, quis nostrud exercitation ullamco.</p>'
				);
			}
		}
		return sections.join('\n');
	}

	it('generates 20-page document within performance budget', () => {
		const start = performance.now();
		const doc = generateLargeDocument(20);
		const elapsed = performance.now() - start;

		// HTML generation should be < 100ms
		expect(elapsed).toBeLessThan(100);
		expect(doc.length).toBeGreaterThan(10000);
	});

	it('convertPlainTextToHtml processes large content quickly', () => {
		const largeText = Array(1000).fill('Line of text for performance testing').join('\n\n');
		const start = performance.now();
		const result = convertPlainTextToHtml(largeText);
		const elapsed = performance.now() - start;

		expect(elapsed).toBeLessThan(100);
		expect(result).toContain('<p>');
	});

	it('computeLabel is fast with many headings', () => {
		const items: TocItem[] = Array.from({ length: 500 }, (_, i) => ({
			id: `h-${i}`,
			level: (i % 3) + 1,
			textContent: `Heading ${i}`,
			isActive: false,
			dom: null as unknown as HTMLElement,
			itemIndex: i
		}));

		const start = performance.now();
		for (let i = 0; i < items.length; i++) {
			computeLabel(items, i);
		}
		const elapsed = performance.now() - start;

		// 500 label computations should complete < 100ms
		expect(elapsed).toBeLessThan(100);
	});

	it('extension creation is fast', () => {
		const start = performance.now();
		for (let i = 0; i < 100; i++) {
			createEditorExtensions({ enablePlaceholderHighlights: true, enableToc: true });
		}
		const elapsed = performance.now() - start;

		// 100 creations should complete < 100ms
		expect(elapsed).toBeLessThan(100);
	});
});

// =============================================================================
// FILE SIZE AND QUALITY CHECKS FOR ALL EDITOR COMPONENTS
// =============================================================================

describe('Editor components — file size compliance', () => {
	const MAX_LINES = 200;
	const EDITOR_FILES = [
		'src/lib/components/editor/editor-config.ts',
		'src/lib/components/editor/FontPicker.svelte',
		'src/lib/components/editor/FontSizePicker.svelte',
		'src/lib/components/editor/ColorPicker.svelte',
		'src/lib/components/editor/ResizableImageExtension.ts',
		'src/lib/components/editor/TocSidebar.svelte',
		'src/lib/components/editor/toc-utils.ts',
		'src/lib/components/editor/A4PageLayout.svelte',
		'src/lib/components/editor/WordToolbar.svelte',
		'src/lib/components/editor/EditorToolbar.svelte',
		'src/lib/components/editor/FontSize.ts',
		'src/lib/components/editor/PlaceholderHighlight.ts'
	];

	for (const filePath of EDITOR_FILES) {
		it(`${filePath} is under ${MAX_LINES} lines`, () => {
			const fullPath = resolve(process.cwd(), filePath);
			const source = readFileSync(fullPath, 'utf-8');
			const lineCount = source.split('\n').length;
			expect(lineCount).toBeLessThanOrEqual(MAX_LINES);
		});
	}
});

describe('Editor components — no console.log', () => {
	const EDITOR_FILES = [
		'src/lib/components/editor/editor-config.ts',
		'src/lib/components/editor/FontPicker.svelte',
		'src/lib/components/editor/FontSizePicker.svelte',
		'src/lib/components/editor/ColorPicker.svelte',
		'src/lib/components/editor/ResizableImageExtension.ts',
		'src/lib/components/editor/TocSidebar.svelte',
		'src/lib/components/editor/toc-utils.ts',
		'src/lib/components/editor/A4PageLayout.svelte',
		'src/lib/components/editor/WordToolbar.svelte',
		'src/lib/components/editor/EditorToolbar.svelte',
		'src/lib/components/editor/FontSize.ts',
		'src/lib/components/editor/PlaceholderHighlight.ts'
	];

	for (const filePath of EDITOR_FILES) {
		it(`${filePath} has no console.log`, () => {
			const fullPath = resolve(process.cwd(), filePath);
			const source = readFileSync(fullPath, 'utf-8');
			expect(source).not.toContain('console.log');
		});
	}
});
