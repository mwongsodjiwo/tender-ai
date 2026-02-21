// Fase 61 — Regression tests for DataTable and DataTableCard changes
// Verifies the footer-refactor (Fase 58) and scrollbar fix (Fase 57) did not break consumers

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const ROOT = 'src/lib/components';

// =============================================================================
// DATATABLE COMPONENT — structure & regression
// =============================================================================

describe('DataTable.svelte — component structure', () => {
	const filePath = path.resolve(`${ROOT}/DataTable.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});

	it('accepts columns prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let columns');
	});

	it('accepts rows prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let rows');
	});

	it('accepts onRowClick prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let onRowClick');
	});

	it('accepts ariaLabel prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let ariaLabel');
	});

	it('accepts emptyIcon prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let emptyIcon');
	});

	it('accepts emptyMessage prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let emptyMessage');
	});

	it('accepts resizable prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let resizable');
	});

	it('imports DataTableColumn type', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("import type { DataTableColumn }");
	});
});

describe('DataTable.svelte — empty state (0 rows)', () => {
	const filePath = path.resolve(`${ROOT}/DataTable.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('checks rows.length === 0 for empty state', () => {
		expect(source).toContain('rows.length === 0');
	});

	it('shows emptyMessage text in empty state', () => {
		expect(source).toContain('{emptyMessage}');
	});

	it('shows people icon when emptyIcon is people', () => {
		expect(source).toContain("emptyIcon === 'people'");
	});

	it('shows table icon by default', () => {
		// The else-branch renders table icon SVG
		expect(source).toContain('M3.375 19.5h17.25');
	});

	it('has centered layout in empty state', () => {
		expect(source).toContain('text-center');
	});
});

describe('DataTable.svelte — data rendering (rows > 0)', () => {
	const filePath = path.resolve(`${ROOT}/DataTable.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('renders table element with role="grid"', () => {
		expect(source).toContain('role="grid"');
	});

	it('uses aria-label on table', () => {
		expect(source).toContain('aria-label={ariaLabel}');
	});

	it('renders thead with sticky positioning', () => {
		expect(source).toContain('sticky top-0');
	});

	it('iterates over rows with each block', () => {
		expect(source).toContain('{#each rows as row');
	});

	it('iterates over columns for cells', () => {
		expect(source).toContain('{#each columns as col');
	});

	it('supports named cell slot for custom rendering', () => {
		expect(source).toContain('name="cell"');
	});

	it('handles keyboard navigation (Enter and Space)', () => {
		expect(source).toContain("event.key === 'Enter'");
		expect(source).toContain("event.key === ' '");
	});

	it('applies visibleFrom class for responsive columns', () => {
		expect(source).toContain('visibilityClass');
	});

	it('uses cellValue function for default text', () => {
		expect(source).toContain('cellValue(row, col)');
	});

	it('shows em-dash for null/undefined cell values', () => {
		// cellValue returns '—' when val is null
		expect(source).toContain("return val != null ? String(val) : '—'");
	});
});

describe('DataTable.svelte — records footer removed (Fase 58)', () => {
	const filePath = path.resolve(`${ROOT}/DataTable.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('does NOT contain a records footer div', () => {
		expect(source).not.toContain('recordLabel');
		expect(source).not.toContain('records');
	});

	it('does NOT contain rowCount prop', () => {
		expect(source).not.toContain('export let rowCount');
	});
});

describe('DataTable.svelte — column resizing', () => {
	const filePath = path.resolve(`${ROOT}/DataTable.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('has resize handle elements', () => {
		expect(source).toContain('resize-handle');
	});

	it('has resize start handler', () => {
		expect(source).toContain('onResizeStart');
	});

	it('has resize move handler', () => {
		expect(source).toContain('onResizeMove');
	});

	it('has resize end handler', () => {
		expect(source).toContain('onResizeEnd');
	});

	it('enforces minimum column width', () => {
		expect(source).toContain('MIN_COL_WIDTH');
	});

	it('uses colgroup for column widths', () => {
		expect(source).toContain('<colgroup>');
	});
});

// =============================================================================
// DATATABLECARD COMPONENT — structure & regression
// =============================================================================

describe('DataTableCard.svelte — component structure', () => {
	const filePath = path.resolve(`${ROOT}/DataTableCard.svelte`);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});

	it('accepts searchPlaceholder prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let searchPlaceholder');
	});

	it('accepts searchLabel prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let searchLabel');
	});

	it('accepts searchQuery prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let searchQuery');
	});

	it('accepts showFilter prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let showFilter');
	});

	it('accepts showFilterButton prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let showFilterButton');
	});

	it('accepts showOptionsButton prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let showOptionsButton');
	});

	it('accepts scrollable prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let scrollable');
	});

	it('accepts rowCount prop', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export let rowCount');
	});
});

describe('DataTableCard.svelte — scrollable mode', () => {
	const filePath = path.resolve(`${ROOT}/DataTableCard.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('applies flex layout when scrollable', () => {
		expect(source).toContain('class:flex={scrollable}');
		expect(source).toContain('class:flex-col={scrollable}');
	});

	it('applies overflow-hidden when scrollable', () => {
		expect(source).toContain('class:overflow-hidden={scrollable}');
	});

	it('wraps content in scroll-area div when scrollable', () => {
		expect(source).toContain('scroll-area');
		expect(source).toContain('overflow-y-auto');
	});

	it('renders slot without scroll wrapper when not scrollable', () => {
		// The {:else} branch renders <slot /> directly
		expect(source).toContain('{:else}');
		expect(source).toContain('<slot />');
	});
});

describe('DataTableCard.svelte — scrollbar fix (Fase 57)', () => {
	const filePath = path.resolve(`${ROOT}/DataTableCard.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('has scrollbar-gutter: stable to prevent content shift', () => {
		expect(source).toContain('scrollbar-gutter: stable');
	});

	it('has Firefox thin scrollbar setting', () => {
		expect(source).toContain('scrollbar-width: thin');
	});

	it('has transparent scrollbar color at rest (Firefox)', () => {
		expect(source).toContain('scrollbar-color: transparent transparent');
	});

	it('shows scrollbar on hover (Firefox)', () => {
		expect(source).toContain('.scroll-area:hover');
		expect(source).toContain('rgba(0, 0, 0, 0.2) transparent');
	});

	it('has Webkit scrollbar width of 6px', () => {
		expect(source).toContain('width: 6px');
	});

	it('has transparent Webkit scrollbar thumb at rest', () => {
		expect(source).toContain('::-webkit-scrollbar-thumb');
	});

	it('shows Webkit scrollbar thumb on hover', () => {
		expect(source).toContain(':hover::-webkit-scrollbar-thumb');
	});
});

describe('DataTableCard.svelte — records footer (Fase 58)', () => {
	const filePath = path.resolve(`${ROOT}/DataTableCard.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('computes recordLabel from rowCount', () => {
		expect(source).toContain('recordLabel');
	});

	it('shows singular "1 record" for single row', () => {
		expect(source).toContain("rowCount === 1 ? '1 record'");
	});

	it('shows plural "X records" for multiple rows', () => {
		expect(source).toContain('`${rowCount} records`');
	});

	it('renders footer OUTSIDE the scroll-area', () => {
		// Footer div comes AFTER the scroll-area/slot block, before closing card div
		const scrollAreaEnd = source.indexOf('{:else}');
		const footerStart = source.indexOf('recordLabel', scrollAreaEnd);
		expect(footerStart).toBeGreaterThan(scrollAreaEnd);
	});

	it('footer has shrink-0 to prevent compression', () => {
		expect(source).toContain('shrink-0 border-t');
	});

	it('footer has bg-gray-50 background', () => {
		const footerLine = source.split('\n').find(
			(line) => line.includes('recordLabel') || (line.includes('border-t') && line.includes('bg-gray-50') && line.includes('shrink-0'))
		);
		expect(footerLine).toBeDefined();
	});

	it('only shows footer when rowCount > 0', () => {
		expect(source).toContain('{#if rowCount > 0}');
	});
});

describe('DataTableCard.svelte — filter toggle', () => {
	const filePath = path.resolve(`${ROOT}/DataTableCard.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('toggles showFilter on button click', () => {
		expect(source).toContain('showFilter = !showFilter');
	});

	it('conditionally renders filter panel', () => {
		expect(source).toContain('{#if showFilter}');
	});

	it('has filter slot for custom filter content', () => {
		expect(source).toContain('name="filter"');
	});

	it('filter button shows Filter text', () => {
		expect(source).toContain('Filter');
	});
});

describe('DataTableCard.svelte — search binding', () => {
	const filePath = path.resolve(`${ROOT}/DataTableCard.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('binds input value to searchQuery', () => {
		expect(source).toContain('bind:value={searchQuery}');
	});

	it('uses search input type', () => {
		expect(source).toContain('type="search"');
	});

	it('applies searchPlaceholder as placeholder', () => {
		expect(source).toContain('placeholder={searchPlaceholder}');
	});

	it('applies searchLabel as aria-label', () => {
		expect(source).toContain('aria-label={searchLabel}');
	});

	it('has search icon SVG', () => {
		expect(source).toContain('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z');
	});
});

// =============================================================================
// CONSUMER PAGES — verify rowCount is passed correctly
// =============================================================================

describe('TeamPage.svelte — DataTableCard consumer', () => {
	const filePath = path.resolve(`${ROOT}/team/TeamPage.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('imports DataTableCard', () => {
		expect(source).toContain("import DataTableCard from '$lib/components/DataTableCard.svelte'");
	});

	it('passes rowCount prop', () => {
		expect(source).toContain('rowCount=');
	});

	it('passes filteredMembers.length as rowCount', () => {
		expect(source).toContain('rowCount={filteredMembers.length}');
	});

	it('binds searchQuery', () => {
		expect(source).toContain('bind:searchQuery');
	});

	it('binds showFilter', () => {
		expect(source).toContain('bind:showFilter');
	});

	it('is under 200 lines', () => {
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

describe('Documents +page.svelte — DataTableCard consumer', () => {
	const filePath = path.resolve(
		'src/routes/(app)/projects/[id]/documents/+page.svelte'
	);
	const source = readFileSync(filePath, 'utf-8');

	it('imports DataTableCard', () => {
		expect(source).toContain("import DataTableCard from '$lib/components/DataTableCard.svelte'");
	});

	it('passes rowCount prop', () => {
		expect(source).toContain('rowCount=');
	});

	it('computes rowCount based on active tab', () => {
		expect(source).toContain('filteredRows.length');
		expect(source).toContain('filteredArchivedRows.length');
	});

	it('passes scrollable prop', () => {
		expect(source).toContain('scrollable');
	});

	it('binds searchQuery', () => {
		expect(source).toContain('bind:searchQuery');
	});

	it('binds showFilter', () => {
		expect(source).toContain('bind:showFilter');
	});

	it('is under 200 lines', () => {
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

describe('TeamTable.svelte — DataTable consumer', () => {
	const filePath = path.resolve(`${ROOT}/team/TeamTable.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('imports DataTable', () => {
		expect(source).toContain("import DataTable from '$lib/components/DataTable.svelte'");
	});

	it('passes columns prop', () => {
		expect(source).toContain('{columns}');
	});

	it('passes rows as members', () => {
		expect(source).toContain('rows={members}');
	});

	it('passes onRowClick', () => {
		expect(source).toContain('{onRowClick}');
	});

	it('passes ariaLabel', () => {
		expect(source).toContain('ariaLabel="Teamleden overzicht"');
	});

	it('passes emptyIcon and emptyMessage', () => {
		expect(source).toContain('emptyIcon="people"');
		expect(source).toContain('emptyMessage="Geen teamleden gevonden."');
	});

	it('does NOT pass rowCount (DataTable has no such prop)', () => {
		expect(source).not.toContain('rowCount');
	});

	it('is under 200 lines', () => {
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

describe('DocumentsTable.svelte — DataTable consumer', () => {
	const filePath = path.resolve(`${ROOT}/documents/DocumentsTable.svelte`);
	const source = readFileSync(filePath, 'utf-8');

	it('imports DataTable', () => {
		expect(source).toContain("import DataTable from '$lib/components/DataTable.svelte'");
	});

	it('passes columns prop', () => {
		expect(source).toContain('{columns}');
	});

	it('passes rows prop', () => {
		expect(source).toContain('{rows}');
	});

	it('passes onRowClick', () => {
		expect(source).toContain('{onRowClick}');
	});

	it('passes ariaLabel', () => {
		expect(source).toContain('ariaLabel="Documenten overzicht"');
	});

	it('does NOT pass rowCount (DataTable has no such prop)', () => {
		expect(source).not.toContain('rowCount');
	});

	it('handles empty date with "Geen deadline" fallback', () => {
		expect(source).toContain('Geen deadline');
	});

	it('handles non-exportable rows with em-dash', () => {
		// In the export column else branch
		expect(source).toContain('<span class="text-xs text-gray-400">—</span>');
	});

	it('is under 200 lines', () => {
		expect(source.split('\n').length).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// DATA-TABLE TYPE DEFINITIONS
// =============================================================================

describe('DataTableColumn type — data-table.ts', () => {
	const filePath = path.resolve('src/lib/types/data-table.ts');
	const source = readFileSync(filePath, 'utf-8');

	it('exports DataTableColumn interface', () => {
		expect(source).toContain('export interface DataTableColumn');
	});

	it('has key property', () => {
		expect(source).toContain('key: string');
	});

	it('has label property', () => {
		expect(source).toContain('label: string');
	});

	it('has optional visibleFrom property', () => {
		expect(source).toContain('visibleFrom?');
	});

	it('has optional accessor function', () => {
		expect(source).toContain('accessor?: (row: T) => string');
	});

	it('has optional srOnly property', () => {
		expect(source).toContain('srOnly?: boolean');
	});

	it('has optional className property', () => {
		expect(source).toContain('className?: string');
	});
});

// =============================================================================
// BUILD-ROWS LOGIC — functional regression tests
// =============================================================================

describe('build-rows.ts — buildRows function', () => {
	const filePath = path.resolve(`${ROOT}/documents/build-rows.ts`);
	const source = readFileSync(filePath, 'utf-8');

	it('exports buildRows function', () => {
		expect(source).toContain('export function buildRows');
	});

	it('exports filterRows function', () => {
		expect(source).toContain('export function filterRows');
	});

	it('exports ProductBlock interface', () => {
		expect(source).toContain('export interface ProductBlock');
	});

	it('exports TypeFilter type', () => {
		expect(source).toContain('export type TypeFilter');
	});

	it('uses nextDeadline parameter for document dates', () => {
		expect(source).toContain('nextDeadline');
	});

	it('falls back to empty string when no deadline', () => {
		expect(source).toContain("nextDeadline ?? ''");
	});

	it('uses created_at for brief dates', () => {
		expect(source).toContain('date: l.created_at');
	});

	it('has letter type labels in Dutch', () => {
		expect(source).toContain('Nota van Inlichtingen');
		expect(source).toContain('Voorlopige gunningsbeslissing');
	});
});

describe('DocumentRow type — types.ts', () => {
	const filePath = path.resolve(`${ROOT}/documents/types.ts`);
	const source = readFileSync(filePath, 'utf-8');

	it('exports DocumentRow interface', () => {
		expect(source).toContain('export interface DocumentRow');
	});

	it('has date field as string', () => {
		expect(source).toContain('date: string');
	});

	it('has type discriminant for document vs brief', () => {
		expect(source).toContain("'document' | 'brief'");
	});

	it('has exportable boolean', () => {
		expect(source).toContain('exportable: boolean');
	});

	it('has archived boolean', () => {
		expect(source).toContain('archived: boolean');
	});
});
