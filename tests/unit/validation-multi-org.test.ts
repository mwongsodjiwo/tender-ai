// Unit tests for v2 Fase 1 — Multi-org Zod validation schemas

import { describe, it, expect } from 'vitest';
import {
	createOrganizationRelationshipSchema,
	updateOrganizationRelationshipSchema,
	createOrganizationSettingsSchema,
	updateOrganizationSettingsSchema
} from '../../src/lib/server/api/validation/multi-org';

// =============================================================================
// ORGANIZATION RELATIONSHIP SCHEMAS
// =============================================================================

describe('createOrganizationRelationshipSchema', () => {
	it('accepts valid relationship data', () => {
		const result = createOrganizationRelationshipSchema.safeParse({
			target_organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			relationship_type: 'consultancy'
		});
		expect(result.success).toBe(true);
	});

	it('accepts all optional fields', () => {
		const result = createOrganizationRelationshipSchema.safeParse({
			target_organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			relationship_type: 'audit',
			contract_reference: 'VO-2026-001',
			valid_from: '2026-01-01',
			valid_until: '2027-01-01'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid UUID', () => {
		const result = createOrganizationRelationshipSchema.safeParse({
			target_organization_id: 'not-a-uuid',
			relationship_type: 'consultancy'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid relationship type', () => {
		const result = createOrganizationRelationshipSchema.safeParse({
			target_organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			relationship_type: 'invalid_type'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid date format', () => {
		const result = createOrganizationRelationshipSchema.safeParse({
			target_organization_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			relationship_type: 'legal',
			valid_from: '2026/01/01'
		});
		expect(result.success).toBe(false);
	});
});

describe('updateOrganizationRelationshipSchema', () => {
	it('accepts partial update', () => {
		const result = updateOrganizationRelationshipSchema.safeParse({
			status: 'active'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object', () => {
		const result = updateOrganizationRelationshipSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects invalid status', () => {
		const result = updateOrganizationRelationshipSchema.safeParse({
			status: 'invalid'
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// ORGANIZATION SETTINGS SCHEMAS
// =============================================================================

describe('createOrganizationSettingsSchema', () => {
	it('accepts empty object (all defaults)', () => {
		const result = createOrganizationSettingsSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts full settings object', () => {
		const result = createOrganizationSettingsSchema.safeParse({
			retention_profile: 'vng_2020',
			retention_archive_years_granted: 7,
			retention_archive_years_not_granted: 5,
			retention_personal_data_years: 1,
			retention_operational_years: 1,
			anonymization_strategy: 'replace',
			auto_archive_on_contract_end: true,
			notify_retention_expired: true,
			threshold_works: 5538000,
			threshold_services_central: 143000,
			threshold_services_decentral: 221000,
			threshold_social_services: 750000,
			default_currency: 'EUR'
		});
		expect(result.success).toBe(true);
	});

	it('rejects negative retention years', () => {
		const result = createOrganizationSettingsSchema.safeParse({
			retention_archive_years_granted: -1
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid anonymization strategy', () => {
		const result = createOrganizationSettingsSchema.safeParse({
			anonymization_strategy: 'destroy'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid currency length', () => {
		const result = createOrganizationSettingsSchema.safeParse({
			default_currency: 'EURO'
		});
		expect(result.success).toBe(false);
	});

	it('rejects negative threshold', () => {
		const result = createOrganizationSettingsSchema.safeParse({
			threshold_works: -100
		});
		expect(result.success).toBe(false);
	});
});

describe('updateOrganizationSettingsSchema', () => {
	it('is identical to create schema', () => {
		expect(updateOrganizationSettingsSchema).toBe(createOrganizationSettingsSchema);
	});
});
