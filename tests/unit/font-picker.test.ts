import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = 'src/lib/components/editor/FontPicker.svelte';

function readComponent(): string {
	return readFileSync(resolve(process.cwd(), COMPONENT_PATH), 'utf-8');
}

// =============================================================================
// FONT GROUPS TESTS
// =============================================================================

describe('FontPicker — font groups', () => {
	it('defines three default font groups', () => {
		const source = readComponent();
		expect(source).toContain("label: 'Sans-serif'");
		expect(source).toContain("label: 'Serif'");
		expect(source).toContain("label: 'Monospace'");
	});

	it('includes Sans-serif fonts: Inter, Roboto, Open Sans, Arial, Helvetica', () => {
		const source = readComponent();
		for (const font of ['Inter', 'Roboto', 'Open Sans', 'Arial', 'Helvetica']) {
			expect(source).toContain(`'${font}'`);
		}
	});

	it('includes Serif fonts: Merriweather, Lora, Georgia, Times New Roman', () => {
		const source = readComponent();
		for (const font of ['Merriweather', 'Lora', 'Georgia', 'Times New Roman']) {
			expect(source).toContain(`'${font}'`);
		}
	});

	it('includes Monospace fonts: JetBrains Mono, Fira Code, Courier New', () => {
		const source = readComponent();
		for (const font of ['JetBrains Mono', 'Fira Code', 'Courier New']) {
			expect(source).toContain(`'${font}'`);
		}
	});

	it('renders all font groups via #each block', () => {
		const source = readComponent();
		expect(source).toContain('{#each FONT_GROUPS as group}');
		expect(source).toContain('{#each group.fonts as font}');
	});
});

// =============================================================================
// FONT SELECTION TESTS
// =============================================================================

describe('FontPicker — font selection', () => {
	it('has selectFont function that calls setFontFamily', () => {
		const source = readComponent();
		expect(source).toContain('function selectFont(font: string)');
		expect(source).toContain('setFontFamily(font)');
	});

	it('selectFont with empty string calls unsetFontFamily', () => {
		const source = readComponent();
		expect(source).toContain('unsetFontFamily()');
	});

	it('closes dropdown after font selection', () => {
		const source = readComponent();
		// selectFont sets open = false
		expect(source).toContain('open = false');
	});

	it('has Standaard (default) option', () => {
		const source = readComponent();
		expect(source).toContain('>Standaard</button>');
	});
});

// =============================================================================
// CURRENT FONT DISPLAY TESTS
// =============================================================================

describe('FontPicker — current font display', () => {
	it('tracks activeFont from editor attributes', () => {
		const source = readComponent();
		expect(source).toContain("editor?.getAttributes('textStyle').fontFamily");
	});

	it('displays activeFont or "Standaard" as fallback', () => {
		const source = readComponent();
		expect(source).toContain("displayFont = activeFont || 'Standaard'");
	});

	it('shows displayFont in the button', () => {
		const source = readComponent();
		expect(source).toContain('{displayFont}');
	});

	it('applies font-family style to button for visual preview', () => {
		const source = readComponent();
		expect(source).toContain("style:font-family={activeFont || 'inherit'}");
	});
});

// =============================================================================
// ALLOWED FONTS FILTERING TESTS
// =============================================================================

describe('FontPicker — allowedFonts filtering', () => {
	it('has allowedFonts prop', () => {
		const source = readComponent();
		expect(source).toContain('export let allowedFonts: string[] = []');
	});

	it('filters font groups when allowedFonts is set', () => {
		const source = readComponent();
		expect(source).toContain('allowedFonts.length > 0');
		expect(source).toContain('allowedFonts.includes(f)');
	});

	it('removes empty groups after filtering', () => {
		const source = readComponent();
		expect(source).toContain('.filter((g) => g.fonts.length > 0)');
	});
});

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================

describe('FontPicker — accessibility', () => {
	it('has aria-label on main button', () => {
		const source = readComponent();
		expect(source).toContain('aria-label="Lettertype"');
	});

	it('has aria-haspopup listbox', () => {
		const source = readComponent();
		expect(source).toContain('aria-haspopup="listbox"');
	});

	it('has aria-expanded bound to open state', () => {
		const source = readComponent();
		expect(source).toContain('aria-expanded={open}');
	});

	it('uses role="listbox" on dropdown', () => {
		const source = readComponent();
		expect(source).toContain('role="listbox"');
	});

	it('uses role="option" on font items', () => {
		const source = readComponent();
		expect(source).toContain('role="option"');
	});

	it('handles Escape key to close dropdown', () => {
		const source = readComponent();
		expect(source).toContain("e.key === 'Escape'");
	});

	it('handles click outside to close dropdown', () => {
		const source = readComponent();
		expect(source).toContain('handleClickOutside');
		expect(source).toContain('.font-picker-wrapper');
	});
});

// =============================================================================
// QUALITY CHECKS
// =============================================================================

describe('FontPicker — quality checks', () => {
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
