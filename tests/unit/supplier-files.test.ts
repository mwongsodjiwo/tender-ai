// Unit tests for Fase 8 — Supplier file verification (migrations, types, routes, validation)

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// =============================================================================
// MIGRATION FILE VERIFICATION
// =============================================================================

describe('Supplier enum migration', () => {
	const filePath = path.resolve(
		'supabase/migrations/20260218001100_supplier_enums.sql'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('creates supplier_project_status enum', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CREATE TYPE supplier_project_status');
		expect(source).toContain('prospect');
		expect(source).toContain('gecontracteerd');
	});

	it('creates supplier_project_role enum', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CREATE TYPE supplier_project_role');
		expect(source).toContain('genodigde');
		expect(source).toContain('contractpartij');
	});
});

describe('Suppliers table migration', () => {
	const filePath = path.resolve(
		'supabase/migrations/20260218001200_suppliers.sql'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('creates suppliers table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CREATE TABLE suppliers');
	});

	it('has organization_id FK', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('REFERENCES organizations(id)');
	});

	it('has governance fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('data_classification');
		expect(source).toContain('retention_until');
		expect(source).toContain('archive_status');
	});

	it('enables RLS', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ENABLE ROW LEVEL SECURITY');
	});

	it('has indexes', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('idx_suppliers_org');
		expect(source).toContain('idx_suppliers_kvk');
		expect(source).toContain('idx_suppliers_name');
	});

	it('has superadmin bypass in RLS', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('is_superadmin');
	});
});

describe('Supplier contacts migration', () => {
	const filePath = path.resolve(
		'supabase/migrations/20260218001300_supplier_contacts.sql'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('creates supplier_contacts table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CREATE TABLE supplier_contacts');
	});

	it('has FK to suppliers', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('REFERENCES suppliers(id)');
	});

	it('enables RLS', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ENABLE ROW LEVEL SECURITY');
	});
});

describe('Project suppliers migration', () => {
	const filePath = path.resolve(
		'supabase/migrations/20260218001400_project_suppliers.sql'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('creates project_suppliers table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CREATE TABLE project_suppliers');
	});

	it('has unique constraint', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UNIQUE(project_id, supplier_id)');
	});

	it('has status and role columns', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('supplier_project_status');
		expect(source).toContain('supplier_project_role');
	});

	it('enables RLS', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ENABLE ROW LEVEL SECURITY');
	});

	it('has indexes', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('idx_project_suppliers_project');
		expect(source).toContain('idx_project_suppliers_supplier');
		expect(source).toContain('idx_project_suppliers_status');
	});
});

// =============================================================================
// TYPE FILE VERIFICATION
// =============================================================================

describe('Supplier database types', () => {
	const source = readFileSync(
		path.resolve('src/lib/types/db/suppliers.ts'), 'utf-8'
	);

	it('exports Supplier interface', () => {
		expect(source).toContain('export interface Supplier');
	});

	it('exports SupplierContact interface', () => {
		expect(source).toContain('export interface SupplierContact');
	});

	it('exports ProjectSupplier interface', () => {
		expect(source).toContain('export interface ProjectSupplier');
	});
});

describe('Supplier API types', () => {
	const source = readFileSync(
		path.resolve('src/lib/types/api/suppliers.ts'), 'utf-8'
	);

	it('exports CreateSupplierRequest', () => {
		expect(source).toContain('export interface CreateSupplierRequest');
	});

	it('exports UpdateSupplierRequest', () => {
		expect(source).toContain('export interface UpdateSupplierRequest');
	});

	it('exports CreateSupplierContactRequest', () => {
		expect(source).toContain('export interface CreateSupplierContactRequest');
	});

	it('exports LinkProjectSupplierRequest', () => {
		expect(source).toContain('export interface LinkProjectSupplierRequest');
	});

	it('exports UpdateProjectSupplierRequest', () => {
		expect(source).toContain('export interface UpdateProjectSupplierRequest');
	});

	it('exports SupplierDetailResponse', () => {
		expect(source).toContain('export interface SupplierDetailResponse');
	});
});

describe('Supplier enums in enums-multi-org', () => {
	const source = readFileSync(
		path.resolve('src/lib/types/enums-multi-org.ts'), 'utf-8'
	);

	it('exports SUPPLIER_PROJECT_STATUSES', () => {
		expect(source).toContain('export const SUPPLIER_PROJECT_STATUSES');
	});

	it('exports SupplierProjectStatus type', () => {
		expect(source).toContain('export type SupplierProjectStatus');
	});

	it('exports SUPPLIER_PROJECT_ROLES', () => {
		expect(source).toContain('export const SUPPLIER_PROJECT_ROLES');
	});

	it('exports SupplierProjectRole type', () => {
		expect(source).toContain('export type SupplierProjectRole');
	});

	it('exports SUPPLIER_PROJECT_STATUS_LABELS', () => {
		expect(source).toContain('export const SUPPLIER_PROJECT_STATUS_LABELS');
	});

	it('exports SUPPLIER_PROJECT_ROLE_LABELS', () => {
		expect(source).toContain('export const SUPPLIER_PROJECT_ROLE_LABELS');
	});
});

// =============================================================================
// ROUTE FILE VERIFICATION
// =============================================================================

describe('Supplier list/create route', () => {
	const source = readFileSync(
		path.resolve('src/routes/api/suppliers/+server.ts'), 'utf-8'
	);

	it('exports GET handler', () => {
		expect(source).toContain('export const GET');
	});

	it('exports POST handler', () => {
		expect(source).toContain('export const POST');
	});

	it('uses createSupplierSchema', () => {
		expect(source).toContain('createSupplierSchema');
	});

	it('requires authentication', () => {
		expect(source).toContain('UNAUTHORIZED');
	});

	it('uses logAudit', () => {
		expect(source).toContain('logAudit');
	});
});

describe('Supplier detail route', () => {
	const source = readFileSync(
		path.resolve('src/routes/api/suppliers/[id]/+server.ts'), 'utf-8'
	);

	it('exports GET handler', () => {
		expect(source).toContain('export const GET');
	});

	it('exports PATCH handler', () => {
		expect(source).toContain('export const PATCH');
	});

	it('exports DELETE handler', () => {
		expect(source).toContain('export const DELETE');
	});

	it('uses updateSupplierSchema', () => {
		expect(source).toContain('updateSupplierSchema');
	});

	it('handles soft delete', () => {
		expect(source).toContain('deleted_at');
	});

	it('fetches contacts in GET', () => {
		expect(source).toContain('supplier_contacts');
	});
});

describe('Supplier contacts route', () => {
	const source = readFileSync(
		path.resolve('src/routes/api/suppliers/[id]/contacts/+server.ts'), 'utf-8'
	);

	it('exports POST handler', () => {
		expect(source).toContain('export const POST');
	});

	it('uses createSupplierContactSchema', () => {
		expect(source).toContain('createSupplierContactSchema');
	});

	it('verifies supplier exists', () => {
		expect(source).toContain('Leverancier niet gevonden');
	});
});

describe('Project suppliers route', () => {
	const source = readFileSync(
		path.resolve('src/routes/api/projects/[id]/suppliers/+server.ts'), 'utf-8'
	);

	it('exports GET handler', () => {
		expect(source).toContain('export const GET');
	});

	it('exports POST handler', () => {
		expect(source).toContain('export const POST');
	});

	it('uses linkProjectSupplierSchema', () => {
		expect(source).toContain('linkProjectSupplierSchema');
	});

	it('handles duplicate link', () => {
		expect(source).toContain('DUPLICATE');
	});
});

describe('Project supplier update route', () => {
	const source = readFileSync(
		path.resolve(
			'src/routes/api/projects/[id]/suppliers/[supplierId]/+server.ts'
		),
		'utf-8'
	);

	it('exports PATCH handler', () => {
		expect(source).toContain('export const PATCH');
	});

	it('uses updateProjectSupplierSchema', () => {
		expect(source).toContain('updateProjectSupplierSchema');
	});

	it('filters by project and supplier', () => {
		expect(source).toContain('params.id');
		expect(source).toContain('params.supplierId');
	});
});

// =============================================================================
// VALIDATION FILE VERIFICATION
// =============================================================================

describe('Supplier validation file', () => {
	const source = readFileSync(
		path.resolve('src/lib/server/api/validation/suppliers.ts'), 'utf-8'
	);

	it('exports createSupplierSchema', () => {
		expect(source).toContain('export const createSupplierSchema');
	});

	it('exports updateSupplierSchema', () => {
		expect(source).toContain('export const updateSupplierSchema');
	});

	it('exports createSupplierContactSchema', () => {
		expect(source).toContain('export const createSupplierContactSchema');
	});

	it('exports linkProjectSupplierSchema', () => {
		expect(source).toContain('export const linkProjectSupplierSchema');
	});

	it('exports updateProjectSupplierSchema', () => {
		expect(source).toContain('export const updateProjectSupplierSchema');
	});

	it('exports supplierSearchQuerySchema', () => {
		expect(source).toContain('export const supplierSearchQuerySchema');
	});

	it('imports SUPPLIER_PROJECT_STATUSES', () => {
		expect(source).toContain('SUPPLIER_PROJECT_STATUSES');
	});

	it('imports SUPPLIER_PROJECT_ROLES', () => {
		expect(source).toContain('SUPPLIER_PROJECT_ROLES');
	});
});
