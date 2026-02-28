import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = 'src/lib/components/editor/FontSizePicker.svelte';

function readComponent(): string {
	return readFileSync(resolve(process.cwd(), COMPONENT_PATH), 'utf-8');
}

// =============================================================================
// STANDARD SIZES TESTS
// =============================================================================

describe('FontSizePicker — standard sizes', () => {
	it('defines all standard font sizes', () => {
		const source = readComponent();
		const expected = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
		expect(source).toContain(`const SIZES = [${expected.join(', ')}]`);
	});

	it('renders all sizes via #each block', () => {
		const source = readComponent();
		expect(source).toContain('{#each SIZES as size}');
	});

	it('shows size values in buttons', () => {
		const source = readComponent();
		expect(source).toContain('>{size}</button>');
	});

	it('marks active size with aria-selected', () => {
		const source = readComponent();
		expect(source).toContain('aria-selected={activeSize === String(size)}');
	});
});

// =============================================================================
// CUSTOM SIZE INPUT TESTS
// =============================================================================

describe('FontSizePicker — custom size input', () => {
	it('has a text input for custom sizes', () => {
		const source = readComponent();
		expect(source).toContain('type="text"');
		expect(source).toContain('bind:value={inputValue}');
	});

	it('applies custom size on Enter key', () => {
		const source = readComponent();
		expect(source).toContain("e.key === 'Enter'");
		expect(source).toContain('applySize(inputValue)');
	});

	it('closes dropdown on Escape key', () => {
		const source = readComponent();
		expect(source).toContain("e.key === 'Escape'");
	});

	it('validates size range (1-200)', () => {
		const source = readComponent();
		expect(source).toContain('num < 1 || num > 200');
	});

	it('rejects NaN input', () => {
		const source = readComponent();
		expect(source).toContain('isNaN(num)');
	});

	it('has custom size input with accessible label', () => {
		const source = readComponent();
		expect(source).toContain('aria-label="Aangepaste lettergrootte"');
	});
});

// =============================================================================
// SET FONT SIZE TESTS
// =============================================================================

describe('FontSizePicker — setFontSize calls', () => {
	it('calls setFontSize with px suffix', () => {
		const source = readComponent();
		expect(source).toContain("setFontSize(num + 'px')");
	});

	it('uses editor chain focus pattern', () => {
		const source = readComponent();
		expect(source).toContain('editor.chain().focus().setFontSize');
	});

	it('closes dropdown after applying size', () => {
		const source = readComponent();
		expect(source).toContain('open = false');
	});
});

// =============================================================================
// ACTIVE SIZE EXTRACTION TESTS
// =============================================================================

describe('FontSizePicker — active size extraction', () => {
	it('has extractSize function', () => {
		const source = readComponent();
		expect(source).toContain('function extractSize(ed: Editor | null): string');
	});

	it('defaults to 11 when editor is null', () => {
		const source = readComponent();
		expect(source).toContain("if (!ed) return '11'");
	});

	it('strips px suffix from active size', () => {
		const source = readComponent();
		expect(source).toContain("replace('px', '')");
	});

	it('strips pt suffix from active size', () => {
		const source = readComponent();
		expect(source).toContain("replace('pt', '')");
	});

	it('reads fontSize from textStyle attributes', () => {
		const source = readComponent();
		expect(source).toContain("ed.getAttributes('textStyle').fontSize");
	});

	it('syncs inputValue when dropdown closes', () => {
		const source = readComponent();
		expect(source).toContain('if (!open) inputValue = activeSize');
	});
});

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================

describe('FontSizePicker — accessibility', () => {
	it('has aria-label on main button', () => {
		const source = readComponent();
		expect(source).toContain('aria-label="Lettergrootte"');
	});

	it('has aria-haspopup listbox', () => {
		const source = readComponent();
		expect(source).toContain('aria-haspopup="listbox"');
	});

	it('uses role="listbox" on dropdown', () => {
		const source = readComponent();
		expect(source).toContain('role="listbox"');
	});

	it('uses role="option" on size items', () => {
		const source = readComponent();
		expect(source).toContain('role="option"');
	});
});

// =============================================================================
// QUALITY CHECKS
// =============================================================================

describe('FontSizePicker — quality checks', () => {
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
