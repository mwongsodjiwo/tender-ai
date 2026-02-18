// Unit tests for Fase 3 — Organization context-switcher store & components

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { readFileSync } from 'fs';
import path from 'path';
import type { Organization } from '../../src/lib/types/database';

// =============================================================================
// MOCK $app/environment — must be before store import
// =============================================================================

const mockStorage = new Map<string, string>();

vi.mock('$app/environment', () => ({ browser: true }));

// Mock localStorage
const localStorageMock = {
	getItem: (key: string) => mockStorage.get(key) ?? null,
	setItem: (key: string, val: string) => mockStorage.set(key, val),
	removeItem: (key: string) => mockStorage.delete(key)
};
vi.stubGlobal('localStorage', localStorageMock);

// =============================================================================
// IMPORT STORE (after mocks)
// =============================================================================

const {
	activeOrganizationId,
	activeOrganization,
	availableOrganizations,
	switchOrganization,
	initOrganizationContext,
	setAvailableOrganizations,
	orgColor
	// eslint-disable-next-line @typescript-eslint/no-require-imports
} = await import('../../src/lib/stores/organization-context');

// =============================================================================
// TEST FIXTURES
// =============================================================================

function makeOrg(overrides: Partial<Organization> = {}): Organization {
	return {
		id: 'org-1',
		name: 'Test Organisatie',
		slug: 'test-org',
		description: null,
		logo_url: null,
		parent_organization_id: null,
		organization_type: 'client',
		aanbestedende_dienst_type: null,
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z',
		deleted_at: null,
		...overrides
	};
}

const ORG_A = makeOrg({ id: 'aaa', name: 'Gemeente Amsterdam' });
const ORG_B = makeOrg({ id: 'bbb', name: 'Adviesbureau Bravo' });
const ORG_C = makeOrg({ id: 'ccc', name: 'Provincie Utrecht' });

// =============================================================================
// TESTS
// =============================================================================

describe('orgColor', () => {
	it('returns a hex color string', () => {
		const color = orgColor('Test');
		expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
	});

	it('returns the same color for the same name', () => {
		expect(orgColor('Gemeente Amsterdam')).toBe(orgColor('Gemeente Amsterdam'));
	});

	it('returns different colors for different names', () => {
		const colorA = orgColor('Gemeente Amsterdam');
		const colorB = orgColor('Adviesbureau Bravo');
		expect(colorA).not.toBe(colorB);
	});

	it('handles empty string without error', () => {
		const color = orgColor('');
		expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
	});
});

describe('activeOrganizationId store', () => {
	beforeEach(() => {
		mockStorage.clear();
		activeOrganizationId.set(null);
	});

	it('starts as null when nothing in localStorage', () => {
		expect(get(activeOrganizationId)).toBeNull();
	});

	it('persists to localStorage on set', () => {
		activeOrganizationId.set('org-123');
		expect(mockStorage.get('tm_active_organization_id')).toBe('org-123');
	});

	it('removes from localStorage when set to null', () => {
		activeOrganizationId.set('org-123');
		activeOrganizationId.set(null);
		expect(mockStorage.has('tm_active_organization_id')).toBe(false);
	});
});

describe('switchOrganization', () => {
	beforeEach(() => {
		mockStorage.clear();
		activeOrganizationId.set(null);
	});

	it('updates activeOrganizationId', () => {
		switchOrganization('org-xyz');
		expect(get(activeOrganizationId)).toBe('org-xyz');
	});

	it('persists to localStorage', () => {
		switchOrganization('org-abc');
		expect(mockStorage.get('tm_active_organization_id')).toBe('org-abc');
	});
});

describe('availableOrganizations store', () => {
	it('starts empty', () => {
		setAvailableOrganizations([]);
		expect(get(availableOrganizations)).toEqual([]);
	});

	it('holds set organizations', () => {
		setAvailableOrganizations([ORG_A, ORG_B]);
		const orgs = get(availableOrganizations);
		expect(orgs).toHaveLength(2);
		expect(orgs[0].id).toBe('aaa');
	});
});

describe('activeOrganization derived store', () => {
	beforeEach(() => {
		mockStorage.clear();
		activeOrganizationId.set(null);
		setAvailableOrganizations([]);
	});

	it('returns null when no org selected', () => {
		setAvailableOrganizations([ORG_A]);
		expect(get(activeOrganization)).toBeNull();
	});

	it('returns the matching organization', () => {
		setAvailableOrganizations([ORG_A, ORG_B]);
		activeOrganizationId.set('bbb');
		expect(get(activeOrganization)?.name).toBe('Adviesbureau Bravo');
	});

	it('returns null when id does not match any org', () => {
		setAvailableOrganizations([ORG_A]);
		activeOrganizationId.set('nonexistent');
		expect(get(activeOrganization)).toBeNull();
	});
});

describe('initOrganizationContext', () => {
	beforeEach(() => {
		mockStorage.clear();
		activeOrganizationId.set(null);
		setAvailableOrganizations([]);
	});

	it('sets available organizations', () => {
		initOrganizationContext([ORG_A, ORG_B, ORG_C]);
		expect(get(availableOrganizations)).toHaveLength(3);
	});

	it('selects first org when no stored id', () => {
		initOrganizationContext([ORG_A, ORG_B]);
		expect(get(activeOrganizationId)).toBe('aaa');
	});

	it('restores stored org if still in list', () => {
		mockStorage.set('tm_active_organization_id', 'bbb');
		initOrganizationContext([ORG_A, ORG_B, ORG_C]);
		expect(get(activeOrganizationId)).toBe('bbb');
	});

	it('falls back to first org if stored id is invalid', () => {
		mockStorage.set('tm_active_organization_id', 'deleted-org');
		initOrganizationContext([ORG_A, ORG_B]);
		expect(get(activeOrganizationId)).toBe('aaa');
	});

	it('sets null when org list is empty', () => {
		initOrganizationContext([]);
		expect(get(activeOrganizationId)).toBeNull();
	});
});

// =============================================================================
// COMPONENT FILE VERIFICATION
// =============================================================================

const COMPONENTS_DIR = path.resolve('src/lib/components');

describe('OrganizationSwitcher component', () => {
	const filePath = path.join(COMPONENTS_DIR, 'OrganizationSwitcher.svelte');
	const source = readFileSync(filePath, 'utf-8');

	it('exists as a Svelte file', () => {
		expect(source).toContain('<script');
	});

	it('accepts organizations prop', () => {
		expect(source).toContain('export let organizations');
	});

	it('uses activeOrganizationId from store', () => {
		expect(source).toContain('activeOrganizationId');
	});

	it('calls switchOrganization on change', () => {
		expect(source).toContain('switchOrganization');
	});

	it('has Dutch label for select', () => {
		expect(source).toContain('Organisatie');
	});

	it('has aria-label for accessibility', () => {
		expect(source).toContain('aria-label');
	});

	it('uses orgColor for visual indicator', () => {
		expect(source).toContain('orgColor');
	});
});

describe('ContextBadge component', () => {
	const filePath = path.join(COMPONENTS_DIR, 'ContextBadge.svelte');
	const source = readFileSync(filePath, 'utf-8');

	it('exists as a Svelte file', () => {
		expect(source).toContain('<script');
	});

	it('uses activeOrganization derived store', () => {
		expect(source).toContain('activeOrganization');
	});

	it('uses orgColor for badge color', () => {
		expect(source).toContain('orgColor');
	});

	it('has aria-label for accessibility', () => {
		expect(source).toContain('aria-label');
	});

	it('displays organization name', () => {
		expect(source).toContain('$activeOrganization.name');
	});

	it('shows colored dot indicator', () => {
		expect(source).toContain('rounded-full');
	});
});

// =============================================================================
// NAVIGATION INTEGRATION
// =============================================================================

describe('Navigation integration', () => {
	const navPath = path.join(COMPONENTS_DIR, 'Navigation.svelte');
	const navSource = readFileSync(navPath, 'utf-8');

	it('imports OrganizationSwitcher', () => {
		expect(navSource).toContain('OrganizationSwitcher');
	});

	it('imports ContextBadge', () => {
		expect(navSource).toContain('ContextBadge');
	});

	it('accepts organizations prop', () => {
		expect(navSource).toContain('export let organizations');
	});

	it('calls initOrganizationContext', () => {
		expect(navSource).toContain('initOrganizationContext');
	});

	it('passes organizations to OrganizationSwitcher', () => {
		expect(navSource).toContain('{organizations}');
	});

	it('calls invalidateAll on org switch to reload data', () => {
		expect(navSource).toContain('invalidateAll');
	});
});

// =============================================================================
// STORE FILE STRUCTURE
// =============================================================================

describe('organization-context store file', () => {
	const storePath = path.resolve('src/lib/stores/organization-context.ts');
	const storeSource = readFileSync(storePath, 'utf-8');

	it('uses writable from svelte/store', () => {
		expect(storeSource).toContain("from 'svelte/store'");
	});

	it('uses derived from svelte/store', () => {
		expect(storeSource).toContain('derived');
	});

	it('checks browser safety for SSR', () => {
		expect(storeSource).toContain('browser');
	});

	it('uses correct localStorage key', () => {
		expect(storeSource).toContain('tm_active_organization_id');
	});

	it('exports all public API functions', () => {
		expect(storeSource).toContain('export const activeOrganizationId');
		expect(storeSource).toContain('export const activeOrganization');
		expect(storeSource).toContain('export const availableOrganizations');
		expect(storeSource).toContain('export function switchOrganization');
		expect(storeSource).toContain('export function initOrganizationContext');
		expect(storeSource).toContain('export function orgColor');
	});

	it('stays under 200 lines', () => {
		const lineCount = storeSource.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});
