// Unit tests for Fase 11 — Organization settings API file verification

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// =============================================================================
// SETTINGS API ROUTE
// =============================================================================

describe('Settings API route', () => {
	const filePath = path.resolve(
		'src/routes/api/organizations/[id]/settings/+server.ts'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports GET handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const GET');
	});

	it('exports PATCH handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const PATCH');
	});

	it('queries organization_settings table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('organization_settings')");
	});

	it('filters by organization_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("eq('organization_id'");
	});

	it('validates with updateOrganizationSettingsSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('updateOrganizationSettingsSchema');
	});

	it('has auth guard', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UNAUTHORIZED');
	});

	it('has audit logging', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('logAudit');
		expect(source).toContain('organization_settings');
	});

	it('supports upsert (insert or update)', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('.insert(');
		expect(source).toContain('.update(');
	});
});

// =============================================================================
// RELATIONSHIPS LIST API ROUTE
// =============================================================================

describe('Relationships list API route', () => {
	const filePath = path.resolve(
		'src/routes/api/organizations/[id]/relationships/+server.ts'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports GET handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const GET');
	});

	it('exports POST handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const POST');
	});

	it('queries organization_relationships table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('organization_relationships')");
	});

	it('filters by source or target org', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('source_organization_id');
		expect(source).toContain('target_organization_id');
	});

	it('validates with createOrganizationRelationshipSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('createOrganizationRelationshipSchema');
	});

	it('has auth guard', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UNAUTHORIZED');
	});

	it('has audit logging', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('logAudit');
		expect(source).toContain('organization_relationship');
	});

	it('handles duplicate constraint', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('23505');
		expect(source).toContain('DUPLICATE');
	});
});

// =============================================================================
// RELATIONSHIP DETAIL API ROUTE
// =============================================================================

describe('Relationship detail API route', () => {
	const filePath = path.resolve(
		'src/routes/api/organizations/[id]/relationships/[relId]/+server.ts'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports PATCH handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const PATCH');
	});

	it('validates with updateOrganizationRelationshipSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('updateOrganizationRelationshipSchema');
	});

	it('has audit logging', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('logAudit');
	});

	it('has auth guard', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UNAUTHORIZED');
	});
});

// =============================================================================
// RETENTION PROFILES API ROUTE
// =============================================================================

describe('Retention profiles API route', () => {
	const filePath = path.resolve(
		'src/routes/api/retention-profiles/+server.ts'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports GET handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const GET');
	});

	it('queries retention_profiles table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('retention_profiles')");
	});

	it('orders by name', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("order('name')");
	});

	it('has auth guard', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UNAUTHORIZED');
	});
});

// =============================================================================
// EXISTING TYPES — verify they exist
// =============================================================================

describe('OrganizationSettings database type', () => {
	const filePath = path.resolve('src/lib/types/db/multi-org.ts');

	it('exports OrganizationSettings interface', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface OrganizationSettings');
	});

	it('has retention fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('retention_profile: string');
		expect(source).toContain('retention_archive_years_granted: number');
		expect(source).toContain('retention_archive_years_not_granted: number');
	});

	it('has threshold fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('threshold_works: number');
		expect(source).toContain('threshold_services_central: number');
		expect(source).toContain('threshold_services_decentral: number');
		expect(source).toContain('threshold_social_services: number');
	});

	it('has anonymization field', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('anonymization_strategy: AnonymizationStrategy');
	});
});

describe('OrganizationRelationship database type', () => {
	const filePath = path.resolve('src/lib/types/db/multi-org.ts');

	it('exports OrganizationRelationship interface', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface OrganizationRelationship');
	});

	it('has source and target org fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('source_organization_id: string');
		expect(source).toContain('target_organization_id: string');
	});

	it('has relationship_type field', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('relationship_type: OrganizationRelationshipType');
	});

	it('has contract_reference field', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('contract_reference: string | null');
	});
});

describe('RetentionProfile database type', () => {
	const filePath = path.resolve('src/lib/types/db/multi-org.ts');

	it('exports RetentionProfile interface', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface RetentionProfile');
	});

	it('has archive years fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('archive_years_granted: number');
		expect(source).toContain('archive_years_not_granted: number');
	});
});

// =============================================================================
// API TYPES
// =============================================================================

describe('Organization settings API types', () => {
	const filePath = path.resolve('src/lib/types/api/multi-org.ts');

	it('exports CreateOrganizationSettingsRequest', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface CreateOrganizationSettingsRequest');
	});

	it('exports UpdateOrganizationSettingsRequest', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UpdateOrganizationSettingsRequest');
	});

	it('exports CreateOrganizationRelationshipRequest', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface CreateOrganizationRelationshipRequest');
	});

	it('exports UpdateOrganizationRelationshipRequest', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface UpdateOrganizationRelationshipRequest');
	});
});

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

describe('Organization settings validation schemas', () => {
	const filePath = path.resolve('src/lib/server/api/validation/multi-org.ts');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports createOrganizationSettingsSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('createOrganizationSettingsSchema');
	});

	it('exports updateOrganizationSettingsSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('updateOrganizationSettingsSchema');
	});

	it('exports createOrganizationRelationshipSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('createOrganizationRelationshipSchema');
	});

	it('exports updateOrganizationRelationshipSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('updateOrganizationRelationshipSchema');
	});

	it('validates anonymization strategy', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ANONYMIZATION_STRATEGIES');
	});

	it('validates relationship types', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ORGANIZATION_RELATIONSHIP_TYPES');
	});

	it('validates relationship statuses', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('RELATIONSHIP_STATUSES');
	});
});

// =============================================================================
// ENUMS
// =============================================================================

describe('Multi-org enums for settings', () => {
	const filePath = path.resolve('src/lib/types/enums-multi-org.ts');

	it('has ORGANIZATION_TYPES', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ORGANIZATION_TYPES');
		expect(source).toContain("'client'");
		expect(source).toContain("'consultancy'");
		expect(source).toContain("'government'");
	});

	it('has CONTRACTING_AUTHORITY_TYPES', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CONTRACTING_AUTHORITY_TYPES');
		expect(source).toContain("'centraal'");
		expect(source).toContain("'decentraal'");
	});

	it('has ORGANIZATION_RELATIONSHIP_TYPES', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ORGANIZATION_RELATIONSHIP_TYPES');
		expect(source).toContain("'consultancy'");
		expect(source).toContain("'audit'");
		expect(source).toContain("'legal'");
	});

	it('has RELATIONSHIP_STATUSES', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('RELATIONSHIP_STATUSES');
		expect(source).toContain("'active'");
		expect(source).toContain("'inactive'");
		expect(source).toContain("'pending'");
	});

	it('has ANONYMIZATION_STRATEGIES', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ANONYMIZATION_STRATEGIES');
		expect(source).toContain("'replace'");
		expect(source).toContain("'remove'");
	});

	it('has Dutch labels for org types', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ORGANIZATION_TYPE_LABELS');
		expect(source).toContain('Klant');
		expect(source).toContain('Adviesbureau');
		expect(source).toContain('Overheidsinstelling');
	});

	it('has Dutch labels for authority types', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CONTRACTING_AUTHORITY_TYPE_LABELS');
		expect(source).toContain('Centrale overheid');
		expect(source).toContain('Decentrale overheid');
	});

	it('has Dutch labels for relationship types', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ORGANIZATION_RELATIONSHIP_TYPE_LABELS');
		expect(source).toContain('Advies');
		expect(source).toContain('Controle');
		expect(source).toContain('Juridisch');
	});

	it('has Dutch labels for relationship statuses', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('RELATIONSHIP_STATUS_LABELS');
		expect(source).toContain('Actief');
		expect(source).toContain('Inactief');
		expect(source).toContain('In afwachting');
	});
});
