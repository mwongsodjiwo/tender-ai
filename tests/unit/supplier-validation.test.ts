// Unit tests for supplier validation schemas

import { describe, it, expect } from 'vitest';
import {
	createSupplierSchema,
	updateSupplierSchema,
	createSupplierContactSchema,
	linkProjectSupplierSchema,
	updateProjectSupplierSchema,
	supplierSearchQuerySchema
} from '../../src/lib/server/api/validation/suppliers';

// =============================================================================
// CREATE SUPPLIER SCHEMA
// =============================================================================

describe('createSupplierSchema', () => {
	it('accepts valid supplier with all fields', () => {
		const result = createSupplierSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			kvk_nummer: '12345678',
			company_name: 'Test B.V.',
			trade_name: 'Test Handel',
			legal_form: 'Besloten Vennootschap',
			street: 'Keizersgracht 100',
			postal_code: '1015AA',
			city: 'Amsterdam',
			sbi_codes: ['62.01'],
			website: 'https://test.nl',
			tags: ['IT', 'consultancy'],
			rating: 4,
			notes: 'Goede leverancier'
		});
		expect(result.success).toBe(true);
	});

	it('accepts minimal supplier (only required fields)', () => {
		const result = createSupplierSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			company_name: 'Minimal B.V.'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing organization_id', () => {
		const result = createSupplierSchema.safeParse({
			company_name: 'Test'
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing company_name', () => {
		const result = createSupplierSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty company_name', () => {
		const result = createSupplierSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			company_name: ''
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid kvk_nummer format', () => {
		expect(createSupplierSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			company_name: 'Test',
			kvk_nummer: '1234567'
		}).success).toBe(false);
		expect(createSupplierSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			company_name: 'Test',
			kvk_nummer: 'ABCDEFGH'
		}).success).toBe(false);
	});

	it('rejects rating outside 1-5 range', () => {
		expect(createSupplierSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			company_name: 'Test',
			rating: 0
		}).success).toBe(false);
		expect(createSupplierSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			company_name: 'Test',
			rating: 6
		}).success).toBe(false);
	});

	it('rejects invalid website URL', () => {
		const result = createSupplierSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			company_name: 'Test',
			website: 'not-a-url'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid organization_id format', () => {
		const result = createSupplierSchema.safeParse({
			organization_id: 'invalid-uuid',
			company_name: 'Test'
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// UPDATE SUPPLIER SCHEMA
// =============================================================================

describe('updateSupplierSchema', () => {
	it('accepts partial update', () => {
		const result = updateSupplierSchema.safeParse({
			company_name: 'Updated Name'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (all optional)', () => {
		const result = updateSupplierSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects rating of 6', () => {
		const result = updateSupplierSchema.safeParse({ rating: 6 });
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// CREATE SUPPLIER CONTACT SCHEMA
// =============================================================================

describe('createSupplierContactSchema', () => {
	it('accepts valid contact with all fields', () => {
		const result = createSupplierContactSchema.safeParse({
			name: 'Jan Jansen',
			email: 'jan@test.nl',
			phone: '+31612345678',
			function_title: 'Directeur',
			is_primary: true
		});
		expect(result.success).toBe(true);
	});

	it('accepts minimal contact (only name)', () => {
		const result = createSupplierContactSchema.safeParse({
			name: 'Jan Jansen'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing name', () => {
		const result = createSupplierContactSchema.safeParse({
			email: 'jan@test.nl'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty name', () => {
		const result = createSupplierContactSchema.safeParse({ name: '' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid email', () => {
		const result = createSupplierContactSchema.safeParse({
			name: 'Test',
			email: 'not-an-email'
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// LINK PROJECT SUPPLIER SCHEMA
// =============================================================================

describe('linkProjectSupplierSchema', () => {
	it('accepts valid link with all fields', () => {
		const result = linkProjectSupplierSchema.safeParse({
			supplier_id: '550e8400-e29b-41d4-a716-446655440000',
			status: 'prospect',
			role: 'genodigde'
		});
		expect(result.success).toBe(true);
	});

	it('accepts minimal link (only supplier_id)', () => {
		const result = linkProjectSupplierSchema.safeParse({
			supplier_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing supplier_id', () => {
		const result = linkProjectSupplierSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects invalid status', () => {
		const result = linkProjectSupplierSchema.safeParse({
			supplier_id: '550e8400-e29b-41d4-a716-446655440000',
			status: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid role', () => {
		const result = linkProjectSupplierSchema.safeParse({
			supplier_id: '550e8400-e29b-41d4-a716-446655440000',
			role: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('accepts all valid status values', () => {
		const statuses = [
			'prospect', 'geinteresseerd', 'ingeschreven',
			'gewonnen', 'afgewezen', 'gecontracteerd'
		];
		for (const status of statuses) {
			const result = linkProjectSupplierSchema.safeParse({
				supplier_id: '550e8400-e29b-41d4-a716-446655440000',
				status
			});
			expect(result.success).toBe(true);
		}
	});

	it('accepts all valid role values', () => {
		const roles = [
			'genodigde', 'vragensteller', 'inschrijver',
			'winnaar', 'contractpartij'
		];
		for (const role of roles) {
			const result = linkProjectSupplierSchema.safeParse({
				supplier_id: '550e8400-e29b-41d4-a716-446655440000',
				role
			});
			expect(result.success).toBe(true);
		}
	});
});

// =============================================================================
// UPDATE PROJECT SUPPLIER SCHEMA
// =============================================================================

describe('updateProjectSupplierSchema', () => {
	it('accepts valid status update', () => {
		const result = updateProjectSupplierSchema.safeParse({
			status: 'ingeschreven'
		});
		expect(result.success).toBe(true);
	});

	it('accepts offer_amount', () => {
		const result = updateProjectSupplierSchema.safeParse({
			offer_amount: 150000.50
		});
		expect(result.success).toBe(true);
	});

	it('rejects negative offer_amount', () => {
		const result = updateProjectSupplierSchema.safeParse({
			offer_amount: -100
		});
		expect(result.success).toBe(false);
	});

	it('accepts empty object', () => {
		const result = updateProjectSupplierSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts signer fields', () => {
		const result = updateProjectSupplierSchema.safeParse({
			signer_name: 'Jan Jansen',
			signer_title: 'Directeur'
		});
		expect(result.success).toBe(true);
	});
});

// =============================================================================
// SUPPLIER SEARCH QUERY SCHEMA
// =============================================================================

describe('supplierSearchQuerySchema', () => {
	it('accepts empty query (defaults applied)', () => {
		const result = supplierSearchQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(50);
			expect(result.data.offset).toBe(0);
		}
	});

	it('accepts search string', () => {
		const result = supplierSearchQuerySchema.safeParse({ search: 'test' });
		expect(result.success).toBe(true);
	});

	it('coerces limit to number', () => {
		const result = supplierSearchQuerySchema.safeParse({ limit: '25' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(25);
		}
	});

	it('rejects limit over 100', () => {
		const result = supplierSearchQuerySchema.safeParse({ limit: '101' });
		expect(result.success).toBe(false);
	});

	it('coerces offset to number', () => {
		const result = supplierSearchQuerySchema.safeParse({ offset: '10' });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.offset).toBe(10);
		}
	});
});
