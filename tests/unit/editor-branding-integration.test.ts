import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const EDITOR_TOOLBAR_PATH = 'src/lib/components/editor/EditorToolbar.svelte';
const WORD_TOOLBAR_PATH = 'src/lib/components/editor/WordToolbar.svelte';
const FONT_PICKER_PATH = 'src/lib/components/editor/FontPicker.svelte';
const COLOR_PICKER_PATH = 'src/lib/components/editor/ColorPicker.svelte';

function readFile(path: string): string {
	return readFileSync(resolve(process.cwd(), path), 'utf-8');
}

// =============================================================================
// BRANDING CONFIG APPLICATION TESTS
// =============================================================================

describe('Branding integration — EditorToolbar', () => {
	it('accepts branding prop', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain('export let branding: BrandingConfig | undefined');
	});

	it('applies branding primary_color as toolbar background', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain('branding?.primary_color');
	});

	it('shows logo when branding has logo_url', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain('{#if branding?.logo_url}');
		expect(source).toContain('src={branding.logo_url}');
	});

	it('logo has alt text', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain('alt="Organisatie logo"');
	});

	it('passes allowed_fonts from branding to FontPicker', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain("allowedFonts={branding?.allowed_fonts ?? []}");
	});

	it('passes allowed_colors from branding to ColorPicker', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain("allowedColors={branding?.allowed_colors ?? []}");
	});
});

describe('Branding integration — WordToolbar', () => {
	it('accepts branding prop', () => {
		const source = readFile(WORD_TOOLBAR_PATH);
		expect(source).toContain('export let branding: BrandingConfig');
	});

	it('applies branding color to secondary row', () => {
		const source = readFile(WORD_TOOLBAR_PATH);
		expect(source).toContain("${branding.primary_color}08");
	});

	it('passes branding to EditorToolbar', () => {
		const source = readFile(WORD_TOOLBAR_PATH);
		expect(source).toContain('{branding}');
	});
});

// =============================================================================
// ALLOWED FONTS CONSTRAINT TESTS
// =============================================================================

describe('Branding integration — font-picker constraints', () => {
	it('FontPicker accepts allowedFonts prop', () => {
		const source = readFile(FONT_PICKER_PATH);
		expect(source).toContain('export let allowedFonts: string[] = []');
	});

	it('FontPicker filters groups when allowedFonts is provided', () => {
		const source = readFile(FONT_PICKER_PATH);
		expect(source).toContain('allowedFonts.length > 0');
		expect(source).toContain('g.fonts.filter((f) => allowedFonts.includes(f))');
	});

	it('FontPicker removes groups with no allowed fonts', () => {
		const source = readFile(FONT_PICKER_PATH);
		expect(source).toContain('.filter((g) => g.fonts.length > 0)');
	});

	it('FontPicker shows default groups when allowedFonts is empty', () => {
		const source = readFile(FONT_PICKER_PATH);
		expect(source).toContain(': DEFAULT_FONT_GROUPS');
	});

	it('EditorToolbar wires allowedFonts from branding prop', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain('allowedFonts={branding?.allowed_fonts ?? []}');
	});
});

// =============================================================================
// ALLOWED COLORS CONSTRAINT TESTS
// =============================================================================

describe('Branding integration — color-picker constraints', () => {
	it('ColorPicker accepts allowedColors prop', () => {
		const source = readFile(COLOR_PICKER_PATH);
		expect(source).toContain('export let allowedColors: string[] = []');
	});

	it('ColorPicker replaces defaults with allowed colors when provided', () => {
		const source = readFile(COLOR_PICKER_PATH);
		expect(source).toContain('allowedColors.length > 0');
		expect(source).toContain('allowedColors.map((c) => ({ value: c, label: c }))');
	});

	it('ColorPicker shows default palette when allowedColors is empty', () => {
		const source = readFile(COLOR_PICKER_PATH);
		expect(source).toContain(': DEFAULT_COLORS');
	});

	it('EditorToolbar wires allowedColors from branding prop', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain('allowedColors={branding?.allowed_colors ?? []}');
	});
});

// =============================================================================
// BRANDING DATA FLOW END-TO-END
// =============================================================================

describe('Branding integration — data flow', () => {
	it('WordToolbar passes branding through to EditorToolbar', () => {
		const wordToolbar = readFile(WORD_TOOLBAR_PATH);
		const editorToolbar = readFile(EDITOR_TOOLBAR_PATH);

		// WordToolbar receives branding prop
		expect(wordToolbar).toContain('export let branding: BrandingConfig');
		// WordToolbar passes it down
		expect(wordToolbar).toContain('{branding}');
		// EditorToolbar receives it
		expect(editorToolbar).toContain('export let branding: BrandingConfig | undefined');
	});

	it('EditorToolbar passes constraints to child components', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		// FontPicker gets allowed_fonts
		expect(source).toContain('<FontPicker');
		expect(source).toContain('allowedFonts={branding?.allowed_fonts ?? []}');
		// ColorPicker gets allowed_colors
		expect(source).toContain('<ColorPicker');
		expect(source).toContain('allowedColors={branding?.allowed_colors ?? []}');
	});

	it('FontPicker is imported in EditorToolbar', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain("import FontPicker from './FontPicker.svelte'");
	});

	it('FontSizePicker is imported in EditorToolbar', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain("import FontSizePicker from './FontSizePicker.svelte'");
	});

	it('ColorPicker is imported in EditorToolbar', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain("import ColorPicker from './ColorPicker.svelte'");
	});

	it('ImageUpload is imported in EditorToolbar', () => {
		const source = readFile(EDITOR_TOOLBAR_PATH);
		expect(source).toContain("import ImageUpload from './ImageUpload.svelte'");
	});
});
