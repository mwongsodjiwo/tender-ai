// Unit tests for Fase 6 — Organization KVK type shapes and schema validation

import { describe, it, expect } from 'vitest';
import {
	createOrganizationSchema,
	updateOrganizationSchema
} from '../../src/lib/server/api/validation/auth';
import type { Organization } from '../../src/lib/types/database';
import type {
	CreateOrganizationRequest,
	UpdateOrganizationRequest
} from '../../src/lib/types/api/organizations';

// =============================================================================
// ORGANIZATION TYPE — KVK FIELDS
// =============================================================================

describe('Organization type — KVK fields', () => {
	it('includes all KVK fields', () => {
		const org: Organization = {
			id: 'org-1', name: 'Test BV', slug: 'test-bv',
			description: null, logo_url: null,
			parent_organization_id: null, organization_type: 'client',
			aanbestedende_dienst_type: null,
			kvk_nummer: '12345678', handelsnaam: 'Test BV',
			rechtsvorm: 'Besloten Vennootschap',
			straat: 'Keizersgracht 100', postcode: '1015AA',
			plaats: 'Amsterdam', sbi_codes: ['62.01', '62.02'],
			nuts_codes: ['NL326'],
			created_at: '', updated_at: '', deleted_at: null
		};
		expect(org.kvk_nummer).toBe('12345678');
		expect(org.sbi_codes).toEqual(['62.01', '62.02']);
		expect(org.nuts_codes).toEqual(['NL326']);
	});

	it('allows null KVK fields', () => {
		const org: Organization = {
			id: 'org-2', name: 'Basic Org', slug: 'basic-org',
			description: null, logo_url: null,
			parent_organization_id: null, organization_type: 'client',
			aanbestedende_dienst_type: null,
			kvk_nummer: null, handelsnaam: null, rechtsvorm: null,
			straat: null, postcode: null, plaats: null,
			sbi_codes: [], nuts_codes: [],
			created_at: '', updated_at: '', deleted_at: null
		};
		expect(org.kvk_nummer).toBeNull();
		expect(org.sbi_codes).toEqual([]);
	});
});

// =============================================================================
// API REQUEST TYPES
// =============================================================================

describe('Organization API request types — KVK fields', () => {
	it('CreateOrganizationRequest accepts KVK fields', () => {
		const req: CreateOrganizationRequest = {
			name: 'Test', slug: 'test',
			kvk_nummer: '12345678', sbi_codes: ['62.01']
		};
		expect(req.kvk_nummer).toBe('12345678');
	});

	it('UpdateOrganizationRequest accepts KVK fields', () => {
		const req: UpdateOrganizationRequest = {
			kvk_nummer: '87654321', plaats: 'Rotterdam'
		};
		expect(req.kvk_nummer).toBe('87654321');
	});
});

// =============================================================================
// CREATE ORGANIZATION SCHEMA — KVK VALIDATION
// =============================================================================

describe('createOrganizationSchema — KVK fields', () => {
	const base = { name: 'Test Org', slug: 'test-org' };

	it('accepts without KVK fields', () => {
		expect(createOrganizationSchema.safeParse(base).success).toBe(true);
	});

	it('accepts valid kvk_nummer', () => {
		expect(createOrganizationSchema.safeParse({
			...base, kvk_nummer: '12345678'
		}).success).toBe(true);
	});

	it('rejects kvk_nummer with wrong length', () => {
		expect(createOrganizationSchema.safeParse({
			...base, kvk_nummer: '1234567'
		}).success).toBe(false);
		expect(createOrganizationSchema.safeParse({
			...base, kvk_nummer: '123456789'
		}).success).toBe(false);
	});

	it('rejects kvk_nummer with non-digits', () => {
		expect(createOrganizationSchema.safeParse({
			...base, kvk_nummer: '1234ABCD'
		}).success).toBe(false);
	});

	it('accepts valid Dutch postcode', () => {
		expect(createOrganizationSchema.safeParse({
			...base, postcode: '1015AA'
		}).success).toBe(true);
	});

	it('accepts postcode with space', () => {
		expect(createOrganizationSchema.safeParse({
			...base, postcode: '1015 AA'
		}).success).toBe(true);
	});

	it('rejects invalid postcode', () => {
		expect(createOrganizationSchema.safeParse({
			...base, postcode: '12345'
		}).success).toBe(false);
		expect(createOrganizationSchema.safeParse({
			...base, postcode: 'ABCD'
		}).success).toBe(false);
	});

	it('accepts valid sbi_codes array', () => {
		expect(createOrganizationSchema.safeParse({
			...base, sbi_codes: ['62.01', '62.02']
		}).success).toBe(true);
	});

	it('accepts empty sbi_codes array', () => {
		expect(createOrganizationSchema.safeParse({
			...base, sbi_codes: []
		}).success).toBe(true);
	});

	it('accepts valid nuts_codes array', () => {
		expect(createOrganizationSchema.safeParse({
			...base, nuts_codes: ['NL326', 'NL32']
		}).success).toBe(true);
	});

	it('rejects invalid nuts_codes', () => {
		expect(createOrganizationSchema.safeParse({
			...base, nuts_codes: ['XX123']
		}).success).toBe(false);
	});

	it('accepts all KVK fields together', () => {
		expect(createOrganizationSchema.safeParse({
			...base, kvk_nummer: '12345678', handelsnaam: 'Test BV',
			rechtsvorm: 'BV', straat: 'Keizersgracht 100',
			postcode: '1015AA', plaats: 'Amsterdam',
			sbi_codes: ['62.01'], nuts_codes: ['NL326']
		}).success).toBe(true);
	});
});

// =============================================================================
// UPDATE ORGANIZATION SCHEMA — KVK VALIDATION
// =============================================================================

describe('updateOrganizationSchema — KVK fields', () => {
	it('accepts only KVK fields', () => {
		expect(updateOrganizationSchema.safeParse({
			kvk_nummer: '87654321', plaats: 'Rotterdam'
		}).success).toBe(true);
	});

	it('rejects invalid kvk_nummer on update', () => {
		expect(updateOrganizationSchema.safeParse({
			kvk_nummer: 'short'
		}).success).toBe(false);
	});

	it('accepts empty update object', () => {
		expect(updateOrganizationSchema.safeParse({}).success).toBe(true);
	});
});
