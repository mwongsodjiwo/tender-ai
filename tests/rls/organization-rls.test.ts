// RLS tests for v2 Fase 2 — Multi-org rechtenmodel
// Validates RLS policy SQL structure and expected access patterns.
// These tests parse the migration SQL to verify all policies exist
// and follow the correct permission model.

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// =============================================================================
// HELPERS — read migration SQL files
// =============================================================================

const MIGRATIONS_DIR = join(__dirname, '../../supabase/migrations');

function readMigration(filename: string): string {
	return readFileSync(join(MIGRATIONS_DIR, filename), 'utf-8');
}

// =============================================================================
// MIGRATION SQL CONTENT
// =============================================================================

let initialSchema: string;
let superadminMigration: string;
let fixOrgMembersRls: string;
let orgRelationships: string;
let orgSettings: string;
let extendOrgMembers: string;
let multiorgRls: string;

beforeAll(() => {
	initialSchema = readMigration('00001_initial_schema.sql');
	superadminMigration = readMigration('00005_superadmin.sql');
	fixOrgMembersRls = readMigration('20260208000100_fix_org_members_rls.sql');
	orgRelationships = readMigration('20260218000300_organization_relationships.sql');
	orgSettings = readMigration('20260218000400_organization_settings.sql');
	extendOrgMembers = readMigration('20260218000600_extend_organization_members.sql');
	multiorgRls = readMigration('20260218000700_multiorg_rls_policies.sql');
});

// =============================================================================
// 1. SUPERADMIN BYPASS IN HELPER FUNCTIONS
// =============================================================================

describe('Superadmin bypass in helper functions', () => {
	it('is_superadmin() function exists', () => {
		expect(superadminMigration).toContain('CREATE OR REPLACE FUNCTION is_superadmin()');
		expect(superadminMigration).toContain('SECURITY DEFINER');
	});

	it('is_org_member() includes superadmin bypass', () => {
		expect(multiorgRls).toContain('CREATE OR REPLACE FUNCTION is_org_member');
		// The function body should check is_superadmin() first
		const fnMatch = multiorgRls.match(
			/FUNCTION is_org_member[\s\S]*?RETURN is_superadmin\(\) OR EXISTS/
		);
		expect(fnMatch).not.toBeNull();
	});

	it('is_org_admin() includes superadmin bypass', () => {
		expect(multiorgRls).toContain('CREATE OR REPLACE FUNCTION is_org_admin');
		const fnMatch = multiorgRls.match(
			/FUNCTION is_org_admin[\s\S]*?RETURN is_superadmin\(\) OR EXISTS/
		);
		expect(fnMatch).not.toBeNull();
	});

	it('is_project_member() includes superadmin bypass', () => {
		expect(multiorgRls).toContain('CREATE OR REPLACE FUNCTION is_project_member');
		const fnMatch = multiorgRls.match(
			/FUNCTION is_project_member[\s\S]*?RETURN is_superadmin\(\) OR EXISTS/
		);
		expect(fnMatch).not.toBeNull();
	});

	it('get_org_role() helper function exists', () => {
		expect(multiorgRls).toContain('CREATE OR REPLACE FUNCTION get_org_role');
		expect(multiorgRls).toContain('SECURITY DEFINER');
	});
});

// =============================================================================
// 2. ORGANIZATIONS RLS
// =============================================================================

describe('Organizations RLS policies', () => {
	it('organizations SELECT includes superadmin bypass', () => {
		// From 00005_superadmin.sql
		expect(superadminMigration).toContain('organizations_select ON organizations');
		expect(superadminMigration).toContain('OR is_superadmin()');
	});

	it('organizations INSERT is restricted to superadmin', () => {
		expect(superadminMigration).toContain('organizations_insert ON organizations');
		expect(superadminMigration).toMatch(
			/organizations_insert[\s\S]*?WITH CHECK \(is_superadmin\(\)\)/
		);
	});

	it('organizations UPDATE is restricted to superadmin', () => {
		expect(superadminMigration).toContain('organizations_update ON organizations');
		expect(superadminMigration).toMatch(
			/organizations_update[\s\S]*?USING \(is_superadmin\(\)\)/
		);
	});

	it('organizations has RLS enabled', () => {
		expect(initialSchema).toContain(
			'ALTER TABLE organizations ENABLE ROW LEVEL SECURITY'
		);
	});
});

// =============================================================================
// 3. ORGANIZATION RELATIONSHIPS RLS
// =============================================================================

describe('Organization relationships RLS policies', () => {
	it('drops old Dutch-named policies', () => {
		expect(multiorgRls).toContain(
			'DROP POLICY IF EXISTS "Relaties zichtbaar voor betrokken org leden"'
		);
		expect(multiorgRls).toContain(
			'DROP POLICY IF EXISTS "Relaties beheerbaar door owner/admin"'
		);
	});

	it('SELECT policy allows source/target org members + superadmin', () => {
		expect(multiorgRls).toContain('org_rel_select ON organization_relationships');
		// Must contain superadmin check
		const selectPolicy = multiorgRls.match(
			/org_rel_select[\s\S]*?FOR SELECT[\s\S]*?is_superadmin\(\)/
		);
		expect(selectPolicy).not.toBeNull();
		// Must contain source_organization_id check
		expect(multiorgRls).toMatch(
			/org_rel_select[\s\S]*?source_organization_id IN/
		);
		// Must contain target_organization_id check
		expect(multiorgRls).toMatch(
			/org_rel_select[\s\S]*?target_organization_id IN/
		);
	});

	it('INSERT policy requires owner/admin of source/target + superadmin', () => {
		expect(multiorgRls).toContain('org_rel_insert ON organization_relationships');
		const insertPolicy = multiorgRls.match(
			/org_rel_insert[\s\S]*?FOR INSERT[\s\S]*?is_superadmin\(\)/
		);
		expect(insertPolicy).not.toBeNull();
		// Must check role IN ('owner', 'admin')
		expect(multiorgRls).toMatch(
			/org_rel_insert[\s\S]*?role IN \('owner', 'admin'\)/
		);
	});

	it('UPDATE policy requires owner/admin of source/target + superadmin', () => {
		expect(multiorgRls).toContain('org_rel_update ON organization_relationships');
		const updatePolicy = multiorgRls.match(
			/org_rel_update[\s\S]*?FOR UPDATE[\s\S]*?is_superadmin\(\)/
		);
		expect(updatePolicy).not.toBeNull();
	});

	it('DELETE policy requires owner/admin of source/target + superadmin', () => {
		expect(multiorgRls).toContain('org_rel_delete ON organization_relationships');
		const deletePolicy = multiorgRls.match(
			/org_rel_delete[\s\S]*?FOR DELETE[\s\S]*?is_superadmin\(\)/
		);
		expect(deletePolicy).not.toBeNull();
	});

	it('table has RLS enabled', () => {
		expect(orgRelationships).toContain(
			'ALTER TABLE organization_relationships ENABLE ROW LEVEL SECURITY'
		);
	});
});

// =============================================================================
// 4. ORGANIZATION SETTINGS RLS
// =============================================================================

describe('Organization settings RLS policies', () => {
	it('drops old Dutch-named policies', () => {
		expect(multiorgRls).toContain(
			'DROP POLICY IF EXISTS "Settings leesbaar voor org leden"'
		);
		expect(multiorgRls).toContain(
			'DROP POLICY IF EXISTS "Settings schrijfbaar door owner/admin"'
		);
	});

	it('SELECT policy allows org members + superadmin', () => {
		expect(multiorgRls).toContain('org_settings_select ON organization_settings');
		const selectPolicy = multiorgRls.match(
			/org_settings_select[\s\S]*?FOR SELECT[\s\S]*?is_superadmin\(\)/
		);
		expect(selectPolicy).not.toBeNull();
	});

	it('INSERT policy requires owner/admin + superadmin', () => {
		expect(multiorgRls).toContain('org_settings_insert ON organization_settings');
		const insertPolicy = multiorgRls.match(
			/org_settings_insert[\s\S]*?FOR INSERT[\s\S]*?is_superadmin\(\)/
		);
		expect(insertPolicy).not.toBeNull();
		expect(multiorgRls).toMatch(
			/org_settings_insert[\s\S]*?role IN \('owner', 'admin'\)/
		);
	});

	it('UPDATE policy requires owner/admin + superadmin', () => {
		expect(multiorgRls).toContain('org_settings_update ON organization_settings');
		const updatePolicy = multiorgRls.match(
			/org_settings_update[\s\S]*?FOR UPDATE[\s\S]*?is_superadmin\(\)/
		);
		expect(updatePolicy).not.toBeNull();
	});

	it('DELETE policy is superadmin only', () => {
		expect(multiorgRls).toContain('org_settings_delete ON organization_settings');
		expect(multiorgRls).toMatch(
			/org_settings_delete[\s\S]*?FOR DELETE[\s\S]*?USING \(is_superadmin\(\)\)/
		);
	});

	it('table has RLS enabled', () => {
		expect(orgSettings).toContain(
			'ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY'
		);
	});
});

// =============================================================================
// 5. ORGANIZATION MEMBERS RLS
// =============================================================================

describe('Organization members RLS policies', () => {
	it('SELECT avoids self-referencing recursion', () => {
		// The fix migration uses profile_id = auth.uid() directly
		expect(fixOrgMembersRls).toContain('profile_id = auth.uid()');
		expect(fixOrgMembersRls).toContain('OR is_superadmin()');
	});

	it('INSERT allows owner/admin of org + superadmin', () => {
		expect(multiorgRls).toContain('org_members_insert ON organization_members');
		const insertPolicy = multiorgRls.match(
			/org_members_insert[\s\S]*?FOR INSERT[\s\S]*?is_superadmin\(\)/
		);
		expect(insertPolicy).not.toBeNull();
		expect(multiorgRls).toMatch(
			/org_members_insert[\s\S]*?role IN \('owner', 'admin'\)/
		);
	});

	it('UPDATE allows owner/admin of org + superadmin', () => {
		expect(multiorgRls).toContain('org_members_update ON organization_members');
		const updatePolicy = multiorgRls.match(
			/org_members_update[\s\S]*?FOR UPDATE[\s\S]*?is_superadmin\(\)/
		);
		expect(updatePolicy).not.toBeNull();
	});

	it('DELETE allows superadmin or self', () => {
		// From 00005_superadmin.sql (not changed in multiorg)
		expect(superadminMigration).toContain('org_members_delete ON organization_members');
		expect(superadminMigration).toMatch(
			/org_members_delete[\s\S]*?is_superadmin\(\) OR profile_id = auth.uid\(\)/
		);
	});

	it('table has RLS enabled', () => {
		expect(initialSchema).toContain(
			'ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY'
		);
	});

	it('supports external_advisor and auditor roles', () => {
		expect(extendOrgMembers).toContain("ADD VALUE 'external_advisor'");
		expect(extendOrgMembers).toContain("ADD VALUE 'auditor'");
	});
});

// =============================================================================
// 6. PROJECTS RLS — external_advisor restriction
// =============================================================================

describe('Projects RLS policies', () => {
	it('drops old project policies', () => {
		expect(multiorgRls).toContain('DROP POLICY IF EXISTS projects_select ON projects');
		expect(multiorgRls).toContain('DROP POLICY IF EXISTS projects_insert ON projects');
		expect(multiorgRls).toContain('DROP POLICY IF EXISTS projects_update ON projects');
	});

	it('SELECT policy includes superadmin bypass', () => {
		const selectPolicy = multiorgRls.match(
			/projects_select ON projects[\s\S]*?FOR SELECT[\s\S]*?is_superadmin\(\)/
		);
		expect(selectPolicy).not.toBeNull();
	});

	it('SELECT policy allows owner/admin/member to see all org projects', () => {
		expect(multiorgRls).toMatch(
			/projects_select[\s\S]*?role IN \('owner', 'admin', 'member'\)/
		);
	});

	it('SELECT policy restricts external_advisor to assigned projects only', () => {
		// external_advisor must be in project_members to see a project
		expect(multiorgRls).toMatch(
			/projects_select[\s\S]*?project_members[\s\S]*?role IN \('external_advisor', 'auditor'\)/
		);
	});

	it('INSERT policy restricts to owner/admin/member + superadmin', () => {
		const insertPolicy = multiorgRls.match(
			/projects_insert ON projects[\s\S]*?FOR INSERT[\s\S]*?is_superadmin\(\)/
		);
		expect(insertPolicy).not.toBeNull();
		expect(multiorgRls).toMatch(
			/projects_insert[\s\S]*?role IN \('owner', 'admin', 'member'\)/
		);
	});

	it('UPDATE policy allows project members + superadmin', () => {
		const updatePolicy = multiorgRls.match(
			/projects_update ON projects[\s\S]*?FOR UPDATE[\s\S]*?is_superadmin\(\)/
		);
		expect(updatePolicy).not.toBeNull();
		expect(multiorgRls).toMatch(
			/projects_update[\s\S]*?is_project_member\(id\)/
		);
	});

	it('SELECT policy checks deleted_at IS NULL', () => {
		expect(multiorgRls).toMatch(
			/projects_select[\s\S]*?deleted_at IS NULL/
		);
	});

	it('table has RLS enabled', () => {
		expect(initialSchema).toContain(
			'ALTER TABLE projects ENABLE ROW LEVEL SECURITY'
		);
	});
});

// =============================================================================
// 7. DATA SEPARATION — verify org_id scoping
// =============================================================================

describe('Data separation between organizations', () => {
	it('organizations query scoped to membership', () => {
		// organizations_select checks is_org_member(id)
		expect(superadminMigration).toMatch(
			/organizations_select[\s\S]*?organization_members\.organization_id = id/
		);
	});

	it('projects scoped to organization_id', () => {
		expect(multiorgRls).toMatch(
			/projects_select[\s\S]*?organization_id = projects\.organization_id/
		);
	});

	it('organization_settings scoped to organization_id', () => {
		expect(multiorgRls).toMatch(
			/org_settings_select[\s\S]*?organization_id IN/
		);
	});

	it('organization_relationships scoped to source/target org membership', () => {
		expect(multiorgRls).toMatch(
			/org_rel_select[\s\S]*?source_organization_id IN/
		);
		expect(multiorgRls).toMatch(
			/org_rel_select[\s\S]*?target_organization_id IN/
		);
	});

	it('all RLS functions use SECURITY DEFINER', () => {
		// Helper functions must be SECURITY DEFINER to bypass RLS on subqueries
		expect(multiorgRls).toMatch(/is_org_member[\s\S]*?SECURITY DEFINER/);
		expect(multiorgRls).toMatch(/is_org_admin[\s\S]*?SECURITY DEFINER/);
		expect(multiorgRls).toMatch(/is_project_member[\s\S]*?SECURITY DEFINER/);
		expect(multiorgRls).toMatch(/get_org_role[\s\S]*?SECURITY DEFINER/);
	});

	it('all RLS functions set search_path = public', () => {
		// Prevent search_path injection attacks
		const searchPathMatches = multiorgRls.match(/SET search_path = public/g);
		expect(searchPathMatches).not.toBeNull();
		expect(searchPathMatches!.length).toBeGreaterThanOrEqual(4);
	});
});

// =============================================================================
// 8. RECHTENMODEL MATRIX — verify role-based access patterns
// =============================================================================

describe('Rechtenmodel access matrix', () => {
	it('superadmin has is_superadmin field on profiles', () => {
		expect(superadminMigration).toContain('is_superadmin BOOLEAN NOT NULL DEFAULT FALSE');
	});

	it('superadmin bypass in all major tables', () => {
		// organizations — from 00005
		expect(superadminMigration).toMatch(/organizations_select[\s\S]*?is_superadmin/);
		// relationships — from multiorg
		expect(multiorgRls).toMatch(/org_rel_select[\s\S]*?is_superadmin/);
		// settings — from multiorg
		expect(multiorgRls).toMatch(/org_settings_select[\s\S]*?is_superadmin/);
		// projects — from multiorg
		expect(multiorgRls).toMatch(/projects_select[\s\S]*?is_superadmin/);
		// org members — from fix migration
		expect(fixOrgMembersRls).toContain('is_superadmin()');
	});

	it('external_advisor cannot create projects', () => {
		// projects_insert only allows owner, admin, member
		expect(multiorgRls).toMatch(
			/projects_insert[\s\S]*?role IN \('owner', 'admin', 'member'\)/
		);
		// Extract just the INSERT policy block and verify no external_advisor
		const insertBlock = multiorgRls.match(
			/CREATE POLICY projects_insert[\s\S]*?(?=CREATE POLICY|-- ====)/
		);
		expect(insertBlock).not.toBeNull();
		expect(insertBlock![0]).not.toContain('external_advisor');
	});

	it('auditor restricted to settings and assigned projects', () => {
		// Auditor can read settings (as org member)
		expect(multiorgRls).toMatch(/org_settings_select[\s\S]*?organization_members/);
		// Auditor sees projects only when assigned (via project_members)
		expect(multiorgRls).toMatch(
			/projects_select[\s\S]*?'auditor'/
		);
	});

	it('member sees all org projects but cannot manage settings', () => {
		// member can see org projects
		expect(multiorgRls).toMatch(
			/projects_select[\s\S]*?'member'/
		);
		// settings write requires owner/admin only
		expect(multiorgRls).toMatch(
			/org_settings_update[\s\S]*?role IN \('owner', 'admin'\)/
		);
	});
});
