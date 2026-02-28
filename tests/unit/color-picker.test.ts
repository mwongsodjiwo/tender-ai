import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = 'src/lib/components/editor/ColorPicker.svelte';

function readComponent(): string {
	return readFileSync(resolve(process.cwd(), COMPONENT_PATH), 'utf-8');
}

// =============================================================================
// COLOR PALETTE TESTS
// =============================================================================

describe('ColorPicker — color palette', () => {
	it('defines 10 default colors', () => {
		const source = readComponent();
		const colors = [
			'Zwart', 'Donkergrijs', 'Rood', 'Oranje', 'Geel',
			'Groen', 'Blauw', 'Paars', 'Roze', 'Wit'
		];
		for (const color of colors) {
			expect(source).toContain(`label: '${color}'`);
		}
	});

	it('defines correct hex values for all colors', () => {
		const source = readComponent();
		const hexValues = [
			'#000000', '#4b5563', '#dc2626', '#ea580c', '#eab308',
			'#16a34a', '#2563eb', '#7c3aed', '#ec4899', '#ffffff'
		];
		for (const hex of hexValues) {
			expect(source).toContain(`value: '${hex}'`);
		}
	});

	it('renders colors in a 5-column grid', () => {
		const source = readComponent();
		expect(source).toContain('grid-cols-5');
	});

	it('renders each color as a button with swatch class', () => {
		const source = readComponent();
		expect(source).toContain('{#each COLORS as color}');
		expect(source).toContain('class="color-swatch"');
	});
});

// =============================================================================
// TEXT COLOR SELECTION TESTS
// =============================================================================

describe('ColorPicker — text color selection', () => {
	it('has setTextColor function', () => {
		const source = readComponent();
		expect(source).toContain('function setTextColor(color: string | null)');
	});

	it('calls editor setColor for text color', () => {
		const source = readComponent();
		expect(source).toContain('editor.chain().focus().setColor(color).run()');
	});

	it('calls unsetColor for removing text color', () => {
		const source = readComponent();
		expect(source).toContain('editor.chain().focus().unsetColor().run()');
	});

	it('has "Geen kleur" reset button', () => {
		const source = readComponent();
		expect(source).toContain('>Geen kleur</button>');
	});

	it('shows active text color indicator', () => {
		const source = readComponent();
		expect(source).toContain('style:background-color={activeTextColor}');
	});

	it('tracks active text color from editor attributes', () => {
		const source = readComponent();
		expect(source).toContain("editor?.getAttributes('textStyle').color");
	});
});

// =============================================================================
// HIGHLIGHT COLOR SELECTION TESTS
// =============================================================================

describe('ColorPicker — highlight color selection', () => {
	it('has setHighlight function', () => {
		const source = readComponent();
		expect(source).toContain('function setHighlight(color: string | null)');
	});

	it('calls toggleHighlight for highlight color', () => {
		const source = readComponent();
		expect(source).toContain('editor.chain().focus().toggleHighlight({ color }).run()');
	});

	it('calls unsetHighlight for removing highlight', () => {
		const source = readComponent();
		expect(source).toContain('editor.chain().focus().unsetHighlight().run()');
	});

	it('tracks active highlight color from editor attributes', () => {
		const source = readComponent();
		expect(source).toContain("editor?.getAttributes('highlight').color");
	});

	it('shows highlight color indicator when active', () => {
		const source = readComponent();
		expect(source).toContain('{#if activeHighlight}');
	});
});

// =============================================================================
// PANEL TOGGLE TESTS
// =============================================================================

describe('ColorPicker — panel toggling', () => {
	it('has two panels: text and highlight', () => {
		const source = readComponent();
		expect(source).toContain("activePanel: 'text' | 'highlight' | null");
	});

	it('has togglePanel function', () => {
		const source = readComponent();
		expect(source).toContain("function togglePanel(panel: 'text' | 'highlight')");
	});

	it('shows panel label in popover', () => {
		const source = readComponent();
		expect(source).toContain("'Tekstkleur'");
		expect(source).toContain("'Markeerkleur'");
	});

	it('closes panel after color selection', () => {
		const source = readComponent();
		expect(source).toContain('activePanel = null');
	});
});

// =============================================================================
// ALLOWED COLORS FILTERING TESTS
// =============================================================================

describe('ColorPicker — allowedColors filtering', () => {
	it('has allowedColors prop', () => {
		const source = readComponent();
		expect(source).toContain('export let allowedColors: string[] = []');
	});

	it('filters colors when allowedColors is set', () => {
		const source = readComponent();
		expect(source).toContain('allowedColors.length > 0');
	});

	it('maps allowed colors to color objects', () => {
		const source = readComponent();
		expect(source).toContain('allowedColors.map((c) => ({ value: c, label: c }))');
	});
});

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================

describe('ColorPicker — accessibility', () => {
	it('has aria-label on text color button', () => {
		const source = readComponent();
		expect(source).toContain('aria-label="Tekstkleur"');
	});

	it('has aria-label on highlight button', () => {
		const source = readComponent();
		expect(source).toContain('aria-label="Markeerkleur"');
	});

	it('has aria-haspopup on buttons', () => {
		const source = readComponent();
		expect(source).toContain('aria-haspopup="true"');
	});

	it('has aria-label on color swatches', () => {
		const source = readComponent();
		expect(source).toContain('aria-label={color.label}');
	});

	it('uses role="listbox" on popover', () => {
		const source = readComponent();
		expect(source).toContain('role="listbox"');
	});

	it('handles Escape key to close', () => {
		const source = readComponent();
		expect(source).toContain("e.key === 'Escape'");
	});
});

// =============================================================================
// QUALITY CHECKS
// =============================================================================

describe('ColorPicker — quality checks', () => {
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
