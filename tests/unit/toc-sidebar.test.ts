import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { computeLabel, findActiveHeadingId, mapToTocItems } from '$lib/components/editor/toc-utils';
import type { TocItem } from '$lib/components/editor/toc-utils';

const SIDEBAR_PATH = 'src/lib/components/editor/TocSidebar.svelte';
const UTILS_PATH = 'src/lib/components/editor/toc-utils.ts';

function readSidebar(): string {
	return readFileSync(resolve(process.cwd(), SIDEBAR_PATH), 'utf-8');
}

// =============================================================================
// TOC-UTILS: computeLabel TESTS
// =============================================================================

describe('toc-utils — computeLabel', () => {
	function makeTocItem(level: number, index: number): TocItem {
		return {
			id: `heading-${index}`,
			level,
			textContent: `Heading ${index}`,
			isActive: false,
			dom: null as unknown as HTMLElement,
			itemIndex: index
		};
	}

	it('labels single H1 as "1"', () => {
		const items = [makeTocItem(1, 0)];
		expect(computeLabel(items, 0)).toBe('1');
	});

	it('labels second H1 as "2"', () => {
		const items = [makeTocItem(1, 0), makeTocItem(1, 1)];
		expect(computeLabel(items, 1)).toBe('2');
	});

	it('labels H2 under H1 as "1.1"', () => {
		const items = [makeTocItem(1, 0), makeTocItem(2, 1)];
		expect(computeLabel(items, 1)).toBe('1.1');
	});

	it('labels H3 under H2 as "1.1.1"', () => {
		const items = [makeTocItem(1, 0), makeTocItem(2, 1), makeTocItem(3, 2)];
		expect(computeLabel(items, 2)).toBe('1.1.1');
	});

	it('resets sub-counters when new H1 starts', () => {
		const items = [
			makeTocItem(1, 0), makeTocItem(2, 1), makeTocItem(1, 2), makeTocItem(2, 3)
		];
		expect(computeLabel(items, 3)).toBe('2.1');
	});

	it('numbers multiple H2s sequentially', () => {
		const items = [
			makeTocItem(1, 0), makeTocItem(2, 1), makeTocItem(2, 2), makeTocItem(2, 3)
		];
		expect(computeLabel(items, 1)).toBe('1.1');
		expect(computeLabel(items, 2)).toBe('1.2');
		expect(computeLabel(items, 3)).toBe('1.3');
	});

	it('returns empty string for out-of-bounds index', () => {
		const items = [makeTocItem(1, 0)];
		expect(computeLabel(items, 5)).toBe('');
	});

	it('returns empty string for empty items', () => {
		expect(computeLabel([], 0)).toBe('');
	});

	it('handles complex nested hierarchy', () => {
		const items = [
			makeTocItem(1, 0),
			makeTocItem(2, 1),
			makeTocItem(3, 2),
			makeTocItem(2, 3),
			makeTocItem(3, 4),
			makeTocItem(1, 5),
			makeTocItem(2, 6)
		];
		expect(computeLabel(items, 0)).toBe('1');
		expect(computeLabel(items, 1)).toBe('1.1');
		expect(computeLabel(items, 2)).toBe('1.1.1');
		expect(computeLabel(items, 3)).toBe('1.2');
		expect(computeLabel(items, 4)).toBe('1.2.1');
		expect(computeLabel(items, 5)).toBe('2');
		expect(computeLabel(items, 6)).toBe('2.1');
	});
});

// =============================================================================
// TOC-UTILS: findActiveHeadingId TESTS
// =============================================================================

describe('toc-utils — findActiveHeadingId', () => {
	function makeItem(id: string): TocItem {
		return {
			id,
			level: 1,
			textContent: id,
			isActive: false,
			dom: null as unknown as HTMLElement,
			itemIndex: 0
		};
	}

	it('returns first item id when no scroll container', () => {
		const items = [makeItem('h1'), makeItem('h2')];
		const result = findActiveHeadingId(items, null);
		expect(result).toBe('h1');
	});

	it('returns empty string for empty items with no container', () => {
		const result = findActiveHeadingId([], null);
		expect(result).toBe('');
	});

	it('returns empty string for empty items with container', () => {
		// Use a mock element since DOM is not available in Node.js
		const container = { getBoundingClientRect: () => ({ top: 0 }) } as unknown as HTMLElement;
		const result = findActiveHeadingId([], container);
		expect(result).toBe('');
	});
});

// =============================================================================
// TOC-UTILS: mapToTocItems TESTS
// =============================================================================

describe('toc-utils — mapToTocItems', () => {
	it('maps extension data items to TocItem array', () => {
		const mockData = [{
			id: 'test-1',
			level: 1,
			textContent: 'Test Heading',
			isActive: false,
			dom: null as unknown as HTMLElement,
			itemIndex: 0
		}];
		const result = mapToTocItems(mockData);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('test-1');
		expect(result[0].level).toBe(1);
		expect(result[0].textContent).toBe('Test Heading');
	});

	it('returns empty array for empty input', () => {
		const result = mapToTocItems([]);
		expect(result).toHaveLength(0);
	});
});

// =============================================================================
// TOC SIDEBAR COMPONENT TESTS
// =============================================================================

describe('TocSidebar — heading tree display', () => {
	it('renders headings via #each block', () => {
		const source = readSidebar();
		expect(source).toContain('{#each items as item, i (item.id)}');
	});

	it('shows heading textContent', () => {
		const source = readSidebar();
		expect(source).toContain('{item.textContent}');
	});

	it('uses computeLabel for hierarchical numbering', () => {
		const source = readSidebar();
		expect(source).toContain('computeLabel(items, i)');
	});
});

describe('TocSidebar — indentation', () => {
	it('has getIndent function', () => {
		const source = readSidebar();
		expect(source).toContain('function getIndent(level: number): string');
	});

	it('indents H2 by 16px', () => {
		const source = readSidebar();
		expect(source).toContain("if (level === 2) return 'padding-left: 16px;'");
	});

	it('indents H3 by 32px', () => {
		const source = readSidebar();
		expect(source).toContain("if (level === 3) return 'padding-left: 32px;'");
	});
});

describe('TocSidebar — active heading marking', () => {
	it('tracks activeId state', () => {
		const source = readSidebar();
		expect(source).toContain("let activeId = ''");
	});

	it('applies toc-active class for active heading', () => {
		const source = readSidebar();
		expect(source).toContain('class:toc-active={item.id === activeId}');
	});

	it('uses aria-current for active heading', () => {
		const source = readSidebar();
		expect(source).toContain("aria-current={item.id === activeId ? 'location' : undefined}");
	});

	it('updates active heading on scroll', () => {
		const source = readSidebar();
		expect(source).toContain('findActiveHeadingId');
		expect(source).toContain("addEventListener('scroll', updateActiveId)");
	});
});

describe('TocSidebar — empty state', () => {
	it('shows empty message when no headings found', () => {
		const source = readSidebar();
		expect(source).toContain('Geen koppen gevonden');
	});

	it('shows instruction to use Kop 1, 2, or 3', () => {
		const source = readSidebar();
		expect(source).toContain('Gebruik Kop 1, 2 of 3');
	});
});

describe('TocSidebar — accessibility', () => {
	it('has aside with aria-label', () => {
		const source = readSidebar();
		expect(source).toContain('aria-label="Inhoudsopgave"');
	});

	it('has nav with aria-label', () => {
		const source = readSidebar();
		expect(source).toContain('aria-label="Document koppen"');
	});
});

describe('TocSidebar — quality checks', () => {
	it('has no console.log', () => {
		const source = readSidebar();
		expect(source).not.toContain('console.log');
	});

	it('sidebar is under 200 lines', () => {
		const source = readSidebar();
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});

	it('toc-utils is under 200 lines', () => {
		const source = readFileSync(resolve(process.cwd(), UTILS_PATH), 'utf-8');
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});
