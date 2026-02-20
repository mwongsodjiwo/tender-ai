// Unit tests for Fase 30 — Document roles member link
// Tests migration, type updates, schema updates, API route updates

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// =============================================================================
// MIGRATION
// =============================================================================

describe('Fase 30 migration — document_roles_member_link', () => {
	const filePath = path.resolve(
		'supabase/migrations/20260220000300_document_roles_member_link.sql'
	);

	it('migration file exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('adds project_member_id column', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_member_id UUID');
	});

	it('references organization_members table', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('REFERENCES organization_members(id)');
	});

	it('uses ON DELETE SET NULL', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('ON DELETE SET NULL');
	});

	it('creates index on project_member_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('idx_project_document_roles_member');
		expect(source).toContain('project_member_id');
	});
});

// =============================================================================
// DATABASE TYPE — ProjectDocumentRole
// =============================================================================

describe('ProjectDocumentRole type — project_member_id field', () => {
	const filePath = path.resolve('src/lib/types/db/document-roles.ts');

	it('has project_member_id field', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_member_id: string | null');
	});

	it('person fields remain nullable', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('person_name: string | null');
		expect(source).toContain('person_email: string | null');
		expect(source).toContain('person_phone: string | null');
		expect(source).toContain('person_function: string | null');
	});
});

// =============================================================================
// API TYPES — Request/Response
// =============================================================================

describe('Document role API types — project_member_id', () => {
	const filePath = path.resolve('src/lib/types/api/document-roles.ts');

	it('CreateDocumentRoleRequest has optional project_member_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_member_id?: string');
	});

	it('UpdateDocumentRoleRequest has optional nullable project_member_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_member_id?: string | null');
	});

	it('DocumentRoleResponse has project_member_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_member_id: string | null');
	});
});

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

describe('Document role Zod schemas — project_member_id', () => {
	const filePath = path.resolve(
		'src/lib/server/api/validation/document-roles.ts'
	);

	it('createDocumentRoleSchema accepts project_member_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_member_id');
		expect(source).toContain('.uuid(');
	});

	it('updateDocumentRoleSchema accepts nullable project_member_id', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('.nullable()');
	});

	it('validates project_member_id as UUID', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("uuid('Ongeldig lid-ID')");
	});
});

// =============================================================================
// RESOLVE MEMBER UTILITY
// =============================================================================

describe('resolve-member utility', () => {
	const filePath = path.resolve('src/lib/server/db/resolve-member.ts');

	it('file exists', () => {
		expect(existsSync(filePath)).toBe(true);
	});

	it('exports resolveMemberPersonData function', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export async function resolveMemberPersonData');
	});

	it('exports MemberPersonData interface', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('export interface MemberPersonData');
	});

	it('queries organization_members with profiles join', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain("from('organization_members')");
		expect(source).toContain('profiles(');
	});

	it('maps first_name + last_name to person_name', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('first_name');
		expect(source).toContain('last_name');
		expect(source).toContain('person_name');
	});

	it('maps email to person_email', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('person_email: profile.email');
	});

	it('maps phone to person_phone', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('person_phone: profile.phone');
	});

	it('maps job_title to person_function', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('person_function: profile.job_title');
	});

	it('returns null when member not found', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('return null');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		const lines = source.split('\n').length;
		expect(lines).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// API ROUTES — enrichment with member data
// =============================================================================

describe('Roles POST route — member enrichment', () => {
	const filePath = path.resolve(
		'src/routes/api/projects/[id]/roles/+server.ts'
	);

	it('imports resolveMemberPersonData', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('resolveMemberPersonData');
		expect(source).toContain('resolve-member');
	});

	it('has enrichWithMemberData function', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('enrichWithMemberData');
	});

	it('calls enrichWithMemberData in POST', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('enrichWithMemberData');
	});

	it('includes project_member_id in audit log', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_member_id');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		const lines = source.split('\n').length;
		expect(lines).toBeLessThanOrEqual(200);
	});
});

describe('Roles PATCH route — member enrichment', () => {
	const filePath = path.resolve(
		'src/routes/api/projects/[id]/roles/[roleKey]/+server.ts'
	);

	it('imports resolveMemberPersonData', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('resolveMemberPersonData');
		expect(source).toContain('resolve-member');
	});

	it('has enrichWithMemberData function', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('enrichWithMemberData');
	});

	it('calls enrichWithMemberData in PATCH', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('enrichWithMemberData');
	});

	it('includes project_member_id in audit log', () => {
		const source = readFileSync(filePath, 'utf-8');
		expect(source).toContain('project_member_id');
	});

	it('is under 200 lines', () => {
		const source = readFileSync(filePath, 'utf-8');
		const lines = source.split('\n').length;
		expect(lines).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// BACKWARDS COMPATIBILITY
// =============================================================================

describe('Backwards compatibility', () => {
	it('original migration has person fields already nullable', () => {
		const origPath = path.resolve(
			'supabase/migrations/20260218002500_project_document_roles.sql'
		);
		const source = readFileSync(origPath, 'utf-8');
		// person_name TEXT (no NOT NULL) = already nullable
		expect(source).toContain('person_name TEXT');
		expect(source).not.toContain('person_name TEXT NOT NULL');
	});

	it('POST route still works without project_member_id', () => {
		const source = readFileSync(
			path.resolve('src/routes/api/projects/[id]/roles/+server.ts'),
			'utf-8'
		);
		// enrichWithMemberData returns input unchanged when no memberId
		expect(source).toContain('if (!memberId)');
		expect(source).toContain('return input');
	});

	it('PATCH route still works without project_member_id', () => {
		const source = readFileSync(
			path.resolve('src/routes/api/projects/[id]/roles/[roleKey]/+server.ts'),
			'utf-8'
		);
		expect(source).toContain('if (!memberId)');
		expect(source).toContain('return input');
	});
});
