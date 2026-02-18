// Unit tests for Fase 9 — Supplier component file verification

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const COMPONENT_DIR = 'src/lib/components/suppliers';

// =============================================================================
// SUPPLIER DRAWER
// =============================================================================

describe('SupplierDrawer component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SupplierDrawer.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has 5 tab keys', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('overzicht');
		expect(source).toContain('aanbestedingen');
		expect(source).toContain('correspondentie');
		expect(source).toContain('kwalificatie');
		expect(source).toContain('notities');
	});

	it('uses fly transition', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('transition:fly');
	});

	it('uses focusTrap', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('use:focusTrap');
	});

	it('has 40% width', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('w-[40vw]');
	});

	it('imports all 5 tab components', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SupplierOverviewTab');
		expect(source).toContain('SupplierTendersTab');
		expect(source).toContain('SupplierCorrespondenceTab');
		expect(source).toContain('SupplierQualificationTab');
		expect(source).toContain('SupplierNotesTab');
	});

	it('has aria-modal attribute', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('aria-modal="true"');
	});

	it('handles Escape key to close', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("e.key === 'Escape'");
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// KVK SEARCH DIALOG
// =============================================================================

describe('KvkSearchDialog component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/KvkSearchDialog.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has search fields for naam, kvk, plaats', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('searchNaam');
		expect(source).toContain('searchKvk');
		expect(source).toContain('searchPlaats');
	});

	it('calls KVK search API', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('/api/kvk/search');
	});

	it('renders result list', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('results');
		expect(source).toContain('handelsnaam');
	});

	it('has selection handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('handleSelect');
		expect(source).toContain('onSelect');
	});

	it('has error handling', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('errorMessage');
	});

	it('uses focusTrap for accessibility', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('use:focusTrap');
	});

	it('has no results empty state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Geen resultaten gevonden');
	});

	it('validates at least naam or kvk', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('naam of KVK-nummer');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// SUPPLIER IN PROJECT
// =============================================================================

describe('SupplierInProject component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SupplierInProject.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has status dropdown', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SUPPLIER_PROJECT_STATUSES');
		expect(source).toContain('SUPPLIER_PROJECT_STATUS_LABELS');
	});

	it('has role dropdown', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SUPPLIER_PROJECT_ROLES');
		expect(source).toContain('SUPPLIER_PROJECT_ROLE_LABELS');
	});

	it('has add supplier button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Leverancier koppelen');
	});

	it('handles empty state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Nog geen leveranciers gekoppeld');
	});

	it('has accessibility labels', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('sr-only');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// SUPPLIER TABLE
// =============================================================================

describe('SupplierTable component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SupplierTable.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has table headers', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Bedrijfsnaam');
		expect(source).toContain('KVK');
		expect(source).toContain('Plaats');
		expect(source).toContain('Tags');
		expect(source).toContain('Beoordeling');
	});

	it('has row click handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('onSelect');
	});

	it('has keyboard support', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("e.key === 'Enter'");
	});

	it('has aria-label on rows', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('aria-label');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// TAB SUB-COMPONENTS
// =============================================================================

describe('SupplierOverviewTab component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SupplierOverviewTab.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('shows company details', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Bedrijfsgegevens');
		expect(source).toContain('kvk_nummer');
	});

	it('shows contacts', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Contactpersonen');
	});

	it('shows tags', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Tags');
	});

	it('shows rating', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Beoordeling');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

describe('SupplierTendersTab component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SupplierTendersTab.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('shows tender links', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Gekoppelde aanbestedingen');
	});

	it('uses status labels', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SUPPLIER_PROJECT_STATUS_LABELS');
	});

	it('uses role labels', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SUPPLIER_PROJECT_ROLE_LABELS');
	});
});

describe('SupplierCorrespondenceTab component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SupplierCorrespondenceTab.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('shows correspondence heading', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Correspondentie');
	});

	it('has empty state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Geen correspondentie gevonden');
	});
});

describe('SupplierQualificationTab component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SupplierQualificationTab.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('shows qualification heading', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Kwalificatie');
	});

	it('supports UEA and GVA types', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UEA');
		expect(source).toContain('GVA');
	});

	it('has status indicators', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('geldig');
		expect(source).toContain('verlopen');
		expect(source).toContain('ontbreekt');
	});
});

describe('SupplierNotesTab component', () => {
	const filePath = path.resolve(`${COMPONENT_DIR}/SupplierNotesTab.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('has notes textarea', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('textarea');
	});

	it('has save button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Notities opslaan');
	});

	it('tracks changes', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('hasChanges');
	});

	it('shows shared notes label', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Gedeelde notities');
	});
});
