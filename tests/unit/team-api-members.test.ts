// Unit tests for Fase 28 — Team API: validation schemas & route structure

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// =============================================================================
// VALIDATION SCHEMA FILE
// =============================================================================

describe('Member validation schemas', () => {
	const source = readFileSync(
		path.resolve('src/lib/server/api/validation/members.ts'),
		'utf-8'
	);

	it('imports zod', () => {
		expect(source).toContain("from 'zod'");
	});

	it('imports MEMBER_STATUSES from types', () => {
		expect(source).toContain('MEMBER_STATUSES');
	});

	it('exports memberSearchSchema with search, status, limit, offset', () => {
		expect(source).toContain('export const memberSearchSchema');
		expect(source).toContain('search');
		expect(source).toContain("'all'");
		expect(source).toContain('.default(25)');
		expect(source).toContain('.default(0)');
	});

	it('exports updateMemberSchema with status and manager_id', () => {
		expect(source).toContain('export const updateMemberSchema');
		expect(source).toContain('manager_id');
		expect(source).toContain('.nullable()');
	});

	it('exports type aliases', () => {
		expect(source).toContain('export type MemberSearchParams');
		expect(source).toContain('export type UpdateMemberBody');
	});

	it('stays under 200 lines', () => {
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// VALIDATION INDEX RE-EXPORT
// =============================================================================

describe('Validation index exports members', () => {
	const source = readFileSync(
		path.resolve('src/lib/server/api/validation/index.ts'),
		'utf-8'
	);

	it('re-exports members module', () => {
		expect(source).toContain("'./members.js'");
	});
});

// =============================================================================
// GET ROUTE — SEARCH, FILTER, PAGINATION
// =============================================================================

describe('Members GET route', () => {
	const source = readFileSync(
		path.resolve('src/routes/api/organizations/[id]/members/+server.ts'),
		'utf-8'
	);

	it('imports memberSearchSchema', () => {
		expect(source).toContain('memberSearchSchema');
	});

	it('parses URL search params and filters by status', () => {
		expect(source).toContain('url.searchParams');
		expect(source).toContain("status !== 'all'");
		expect(source).toContain(".eq('status'");
	});

	it('supports search on name and email via ilike', () => {
		expect(source).toContain('first_name');
		expect(source).toContain('last_name');
		expect(source).toContain('ilike');
	});

	it('uses pagination with range and returns total count', () => {
		expect(source).toContain('.range(');
		expect(source).toContain("count: 'exact'");
		expect(source).toContain('items:');
		expect(source).toContain('total:');
	});

	it('stays under 200 lines', () => {
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// PATCH ROUTE — STATUS TOGGLE & MANAGER_ID
// =============================================================================

describe('Members PATCH route', () => {
	const source = readFileSync(
		path.resolve(
			'src/routes/api/organizations/[id]/members/[memberId]/+server.ts'
		),
		'utf-8'
	);

	it('imports updateMemberSchema', () => {
		expect(source).toContain('updateMemberSchema');
	});

	it('supports status and manager_id updates', () => {
		expect(source).toContain('status');
		expect(source).toContain('manager_id');
		expect(source).toContain('updateFields');
	});

	it('returns 400 when no valid fields and logs audit', () => {
		expect(source).toContain('Geen geldige velden opgegeven');
		expect(source).toContain('logAudit');
	});

	it('stays under 200 lines', () => {
		const lineCount = source.split('\n').length;
		expect(lineCount).toBeLessThanOrEqual(200);
	});
});

// =============================================================================
// API CONTRACT DOCUMENTATION
// =============================================================================

describe('API contract documentation', () => {
	const doc = readFileSync(path.resolve('contracts/api.md'), 'utf-8');

	it('documents GET with search, status filter and pagination', () => {
		expect(doc).toContain('Search on name/email');
		expect(doc).toContain('"active" | "inactive" | "all"');
		expect(doc).toContain('limit');
		expect(doc).toContain('offset');
	});

	it('documents PATCH for status and manager_id', () => {
		expect(doc).toContain('PATCH /api/organizations/:id/members/:memberId');
		expect(doc).toContain('manager_id');
	});

	it('documents DELETE endpoint', () => {
		expect(doc).toContain('DELETE /api/organizations/:id/members/:memberId');
	});
});
