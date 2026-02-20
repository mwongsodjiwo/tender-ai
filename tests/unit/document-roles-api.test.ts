// Unit tests for Fase 19 — Document roles (project_document_roles)

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// =============================================================================
// MIGRATION
// =============================================================================

describe('Document roles migration', () => {
	const filePath = path.resolve(
		'supabase/migrations/20260218002500_project_document_roles.sql'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('creates project_document_roles table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('CREATE TABLE project_document_roles');
	});

	it('has id UUID primary key', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
	});

	it('references projects table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('REFERENCES projects(id)');
		expect(source).toContain('ON DELETE CASCADE');
	});

	it('has role_key and role_label', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('role_key TEXT NOT NULL');
		expect(source).toContain('role_label TEXT NOT NULL');
	});

	it('has person fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('person_name TEXT');
		expect(source).toContain('person_email TEXT');
		expect(source).toContain('person_phone TEXT');
		expect(source).toContain('person_function TEXT');
	});

	it('has governance fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('data_classification');
		expect(source).toContain('retention_until');
		expect(source).toContain('anonymized_at');
		expect(source).toContain('archive_status');
	});

	it('has timestamps', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('created_at TIMESTAMPTZ DEFAULT now()');
		expect(source).toContain('updated_at TIMESTAMPTZ DEFAULT now()');
	});

	it('has unique constraint on project_id + role_key', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UNIQUE(project_id, role_key)');
	});

	it('has index on project_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('idx_project_document_roles_project');
	});

	it('has updated_at trigger', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('set_updated_at_project_document_roles');
		expect(source).toContain('update_updated_at()');
	});

	it('has RLS enabled', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ENABLE ROW LEVEL SECURITY');
	});

	it('has RLS policies for CRUD', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_document_roles_select');
		expect(source).toContain('project_document_roles_insert');
		expect(source).toContain('project_document_roles_update');
		expect(source).toContain('project_document_roles_delete');
	});

	it('RLS policies check organization membership', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('organization_members');
		expect(source).toContain('auth.uid()');
	});
});

// =============================================================================
// TYPES — Database
// =============================================================================

describe('ProjectDocumentRole database type', () => {
	const filePath = path.resolve('src/lib/types/db/document-roles.ts');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports ProjectDocumentRole interface', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface ProjectDocumentRole');
	});

	it('has all required fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('id: string');
		expect(source).toContain('project_id: string');
		expect(source).toContain('role_key: DocumentRoleKey');
		expect(source).toContain('role_label: string');
		expect(source).toContain('person_name: string | null');
		expect(source).toContain('person_email: string | null');
		expect(source).toContain('person_phone: string | null');
		expect(source).toContain('person_function: string | null');
	});

	it('has governance fields', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('data_classification: DataClassification');
		expect(source).toContain('retention_until: string | null');
		expect(source).toContain('anonymized_at: string | null');
		expect(source).toContain('archive_status: ArchiveStatus');
	});

	it('imports DocumentRoleKey type', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('DocumentRoleKey');
	});
});

describe('Document roles type barrel export', () => {
	const filePath = path.resolve('src/lib/types/db/index.ts');

	it('re-exports document-roles', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("'./document-roles.js'");
	});
});

// =============================================================================
// TYPES — API
// =============================================================================

describe('Document roles API types', () => {
	const filePath = path.resolve('src/lib/types/api/document-roles.ts');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports CreateDocumentRoleRequest', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface CreateDocumentRoleRequest');
	});

	it('exports UpdateDocumentRoleRequest', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface UpdateDocumentRoleRequest');
	});

	it('exports DocumentRoleResponse', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface DocumentRoleResponse');
	});

	it('imports DocumentRoleKey', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('DocumentRoleKey');
	});
});

describe('Document roles API type barrel export', () => {
	const filePath = path.resolve('src/lib/types/api/index.ts');

	it('re-exports document-roles', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("'./document-roles.js'");
	});
});

// =============================================================================
// ENUMS
// =============================================================================

describe('Document role key enums', () => {
	const filePath = path.resolve('src/lib/types/enums-multi-org.ts');

	it('has DOCUMENT_ROLE_KEYS', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('DOCUMENT_ROLE_KEYS');
		expect(source).toContain("'contactpersoon'");
		expect(source).toContain("'inkoper'");
		expect(source).toContain("'projectleider'");
		expect(source).toContain("'budgethouder'");
		expect(source).toContain("'juridisch_adviseur'");
	});

	it('has DocumentRoleKey type', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export type DocumentRoleKey');
	});

	it('has Dutch labels', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('DOCUMENT_ROLE_LABELS');
		expect(source).toContain('Contactpersoon');
		expect(source).toContain('Inkoper');
		expect(source).toContain('Projectleider');
		expect(source).toContain('Budgethouder');
		expect(source).toContain('Juridisch adviseur');
	});
});

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

describe('Document role validation schemas', () => {
	const filePath = path.resolve('src/lib/server/api/validation/document-roles.ts');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports createDocumentRoleSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('createDocumentRoleSchema');
		expect(source).toContain('role_key');
		expect(source).toContain('role_label');
	});

	it('exports updateDocumentRoleSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('updateDocumentRoleSchema');
		expect(source).toContain('person_name');
		expect(source).toContain('person_email');
	});

	it('validates role_key against DOCUMENT_ROLE_KEYS', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('DOCUMENT_ROLE_KEYS');
	});

	it('validates email format', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('.email(');
	});

	it('has Dutch error messages', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('Ongeldige rolsleutel');
		expect(source).toContain('Rollabel is verplicht');
		expect(source).toContain('Ongeldig e-mailadres');
	});
});

describe('Validation barrel export', () => {
	const filePath = path.resolve('src/lib/server/api/validation/index.ts');

	it('re-exports document-roles', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("'./document-roles.js'");
	});
});

// =============================================================================
// API ROUTES
// =============================================================================

describe('Roles list API route (GET + POST)', () => {
	const filePath = path.resolve(
		'src/routes/api/projects/[id]/roles/+server.ts'
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

	it('queries project_document_roles table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('project_document_roles')");
	});

	it('filters by project_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("eq('project_id'");
	});

	it('orders by role_key', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("order('role_key')");
	});

	it('validates with createDocumentRoleSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('createDocumentRoleSchema');
	});

	it('uses upsert for create/update on conflict', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('upsert');
		expect(source).toContain('onConflict');
	});

	it('has auth guard', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UNAUTHORIZED');
	});

	it('has audit logging', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('logAudit');
		expect(source).toContain('document_role');
	});
});

describe('Role detail API route (PATCH)', () => {
	const filePath = path.resolve(
		'src/routes/api/projects/[id]/roles/[roleKey]/+server.ts'
	);

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports PATCH handler', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export const PATCH');
	});

	it('validates with updateDocumentRoleSchema', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('updateDocumentRoleSchema');
	});

	it('filters by project_id and role_key', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("eq('project_id'");
		expect(source).toContain("eq('role_key'");
	});

	it('has auth guard', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('UNAUTHORIZED');
	});

	it('has audit logging', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('logAudit');
		expect(source).toContain('document_role');
	});
});

// =============================================================================
// TEMPLATE DATA INTEGRATION
// =============================================================================

describe('Template data — document role placeholders', () => {
	const filePath = path.resolve('src/lib/server/templates/template-data.ts');

	it('has contactpersoon placeholders', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('contactpersoon_naam');
		expect(source).toContain('contactpersoon_email');
		expect(source).toContain('contactpersoon_tel');
		expect(source).toContain('contactpersoon_functie');
	});

	it('has inkoper placeholders', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('inkoper_naam');
		expect(source).toContain('inkoper_email');
		expect(source).toContain('inkoper_tel');
		expect(source).toContain('inkoper_functie');
	});

	it('has projectleider placeholders', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('projectleider_naam');
		expect(source).toContain('projectleider_email');
		expect(source).toContain('projectleider_tel');
		expect(source).toContain('projectleider_functie');
	});

	it('has budgethouder placeholders', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('budgethouder_naam');
		expect(source).toContain('budgethouder_email');
		expect(source).toContain('budgethouder_tel');
		expect(source).toContain('budgethouder_functie');
	});

	it('has juridisch_adviseur placeholders', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('juridisch_adviseur_naam');
		expect(source).toContain('juridisch_adviseur_email');
		expect(source).toContain('juridisch_adviseur_tel');
		expect(source).toContain('juridisch_adviseur_functie');
	});
});

describe('Data collector — document roles integration', () => {
	const collectorPath = path.resolve('src/lib/server/templates/data-collector.ts');
	const fillerPath = path.resolve('src/lib/server/templates/role-data-filler.ts');

	it('imports fillDocumentRoles from role-data-filler', () => {
		const source = readFileSync(collectorPath, 'utf-8');
		expect(source).toContain('fillDocumentRoles');
		expect(source).toContain('role-data-filler');
	});

	it('calls fillDocumentRoles in Promise.all', () => {
		const source = readFileSync(collectorPath, 'utf-8');
		expect(source).toContain('fillDocumentRoles(supabase, projectId, data)');
	});

	it('role-data-filler exists', () => {
		expect(existsSync(fillerPath)).toBe(true);
	});

	it('role-data-filler queries project_document_roles table', () => {
		const source = readFileSync(fillerPath, 'utf-8');
		expect(source).toContain("from('project_document_roles')");
	});

	it('role-data-filler maps role_key to template placeholders', () => {
		const source = readFileSync(fillerPath, 'utf-8');
		expect(source).toContain('ROLE_FIELD_MAP');
		expect(source).toContain('contactpersoon');
		expect(source).toContain('inkoper');
		expect(source).toContain('projectleider');
		expect(source).toContain('budgethouder');
		expect(source).toContain('juridisch_adviseur');
	});

	it('data-collector is under 200 lines', () => {
		const source = readFileSync(collectorPath, 'utf-8');
		const lines = source.split('\n').length;
		expect(lines).toBeLessThanOrEqual(200);
	});

	it('role-data-filler is under 200 lines', () => {
		const source = readFileSync(fillerPath, 'utf-8');
		const lines = source.split('\n').length;
		expect(lines).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// UI COMPONENT — DrawerDocumentRoles (Fase 31/37: moved to team drawer)
// =============================================================================

describe('DrawerDocumentRoles component', () => {
	const filePath = path.resolve('src/lib/components/team/DrawerDocumentRoles.svelte');

	it('exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('imports ProjectDocumentRole type', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ProjectDocumentRole');
	});
});

// =============================================================================
// PROFILE PAGE — Fase 37 cleanup: document roles removed from profile
// =============================================================================

describe('Profile page server — no longer loads document roles', () => {
	const filePath = path.resolve(
		'src/routes/(app)/projects/[id]/profile/+page.server.ts'
	);

	it('does not import ProjectDocumentRole', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).not.toContain('ProjectDocumentRole');
	});

	it('does not query project_document_roles table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).not.toContain("from('project_document_roles')");
	});

	it('does not return documentRoles in load data', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).not.toContain('documentRoles');
	});
});

describe('Profile page — document roles tab removed', () => {
	const filePath = path.resolve(
		'src/routes/(app)/projects/[id]/profile/+page.svelte'
	);

	it('does not import DocumentRoles component', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).not.toContain("import DocumentRoles from");
	});

	it('does not have rollen tab', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).not.toContain("id: 'rollen'");
	});

	it('does not reference documentRoles data', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).not.toContain('documentRoles');
	});
});

describe('Old DocumentRoles component removed', () => {
	const filePath = path.resolve('src/lib/components/DocumentRoles.svelte');

	it('no longer exists (moved to team drawer)', () => {
		expect(existsSync(filePath)).toBe(false);
	});
});
