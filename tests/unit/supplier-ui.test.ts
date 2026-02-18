// Unit tests for Fase 9 — Supplier UI file verification (routes, components, navigation)

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// =============================================================================
// SUPPLIERS PAGE ROUTE
// =============================================================================

describe('Suppliers page server load', () => {
	const filePath = path.resolve('src/routes/(app)/suppliers/+page.server.ts');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports load function', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const load');
	});

	it('queries suppliers table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('suppliers')");
	});

	it('filters by organization_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('organization_id');
	});

	it('filters out deleted suppliers', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('deleted_at');
	});

	it('orders by company_name', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('company_name');
	});
});

describe('Suppliers page template', () => {
	const filePath = path.resolve('src/routes/(app)/suppliers/+page.svelte');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('imports FilterBar component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('FilterBar');
	});

	it('imports EmptyState component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('EmptyState');
	});

	it('imports SupplierTable component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SupplierTable');
	});

	it('imports SupplierDrawer component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('SupplierDrawer');
	});

	it('imports KvkSearchDialog component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('KvkSearchDialog');
	});

	it('has page title', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('<title>Leveranciers');
	});

	it('has search functionality', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('searchQuery');
		expect(source).toContain('handleSearch');
	});

	it('has tag filter', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('tagFilter');
	});

	it('has new supplier button', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Nieuwe leverancier');
	});

	it('handles empty state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Nog geen leveranciers');
	});

	it('handles no filter results', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Geen resultaten');
	});

	it('handles load error state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('loadError');
	});

	it('handles error message state', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('errorMessage');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// NAVIGATION UPDATE
// =============================================================================

describe('Navigation includes Leveranciers', () => {
	const source = readFileSync(
		path.resolve('src/lib/components/Navigation.svelte'), 'utf-8'
	);

	it('has Leveranciers link', () => {
		expect(source).toContain("label: 'Leveranciers'");
	});

	it('links to /suppliers', () => {
		expect(source).toContain("href: '/suppliers'");
	});

	it('has building icon', () => {
		expect(source).toContain("icon: 'building'");
		expect(source).toContain("link.icon === 'building'");
	});
});
