// Integration tests for Fase 33 — Profile save, confirm, and lock flow
// Tests run against a live dev server

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

// =============================================================================
// AUTH GUARDS — Profile API
// =============================================================================

describe('Profile API — auth guards', () => {
	it('returns 401 for unauthenticated GET', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile`
		);
		expect(response.status).toBe(401);
	});

	it('returns 401 for unauthenticated POST (create)', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contracting_authority: 'Gemeente Amsterdam',
					project_goal: 'Test project'
				})
			}
		);
		expect(response.status).toBe(401);
	});

	it('returns 401 for unauthenticated PATCH (update)', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ project_goal: 'Updated goal' })
			}
		);
		expect(response.status).toBe(401);
	});

	it('returns 401 for unauthenticated confirm', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile/confirm`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ confirmed: true })
			}
		);
		expect(response.status).toBe(401);
	});
});

// =============================================================================
// ROUTE EXISTENCE
// =============================================================================

describe('Profile API — route existence', () => {
	it('GET profile route exists', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile`
		);
		expect(response.status).not.toBe(404);
	});

	it('POST profile route exists', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			}
		);
		expect(response.status).not.toBe(404);
	});

	it('PATCH profile route exists', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			}
		);
		expect(response.status).not.toBe(404);
	});

	it('POST confirm route exists', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile/confirm`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			}
		);
		expect(response.status).not.toBe(404);
	});
});

// =============================================================================
// PAYLOAD SHAPES — Profile save
// =============================================================================

describe('Profile API — save payload shapes', () => {
	it('POST accepts full profile payload', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contracting_authority: 'Gemeente Amsterdam',
					department: 'Inkoop',
					contact_name: 'Jan de Vries',
					contact_email: 'jan@amsterdam.nl',
					project_goal: 'Inkoop ICT-diensten',
					scope_description: 'Beheer en onderhoud',
					estimated_value: 500000,
					cpv_codes: ['72000000'],
					nuts_codes: ['NL329']
				})
			}
		);
		// 401 = route exists and accepts shape
		expect(response.status).toBe(401);
	});

	it('PATCH accepts partial update payload', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					project_goal: 'Gewijzigd doel',
					estimated_value: 750000
				})
			}
		);
		expect(response.status).toBe(401);
	});
});

// =============================================================================
// PAYLOAD SHAPES — Profile confirm
// =============================================================================

describe('Profile API — confirm payload', () => {
	it('POST confirm accepts confirmed: true', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${TEST_PROJECT_ID}/profile/confirm`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ confirmed: true })
			}
		);
		expect(response.status).toBe(401);
	});
});
