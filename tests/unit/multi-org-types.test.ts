// Unit tests for v2 Fase 1 — Multi-org type shapes and enum values

import { describe, it, expect } from 'vitest';
import type {
	Organization,
	OrganizationMember,
	OrganizationRelationship,
	OrganizationSettings,
	RetentionProfile
} from '../../src/lib/types/database';
import {
	ORGANIZATION_TYPES,
	CONTRACTING_AUTHORITY_TYPES,
	ORGANIZATION_RELATIONSHIP_TYPES,
	RELATIONSHIP_STATUSES,
	DATA_CLASSIFICATIONS,
	ARCHIVE_STATUSES,
	ANONYMIZATION_STRATEGIES,
	ORGANIZATION_ROLES
} from '../../src/lib/types/enums';

// =============================================================================
// NEW ENUM VALUES
// =============================================================================

describe('Multi-org enums', () => {
	it('has correct organization types', () => {
		expect(ORGANIZATION_TYPES).toEqual(['client', 'consultancy', 'government']);
	});

	it('has correct contracting authority types', () => {
		expect(CONTRACTING_AUTHORITY_TYPES).toEqual(['centraal', 'decentraal']);
	});

	it('has correct relationship types', () => {
		expect(ORGANIZATION_RELATIONSHIP_TYPES).toEqual([
			'consultancy', 'audit', 'legal', 'other'
		]);
	});

	it('has correct relationship statuses', () => {
		expect(RELATIONSHIP_STATUSES).toEqual(['active', 'inactive', 'pending']);
	});

	it('has correct data classifications', () => {
		expect(DATA_CLASSIFICATIONS).toEqual(['archive', 'personal', 'operational']);
	});

	it('has correct archive statuses', () => {
		expect(ARCHIVE_STATUSES).toEqual([
			'active', 'archived', 'retention_expired', 'anonymized', 'destroyed'
		]);
	});

	it('has correct anonymization strategies', () => {
		expect(ANONYMIZATION_STRATEGIES).toEqual(['replace', 'remove']);
	});

	it('organization roles include external_advisor and auditor', () => {
		expect(ORGANIZATION_ROLES).toContain('external_advisor');
		expect(ORGANIZATION_ROLES).toContain('auditor');
	});
});

// =============================================================================
// ORGANIZATION — EXTENDED INTERFACE
// =============================================================================

describe('Organization interface — v2 extensions', () => {
	it('includes multi-org fields', () => {
		const org: Partial<Organization> = {
			id: '123',
			name: 'Test Org',
			parent_organization_id: null,
			organization_type: 'client',
			aanbestedende_dienst_type: null
		};
		expect(org.organization_type).toBe('client');
		expect(org.parent_organization_id).toBeNull();
	});

	it('allows government org with authority type', () => {
		const gov: Partial<Organization> = {
			organization_type: 'government',
			aanbestedende_dienst_type: 'decentraal'
		};
		expect(gov.aanbestedende_dienst_type).toBe('decentraal');
	});

	it('allows parent organization reference', () => {
		const child: Partial<Organization> = {
			parent_organization_id: 'parent-uuid'
		};
		expect(typeof child.parent_organization_id).toBe('string');
	});
});

// =============================================================================
// ORGANIZATION MEMBER — EXTENDED
// =============================================================================

describe('OrganizationMember interface — v2 extensions', () => {
	it('includes source_organization_id for external members', () => {
		const member: Partial<OrganizationMember> = {
			role: 'external_advisor',
			source_organization_id: 'source-org-uuid'
		};
		expect(member.source_organization_id).toBe('source-org-uuid');
	});

	it('allows null source_organization_id for internal members', () => {
		const member: Partial<OrganizationMember> = {
			role: 'member',
			source_organization_id: null
		};
		expect(member.source_organization_id).toBeNull();
	});
});

// =============================================================================
// ORGANIZATION RELATIONSHIP
// =============================================================================

describe('OrganizationRelationship interface', () => {
	it('has correct shape', () => {
		const rel: OrganizationRelationship = {
			id: 'rel-id',
			source_organization_id: 'org-a',
			target_organization_id: 'org-b',
			relationship_type: 'consultancy',
			status: 'active',
			contract_reference: 'VO-2026-001',
			valid_from: '2026-01-01',
			valid_until: null,
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z'
		};
		expect(rel.relationship_type).toBe('consultancy');
		expect(rel.status).toBe('active');
	});

	it('allows nullable date fields', () => {
		const rel: Partial<OrganizationRelationship> = {
			valid_from: null,
			valid_until: null,
			contract_reference: null
		};
		expect(rel.valid_from).toBeNull();
	});
});

// =============================================================================
// ORGANIZATION SETTINGS
// =============================================================================

describe('OrganizationSettings interface', () => {
	it('has correct shape with defaults', () => {
		const settings: OrganizationSettings = {
			id: 'settings-id',
			organization_id: 'org-id',
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
			default_currency: 'EUR',
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z'
		};
		expect(settings.retention_profile).toBe('vng_2020');
		expect(settings.threshold_works).toBe(5538000);
	});
});

// =============================================================================
// RETENTION PROFILE
// =============================================================================

describe('RetentionProfile interface', () => {
	it('has correct shape', () => {
		const profile: RetentionProfile = {
			id: 'vng_2020',
			name: 'VNG Selectielijst 2020',
			description: 'Standaard voor gemeenten',
			source: 'VNG',
			archive_years_granted: 7,
			archive_years_not_granted: 5,
			personal_data_years: 1,
			operational_years: 1,
			created_at: '2026-01-01T00:00:00Z'
		};
		expect(profile.archive_years_granted).toBe(7);
	});

	it('allows nullable description and source', () => {
		const profile: Partial<RetentionProfile> = {
			description: null,
			source: null
		};
		expect(profile.description).toBeNull();
	});
});
