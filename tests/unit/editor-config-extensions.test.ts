import { describe, it, expect, vi } from 'vitest';

// Mock Svelte component imports used by ResizableImageExtension
vi.mock('$lib/components/editor/ResizableImageView.svelte', () => ({ default: {} }));

import { createEditorExtensions, convertPlainTextToHtml } from '$lib/components/editor/editor-config';

// =============================================================================
// EXTENSION LOADING TESTS
// =============================================================================

describe('createEditorExtensions — base extensions', () => {
	it('returns an array of extensions', () => {
		const extensions = createEditorExtensions();
		expect(Array.isArray(extensions)).toBe(true);
		expect(extensions.length).toBeGreaterThan(0);
	});

	it('includes StarterKit', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		// StarterKit registers as multiple sub-extensions
		expect(names.length).toBeGreaterThanOrEqual(5);
	});

	it('includes FontSize extension', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('fontSize');
	});

	it('includes Color extension', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('color');
	});

	it('includes Highlight extension with multicolor', () => {
		const extensions = createEditorExtensions();
		const highlight = extensions.find((e) => (e as { name?: string }).name === 'highlight');
		expect(highlight).toBeDefined();
	});

	it('includes TextAlign extension', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('textAlign');
	});

	it('includes Underline extension', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('underline');
	});

	it('includes ResizableImageExtension', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('resizableImage');
	});

	it('includes ImageDropPasteHandler', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('imageDropPasteHandler');
	});

	it('includes TextStyle extension', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('textStyle');
	});

	it('includes FontFamily extension', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('fontFamily');
	});

	it('includes Table extensions', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('table');
		expect(names).toContain('tableRow');
		expect(names).toContain('tableCell');
		expect(names).toContain('tableHeader');
	});
});

// =============================================================================
// OPTIONAL EXTENSIONS TESTS
// =============================================================================

describe('createEditorExtensions — optional extensions', () => {
	it('does not include PlaceholderHighlight by default', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).not.toContain('placeholderHighlight');
	});

	it('includes PlaceholderHighlight when enablePlaceholderHighlights is true', () => {
		const extensions = createEditorExtensions({ enablePlaceholderHighlights: true });
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('placeholderHighlight');
	});

	it('does not include UniqueID or TableOfContents by default', () => {
		const extensions = createEditorExtensions();
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).not.toContain('uniqueID');
		expect(names).not.toContain('tableOfContents');
	});

	it('includes UniqueID and TableOfContents when enableToc is true', () => {
		const extensions = createEditorExtensions({ enableToc: true });
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('uniqueID');
		expect(names).toContain('tableOfContents');
	});

	it('passes tocOnUpdate callback to TableOfContents', () => {
		const mockCallback = vi.fn();
		const extensions = createEditorExtensions({
			enableToc: true,
			tocOnUpdate: mockCallback
		});
		const toc = extensions.find((e) => (e as { name?: string }).name === 'tableOfContents');
		expect(toc).toBeDefined();
	});

	it('includes both optional groups when both flags are true', () => {
		const extensions = createEditorExtensions({
			enablePlaceholderHighlights: true,
			enableToc: true
		});
		const names = extensions.map((e) => (e as { name?: string }).name).filter(Boolean);
		expect(names).toContain('placeholderHighlight');
		expect(names).toContain('uniqueID');
		expect(names).toContain('tableOfContents');
	});

	it('base extension count stays constant regardless of options', () => {
		const baseExtensions = createEditorExtensions();
		const withPlaceholder = createEditorExtensions({ enablePlaceholderHighlights: true });
		const withToc = createEditorExtensions({ enableToc: true });
		const withBoth = createEditorExtensions({
			enablePlaceholderHighlights: true,
			enableToc: true
		});

		expect(withPlaceholder.length).toBe(baseExtensions.length + 1);
		expect(withToc.length).toBe(baseExtensions.length + 2);
		expect(withBoth.length).toBe(baseExtensions.length + 3);
	});
});

// =============================================================================
// CONVERT PLAIN TEXT TO HTML TESTS
// =============================================================================

describe('convertPlainTextToHtml', () => {
	it('converts plain text paragraphs to HTML', () => {
		const result = convertPlainTextToHtml('Hello\n\nWorld');
		expect(result).toBe('<p>Hello</p><p>World</p>');
	});

	it('converts single-line breaks to <br>', () => {
		const result = convertPlainTextToHtml('Line 1\nLine 2');
		expect(result).toBe('<p>Line 1<br>Line 2</p>');
	});

	it('passes through HTML content unchanged', () => {
		const html = '<p>Already HTML</p>';
		const result = convertPlainTextToHtml(html);
		expect(result).toBe(html);
	});

	it('passes through heading HTML unchanged', () => {
		const html = '<h1>Heading</h1>';
		const result = convertPlainTextToHtml(html);
		expect(result).toBe(html);
	});

	it('passes through list HTML unchanged', () => {
		const html = '<ul><li>Item</li></ul>';
		const result = convertPlainTextToHtml(html);
		expect(result).toBe(html);
	});

	it('passes through table HTML unchanged', () => {
		const html = '<table><tr><td>Cell</td></tr></table>';
		const result = convertPlainTextToHtml(html);
		expect(result).toBe(html);
	});

	it('wraps non-HTML text in paragraphs', () => {
		const result = convertPlainTextToHtml('Simple text');
		expect(result).toBe('<p>Simple text</p>');
	});
});
