// Unit tests for Fase 27 — Team database uitbreiding (status & manager_id)

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// =============================================================================
// MIGRATION FILE VERIFICATION
// =============================================================================

describe('Team status/manager migration file', () => {
	const sql = readFileSync(
		path.resolve('supabase/migrations/20260220000100_team_status_manager.sql'),
		'utf-8'
	);

	it('creates member_status enum with active and inactive', () => {
		expect(sql).toContain('CREATE TYPE member_status AS ENUM');
		expect(sql).toContain("'active'");
		expect(sql).toContain("'inactive'");
	});

	it('adds status column with default active', () => {
		expect(sql).toContain('ADD COLUMN status member_status NOT NULL DEFAULT');
		expect(sql).toContain("'active'");
	});

	it('adds manager_id column as self-reference UUID', () => {
		expect(sql).toContain('ADD COLUMN manager_id UUID');
		expect(sql).toContain('REFERENCES organization_members(id)');
	});

	it('sets ON DELETE SET NULL for manager_id', () => {
		expect(sql).toContain('ON DELETE SET NULL');
	});

	it('has index on (organization_id, status)', () => {
		expect(sql).toContain('idx_organization_members_status');
		expect(sql).toContain('organization_id, status');
	});

	it('has index on manager_id', () => {
		expect(sql).toContain('idx_organization_members_manager');
		expect(sql).toContain('(manager_id)');
	});
});

// =============================================================================
// TYPE FILE VERIFICATION
// =============================================================================

describe('OrganizationMember type', () => {
	const source = readFileSync(
		path.resolve('src/lib/types/db/base.ts'),
		'utf-8'
	);

	it('imports MemberStatus from enums', () => {
		expect(source).toContain('MemberStatus');
	});

	it('has status field of type MemberStatus', () => {
		expect(source).toContain('status: MemberStatus');
	});

	it('has manager_id field as nullable string', () => {
		expect(source).toContain('manager_id: string | null');
	});

	it('stays under 200 lines', () => {
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// ENUM FILE VERIFICATION
// =============================================================================

describe('MemberStatus enum', () => {
	const source = readFileSync(
		path.resolve('src/lib/types/enums.ts'),
		'utf-8'
	);

	it('exports MEMBER_STATUSES const', () => {
		expect(source).toContain('export const MEMBER_STATUSES');
	});

	it('exports MemberStatus type', () => {
		expect(source).toContain('export type MemberStatus');
	});

	it('contains active and inactive values', () => {
		expect(source).toContain("'active'");
		expect(source).toContain("'inactive'");
	});

	it('exports MEMBER_STATUS_LABELS with Dutch labels', () => {
		expect(source).toContain('MEMBER_STATUS_LABELS');
		expect(source).toContain('Actief');
		expect(source).toContain('Inactief');
	});

	it('stays under 200 lines per section', () => {
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(600);
	});
});
