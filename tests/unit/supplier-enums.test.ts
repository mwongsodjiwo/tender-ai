// Unit tests for supplier enums and types

import { describe, it, expect } from 'vitest';
import {
	SUPPLIER_PROJECT_STATUSES,
	SUPPLIER_PROJECT_STATUS_LABELS,
	SUPPLIER_PROJECT_ROLES,
	SUPPLIER_PROJECT_ROLE_LABELS
} from '../../src/lib/types/enums-multi-org';

// =============================================================================
// SUPPLIER PROJECT STATUSES
// =============================================================================

describe('SUPPLIER_PROJECT_STATUSES', () => {
	it('has 6 status values', () => {
		expect(SUPPLIER_PROJECT_STATUSES).toHaveLength(6);
	});

	it('contains all lifecycle statuses', () => {
		expect(SUPPLIER_PROJECT_STATUSES).toContain('prospect');
		expect(SUPPLIER_PROJECT_STATUSES).toContain('geinteresseerd');
		expect(SUPPLIER_PROJECT_STATUSES).toContain('ingeschreven');
		expect(SUPPLIER_PROJECT_STATUSES).toContain('gewonnen');
		expect(SUPPLIER_PROJECT_STATUSES).toContain('afgewezen');
		expect(SUPPLIER_PROJECT_STATUSES).toContain('gecontracteerd');
	});

	it('starts with prospect', () => {
		expect(SUPPLIER_PROJECT_STATUSES[0]).toBe('prospect');
	});

	it('has Dutch labels for all statuses', () => {
		for (const status of SUPPLIER_PROJECT_STATUSES) {
			expect(SUPPLIER_PROJECT_STATUS_LABELS[status]).toBeDefined();
			expect(typeof SUPPLIER_PROJECT_STATUS_LABELS[status]).toBe('string');
		}
	});
});

// =============================================================================
// SUPPLIER PROJECT ROLES
// =============================================================================

describe('SUPPLIER_PROJECT_ROLES', () => {
	it('has 5 role values', () => {
		expect(SUPPLIER_PROJECT_ROLES).toHaveLength(5);
	});

	it('contains all role values', () => {
		expect(SUPPLIER_PROJECT_ROLES).toContain('genodigde');
		expect(SUPPLIER_PROJECT_ROLES).toContain('vragensteller');
		expect(SUPPLIER_PROJECT_ROLES).toContain('inschrijver');
		expect(SUPPLIER_PROJECT_ROLES).toContain('winnaar');
		expect(SUPPLIER_PROJECT_ROLES).toContain('contractpartij');
	});

	it('starts with genodigde', () => {
		expect(SUPPLIER_PROJECT_ROLES[0]).toBe('genodigde');
	});

	it('has Dutch labels for all roles', () => {
		for (const role of SUPPLIER_PROJECT_ROLES) {
			expect(SUPPLIER_PROJECT_ROLE_LABELS[role]).toBeDefined();
			expect(typeof SUPPLIER_PROJECT_ROLE_LABELS[role]).toBe('string');
		}
	});
});
