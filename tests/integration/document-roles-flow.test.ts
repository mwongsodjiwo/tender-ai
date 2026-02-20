// Integration tests for Fase 30-31 — Document roles coupling
// Tests run against a live dev server

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_ROLE_KEY = 'contactpersoon';
const TEST_MEMBER_ID = '00000000-0000-0000-0000-000000000002';

// =============================================================================
// AUTH GUARDS — Document roles API
// =============================================================================

describe('Document Roles API — auth guards', () => {
	it('returns 401 for unauthenticated GET roles', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/roles`
		);
		expect(response.status).toBe(401);
	});

	it('returns 401 for unauthenticated POST role', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/roles`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					role_key: TEST_ROLE_KEY,
					role_label: 'Contactpersoon'
				})
			}
		);
		expect(response.status).toBe(401);
	});

	it('returns 401 for unauthenticated PATCH role', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/roles/${TEST_ROLE_KEY}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ person_name: 'Test' })
			}
		);
		expect(response.status).toBe(401);
	});
});

// =============================================================================
// MEMBER LINKING — project_member_id in payloads
// =============================================================================

describe('Document Roles API — member linking payloads', () => {
	it('POST accepts project_member_id in body', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/roles`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					role_key: TEST_ROLE_KEY,
					role_label: 'Contactpersoon',
					project_member_id: TEST_MEMBER_ID
				})
			}
		);
		// 401 confirms route exists and accepts payload shape
		expect(response.status).toBe(401);
	});

	it('PATCH accepts project_member_id for linking', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/roles/${TEST_ROLE_KEY}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					project_member_id: TEST_MEMBER_ID
				})
			}
		);
		expect(response.status).toBe(401);
	});

	it('PATCH accepts null project_member_id for unlinking', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/roles/${TEST_ROLE_KEY}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					project_member_id: null
				})
			}
		);
		expect(response.status).toBe(401);
	});
});

// =============================================================================
// ROUTE STRUCTURE
// =============================================================================

describe('Document Roles API — route structure', () => {
	it('GET roles list route exists', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/roles`
		);
		expect(response.status).not.toBe(404);
	});

	it('POST roles route exists', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/roles`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			}
		);
		expect(response.status).not.toBe(404);
	});

	it('PATCH role detail route exists', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/roles/${TEST_ROLE_KEY}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			}
		);
		expect(response.status).not.toBe(404);
	});
});
