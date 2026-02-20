import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// =============================================================================
// DOCUMENT EDIT STATUS TESTS
// =============================================================================

describe('DocumentEditStatus type', () => {
	it('exports DOCUMENT_EDIT_STATUSES enum', async () => {
		const mod = await import('$types/enums');
		expect(mod.DOCUMENT_EDIT_STATUSES).toBeDefined();
		expect(mod.DOCUMENT_EDIT_STATUSES).toContain('concept');
		expect(mod.DOCUMENT_EDIT_STATUSES).toContain('in_review');
		expect(mod.DOCUMENT_EDIT_STATUSES).toContain('approved');
	});

	it('has exactly 3 statuses', async () => {
		const mod = await import('$types/enums');
		expect(mod.DOCUMENT_EDIT_STATUSES).toHaveLength(3);
	});

	it('exports DOCUMENT_EDIT_STATUS_LABELS with Dutch labels', async () => {
		const mod = await import('$types/enums');
		expect(mod.DOCUMENT_EDIT_STATUS_LABELS).toBeDefined();
		expect(mod.DOCUMENT_EDIT_STATUS_LABELS.concept).toBe('Concept');
		expect(mod.DOCUMENT_EDIT_STATUS_LABELS.in_review).toBe('In review');
		expect(mod.DOCUMENT_EDIT_STATUS_LABELS.approved).toBe('Goedgekeurd');
	});
});

// =============================================================================
// FONT FAMILY EXTENSION TESTS
// =============================================================================

describe('TiptapEditor font extensions', () => {
	it('imports TextStyle extension', async () => {
		const mod = await import('@tiptap/extension-text-style');
		expect(mod.TextStyle ?? mod.default).toBeDefined();
	});

	it('imports FontFamily extension', async () => {
		const mod = await import('@tiptap/extension-font-family');
		expect(mod.FontFamily ?? mod.default).toBeDefined();
	});

	it('TiptapEditor.svelte includes TextStyle import', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/components/TiptapEditor.svelte'),
			'utf-8'
		);
		expect(source).toContain("import { TextStyle } from '@tiptap/extension-text-style'");
		expect(source).toContain("import { FontFamily } from '@tiptap/extension-font-family'");
	});

	it('TiptapEditor.svelte registers TextStyle and FontFamily extensions', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/components/TiptapEditor.svelte'),
			'utf-8'
		);
		expect(source).toContain('TextStyle,');
		expect(source).toContain("FontFamily.configure({ types: ['textStyle'] })");
	});

	it('TiptapEditor.svelte has setFontFamily function', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/components/TiptapEditor.svelte'),
			'utf-8'
		);
		expect(source).toContain('function setFontFamily(font: string)');
	});

	it('TiptapEditor.svelte tracks activeFontFamily', () => {
		const source = readFileSync(
			resolve(process.cwd(), 'src/lib/components/TiptapEditor.svelte'),
			'utf-8'
		);
		expect(source).toContain('let activeFontFamily');
	});
});

// =============================================================================
// EDITOR TOOLBAR FONT CONTROLS TESTS
// =============================================================================

describe('EditorToolbar font controls', () => {
	const toolbarPath = 'src/lib/components/editor/EditorToolbar.svelte';

	it('has FONT_FAMILIES constant', () => {
		const source = readFileSync(resolve(process.cwd(), toolbarPath), 'utf-8');
		expect(source).toContain('FONT_FAMILIES');
	});

	it('includes common font families', () => {
		const source = readFileSync(resolve(process.cwd(), toolbarPath), 'utf-8');
		expect(source).toContain("'Asap'");
		expect(source).toContain("'Arial'");
		expect(source).toContain("'Times New Roman'");
	});

	it('has font-family select element with aria-label', () => {
		const source = readFileSync(resolve(process.cwd(), toolbarPath), 'utf-8');
		expect(source).toContain('aria-label="Lettertype"');
	});

	it('has setFontFamily function', () => {
		const source = readFileSync(resolve(process.cwd(), toolbarPath), 'utf-8');
		expect(source).toContain('function setFontFamily(val: string)');
	});

	it('tracks activeFontFamily state', () => {
		const source = readFileSync(resolve(process.cwd(), toolbarPath), 'utf-8');
		expect(source).toContain('let activeFontFamily');
		expect(source).toContain('activeFontFamily =');
	});

	it('updates activeFontFamily in updateToolbar', () => {
		const source = readFileSync(resolve(process.cwd(), toolbarPath), 'utf-8');
		expect(source).toContain("editor.getAttributes('textStyle').fontFamily");
	});
});

// =============================================================================
// PAGE THUMBNAILS COMPONENT TESTS
// =============================================================================

describe('PageThumbnails component', () => {
	const pageThumbnailsPath = 'src/lib/components/editor/PageThumbnails.svelte';

	it('file exists', () => {
		const source = readFileSync(resolve(process.cwd(), pageThumbnailsPath), 'utf-8');
		expect(source.length).toBeGreaterThan(0);
	});

	it('has sections prop', () => {
		const source = readFileSync(resolve(process.cwd(), pageThumbnailsPath), 'utf-8');
		expect(source).toContain('export let sections');
	});

	it('has currentIndex prop', () => {
		const source = readFileSync(resolve(process.cwd(), pageThumbnailsPath), 'utf-8');
		expect(source).toContain('export let currentIndex');
	});

	it('has onSectionClick prop', () => {
		const source = readFileSync(resolve(process.cwd(), pageThumbnailsPath), 'utf-8');
		expect(source).toContain('export let onSectionClick');
	});

	it('has PageSection interface with required fields', () => {
		const source = readFileSync(resolve(process.cwd(), pageThumbnailsPath), 'utf-8');
		expect(source).toContain('id: string');
		expect(source).toContain('title: string');
		expect(source).toContain("status: 'draft' | 'generated' | 'review' | 'approved'");
		expect(source).toContain('contentPreview: string');
	});

	it('has STATUS_STYLES for all artifact statuses', () => {
		const source = readFileSync(resolve(process.cwd(), pageThumbnailsPath), 'utf-8');
		expect(source).toContain('approved:');
		expect(source).toContain('review:');
		expect(source).toContain('generated:');
		expect(source).toContain('draft:');
	});

	it('has truncatePreview function', () => {
		const source = readFileSync(resolve(process.cwd(), pageThumbnailsPath), 'utf-8');
		expect(source).toContain('function truncatePreview');
	});

	it('has aria navigation label', () => {
		const source = readFileSync(resolve(process.cwd(), pageThumbnailsPath), 'utf-8');
		expect(source).toContain('aria-label="Paginaminiaturen"');
	});

	it('uses Dutch status labels', () => {
		const source = readFileSync(resolve(process.cwd(), pageThumbnailsPath), 'utf-8');
		expect(source).toContain('Goedgekeurd');
		expect(source).toContain('Review');
		expect(source).toContain('Concept');
	});
});

// =============================================================================
// DOCUMENT PAGE USES PAGE THUMBNAILS (NOT StepperSidebar)
// =============================================================================

describe('Document page uses PageThumbnails', () => {
	const docPagePath = 'src/routes/(app)/projects/[id]/documents/[docTypeId]/+page.svelte';

	it('imports PageThumbnails instead of StepperSidebar', () => {
		const source = readFileSync(resolve(process.cwd(), docPagePath), 'utf-8');
		expect(source).toContain('PageThumbnails');
		expect(source).not.toContain('StepperSidebar');
	});

	it('uses pageSections reactive declaration', () => {
		const source = readFileSync(resolve(process.cwd(), docPagePath), 'utf-8');
		expect(source).toContain('$: pageSections');
	});

	it('passes sections prop to PageThumbnails', () => {
		const source = readFileSync(resolve(process.cwd(), docPagePath), 'utf-8');
		expect(source).toContain('sections={pageSections}');
	});
});

describe('Contract page uses PageThumbnails', () => {
	const contractPagePath = 'src/routes/(app)/projects/[id]/contract/+page.svelte';

	it('imports PageThumbnails instead of StepperSidebar', () => {
		const source = readFileSync(resolve(process.cwd(), contractPagePath), 'utf-8');
		expect(source).toContain('PageThumbnails');
		expect(source).not.toContain('StepperSidebar');
	});
});

// =============================================================================
// FILE SIZE COMPLIANCE TESTS
// =============================================================================

describe('File size compliance', () => {
	const MAX_LINES = 200;

	const FILES_TO_CHECK = [
		'src/lib/components/editor/PageThumbnails.svelte',
		'src/lib/components/editor/EditorToolbar.svelte'
	];

	for (const filePath of FILES_TO_CHECK) {
		it(`${filePath} is under ${MAX_LINES} lines`, () => {
			const fullPath = resolve(process.cwd(), filePath);
			const source = readFileSync(fullPath, 'utf-8');
			const lineCount = source.split('\n').length;
			expect(lineCount).toBeLessThanOrEqual(MAX_LINES);
		});
	}
});

// =============================================================================
// NO CONSOLE.LOG IN PRODUCTION CODE
// =============================================================================

describe('No console.log in production code', () => {
	const FILES_TO_CHECK = [
		'src/lib/components/editor/PageThumbnails.svelte',
		'src/lib/components/editor/EditorToolbar.svelte'
	];

	for (const filePath of FILES_TO_CHECK) {
		it(`${filePath} has no console.log`, () => {
			const fullPath = resolve(process.cwd(), filePath);
			const source = readFileSync(fullPath, 'utf-8');
			expect(source).not.toContain('console.log');
		});
	}
});
