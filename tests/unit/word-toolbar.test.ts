import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COMPONENT_PATH = 'src/lib/components/editor/WordToolbar.svelte';
const EDITOR_TOOLBAR_PATH = 'src/lib/components/editor/EditorToolbar.svelte';

function readComponent(): string {
	return readFileSync(resolve(process.cwd(), COMPONENT_PATH), 'utf-8');
}

function readEditorToolbar(): string {
	return readFileSync(resolve(process.cwd(), EDITOR_TOOLBAR_PATH), 'utf-8');
}

// =============================================================================
// WORDTOOLBAR STRUCTURE TESTS
// =============================================================================

describe('WordToolbar — structure', () => {
	it('imports EditorToolbar', () => {
		const source = readComponent();
		expect(source).toContain("import EditorToolbar from './EditorToolbar.svelte'");
	});

	it('imports PlaceholderInsertMenu', () => {
		const source = readComponent();
		expect(source).toContain("import PlaceholderInsertMenu from './PlaceholderInsertMenu.svelte'");
	});

	it('wraps EditorToolbar component', () => {
		const source = readComponent();
		expect(source).toContain('<EditorToolbar');
	});

	it('passes editor as focusedEditor prop', () => {
		const source = readComponent();
		expect(source).toContain('focusedEditor={editor}');
	});

	it('passes branding prop to EditorToolbar', () => {
		const source = readComponent();
		expect(source).toContain('{branding}');
	});
});

// =============================================================================
// WORDTOOLBAR BUTTON TESTS
// =============================================================================

describe('WordToolbar — TOC toggle button', () => {
	it('has TOC toggle button', () => {
		const source = readComponent();
		expect(source).toContain("dispatch('toggleToc')");
	});

	it('TOC button has aria-label', () => {
		const source = readComponent();
		expect(source).toContain('aria-label="Inhoudsopgave tonen/verbergen"');
	});

	it('TOC button shows active state', () => {
		const source = readComponent();
		expect(source).toContain('class:active={showToc}');
	});

	it('TOC button has aria-pressed', () => {
		const source = readComponent();
		expect(source).toContain('aria-pressed={showToc}');
	});

	it('shows "Inhoud" label on button', () => {
		const source = readComponent();
		expect(source).toContain('>Inhoud</span>');
	});
});

describe('WordToolbar — preview toggle button', () => {
	it('has preview toggle button', () => {
		const source = readComponent();
		expect(source).toContain("dispatch('togglePreview')");
	});

	it('shows "Bewerken" when in preview mode', () => {
		const source = readComponent();
		expect(source).toContain("isPreview ? 'Bewerken' : 'Voorbeeld'");
	});

	it('has dynamic aria-label based on preview state', () => {
		const source = readComponent();
		expect(source).toContain("isPreview ? 'Terug naar bewerken' : 'Voorbeeld bekijken'");
	});

	it('has aria-pressed for preview state', () => {
		const source = readComponent();
		expect(source).toContain('aria-pressed={isPreview}');
	});
});

describe('WordToolbar — export button', () => {
	it('has export DOCX button', () => {
		const source = readComponent();
		expect(source).toContain("dispatch('exportDocx')");
	});

	it('export button has aria-label', () => {
		const source = readComponent();
		expect(source).toContain('aria-label="Exporteer als Word-document"');
	});

	it('shows .docx label', () => {
		const source = readComponent();
		expect(source).toContain('>.docx</span>');
	});
});

describe('WordToolbar — placeholder menu', () => {
	it('shows PlaceholderInsertMenu only when not in preview', () => {
		const source = readComponent();
		expect(source).toContain('{#if !isPreview}');
		expect(source).toContain('<PlaceholderInsertMenu');
	});

	it('passes editor and placeholders to menu', () => {
		const source = readComponent();
		expect(source).toContain('{editor}');
		expect(source).toContain('{placeholders}');
	});
});

// =============================================================================
// WORDTOOLBAR EVENT DISPATCHING TESTS
// =============================================================================

describe('WordToolbar — event dispatching', () => {
	it('dispatches toggleToc event', () => {
		const source = readComponent();
		expect(source).toContain('toggleToc: void');
	});

	it('dispatches togglePreview event', () => {
		const source = readComponent();
		expect(source).toContain('togglePreview: void');
	});

	it('dispatches exportDocx event', () => {
		const source = readComponent();
		expect(source).toContain('exportDocx: void');
	});

	it('dispatches toggleSearch event', () => {
		const source = readComponent();
		expect(source).toContain('toggleSearch: void');
	});

	it('forwards toggleSearch to EditorToolbar', () => {
		const source = readComponent();
		expect(source).toContain("on:toggleSearch={() => dispatch('toggleSearch')}");
	});
});

// =============================================================================
// WORDTOOLBAR BRANDING INTEGRATION TESTS
// =============================================================================

describe('WordToolbar — branding integration', () => {
	it('accepts branding prop', () => {
		const source = readComponent();
		expect(source).toContain('export let branding: BrandingConfig');
	});

	it('applies branding primary_color to secondary toolbar', () => {
		const source = readComponent();
		expect(source).toContain('branding?.primary_color');
		expect(source).toContain("${branding.primary_color}08");
	});
});

// =============================================================================
// EDITOR TOOLBAR — FORMATTING BUTTONS TESTS
// =============================================================================

describe('EditorToolbar — formatting buttons', () => {
	it('has bold button with Ctrl+B title', () => {
		const source = readEditorToolbar();
		expect(source).toContain('title="Vet (Ctrl+B)"');
	});

	it('has italic button with Ctrl+I title', () => {
		const source = readEditorToolbar();
		expect(source).toContain('title="Cursief (Ctrl+I)"');
	});

	it('has underline button with Ctrl+U title', () => {
		const source = readEditorToolbar();
		expect(source).toContain('title="Onderstrepen (Ctrl+U)"');
	});

	it('has strikethrough button', () => {
		const source = readEditorToolbar();
		expect(source).toContain('title="Doorhalen"');
	});

	it('has all alignment buttons', () => {
		const source = readEditorToolbar();
		expect(source).toContain('title="Links uitlijnen"');
		expect(source).toContain('title="Centreren"');
		expect(source).toContain('title="Rechts uitlijnen"');
		expect(source).toContain('title="Uitvullen"');
	});

	it('has list buttons', () => {
		const source = readEditorToolbar();
		expect(source).toContain('title="Opsommingslijst"');
		expect(source).toContain('title="Genummerde lijst"');
	});

	it('has blockquote button', () => {
		const source = readEditorToolbar();
		expect(source).toContain('title="Citaat"');
	});

	it('has undo/redo buttons', () => {
		const source = readEditorToolbar();
		expect(source).toContain('title="Ongedaan maken"');
		expect(source).toContain('title="Opnieuw uitvoeren"');
	});

	it('has table insert button', () => {
		const source = readEditorToolbar();
		expect(source).toContain("'Tabel invoegen'");
	});
});

describe('EditorToolbar — active states', () => {
	it('tracks bold active state', () => {
		const source = readEditorToolbar();
		expect(source).toContain("isBold = editor.isActive('bold')");
	});

	it('tracks italic active state', () => {
		const source = readEditorToolbar();
		expect(source).toContain("isItalic = editor.isActive('italic')");
	});

	it('tracks underline active state', () => {
		const source = readEditorToolbar();
		expect(source).toContain("isUnderline = editor.isActive('underline')");
	});

	it('tracks alignment active state', () => {
		const source = readEditorToolbar();
		expect(source).toContain("editor.isActive({ textAlign: 'center' })");
		expect(source).toContain("editor.isActive({ textAlign: 'right' })");
		expect(source).toContain("editor.isActive({ textAlign: 'justify' })");
	});

	it('tracks heading level active state', () => {
		const source = readEditorToolbar();
		expect(source).toContain("editor.isActive('heading', { level: 1 })");
		expect(source).toContain("editor.isActive('heading', { level: 2 })");
		expect(source).toContain("editor.isActive('heading', { level: 3 })");
	});

	it('uses aria-pressed on toggle buttons', () => {
		const source = readEditorToolbar();
		expect(source).toContain('aria-pressed={isBold}');
		expect(source).toContain('aria-pressed={isItalic}');
		expect(source).toContain('aria-pressed={isUnderline}');
	});
});

describe('EditorToolbar — zoom controls', () => {
	it('has zoom levels', () => {
		const source = readEditorToolbar();
		expect(source).toContain('ZOOM_LEVELS');
	});

	it('has zoom in button', () => {
		const source = readEditorToolbar();
		expect(source).toContain('title="Inzoomen"');
	});

	it('has zoom out button', () => {
		const source = readEditorToolbar();
		expect(source).toContain('title="Uitzoomen"');
	});

	it('displays current zoom percentage', () => {
		const source = readEditorToolbar();
		expect(source).toContain('{zoomLevel}%');
	});
});

// =============================================================================
// QUALITY CHECKS
// =============================================================================

describe('WordToolbar — quality checks', () => {
	it('WordToolbar has no console.log', () => {
		const source = readComponent();
		expect(source).not.toContain('console.log');
	});

	it('WordToolbar is under 200 lines', () => {
		const source = readComponent();
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});

	it('EditorToolbar has no console.log', () => {
		const source = readEditorToolbar();
		expect(source).not.toContain('console.log');
	});

	it('EditorToolbar is under 200 lines', () => {
		const source = readEditorToolbar();
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});
