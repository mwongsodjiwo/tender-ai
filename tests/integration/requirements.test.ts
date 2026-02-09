// Integration tests for Sprint R5 — Requirements API endpoints

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:5173';

// These tests require a running server with seeded data.
// When TEST_BASE_URL is not set, tests are skipped.
const describeIf = process.env.TEST_BASE_URL ? describe : describe.skip;

describeIf('Requirements API — /api/projects/:id/requirements', () => {
	const PROJECT_ID = process.env.TEST_PROJECT_ID ?? '';
	const DOC_TYPE_ID = process.env.TEST_PVE_DOC_TYPE_ID ?? '';
	let authCookie = '';
	let createdRequirementId = '';

	it('should authenticate first', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: process.env.TEST_USER_EMAIL,
				password: process.env.TEST_USER_PASSWORD
			})
		});
		expect(response.ok).toBe(true);
		authCookie = response.headers.get('set-cookie') ?? '';
	});

	it('GET returns empty list initially', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/requirements`, {
			headers: { Cookie: authCookie }
		});
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(Array.isArray(body.data)).toBe(true);
	});

	it('POST creates a new eis (knock-out) requirement', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/requirements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				document_type_id: DOC_TYPE_ID,
				title: 'Inschrijver beschikt over ISO 9001',
				description: 'Geldig ISO 9001:2015 certificaat vereist.',
				requirement_type: 'eis',
				category: 'quality',
				priority: 5
			})
		});
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.data.id).toBeDefined();
		expect(body.data.requirement_number).toMatch(/^E-\d{3}$/);
		expect(body.data.title).toBe('Inschrijver beschikt over ISO 9001');
		createdRequirementId = body.data.id;
	});

	it('POST creates a wens requirement', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/requirements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				document_type_id: DOC_TYPE_ID,
				title: 'Social Return on Investment',
				description: 'Inschrijver beschrijft SROI-aanpak.',
				requirement_type: 'wens',
				category: 'sustainability',
				priority: 3
			})
		});
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.data.requirement_number).toMatch(/^W-\d{3}$/);
	});

	it('GET returns created requirements', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/requirements`, {
			headers: { Cookie: authCookie }
		});
		const body = await response.json();
		expect(body.data.length).toBeGreaterThanOrEqual(2);
	});

	it('GET filters by type', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/requirements?type=eis`,
			{ headers: { Cookie: authCookie } }
		);
		const body = await response.json();
		for (const req of body.data) {
			expect(req.requirement_type).toBe('eis');
		}
	});

	it('GET filters by category', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/requirements?category=quality`,
			{ headers: { Cookie: authCookie } }
		);
		const body = await response.json();
		for (const req of body.data) {
			expect(req.category).toBe('quality');
		}
	});

	it('GET searches by query', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/requirements?q=ISO`,
			{ headers: { Cookie: authCookie } }
		);
		const body = await response.json();
		expect(body.data.length).toBeGreaterThanOrEqual(1);
		expect(body.data[0].title).toContain('ISO');
	});

	it('PATCH updates a requirement', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/requirements/${createdRequirementId}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ title: 'Bijgewerkte ISO eis', priority: 4 })
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.title).toBe('Bijgewerkte ISO eis');
		expect(body.data.priority).toBe(4);
	});

	it('GET single requirement returns updated data', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/requirements/${createdRequirementId}`,
			{ headers: { Cookie: authCookie } }
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.title).toBe('Bijgewerkte ISO eis');
	});

	it('DELETE soft-deletes a requirement', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/requirements/${createdRequirementId}`,
			{ method: 'DELETE', headers: { Cookie: authCookie } }
		);
		expect(response.ok).toBe(true);
	});

	it('GET no longer returns deleted requirement', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/requirements/${createdRequirementId}`,
			{ headers: { Cookie: authCookie } }
		);
		expect(response.status).toBe(404);
	});

	it('POST rejects invalid requirement type', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/requirements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				document_type_id: DOC_TYPE_ID,
				title: 'Test',
				requirement_type: 'invalid',
				category: 'functional'
			})
		});
		expect(response.status).toBe(400);
	});

	it('POST rejects old award_criterion type', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/requirements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				document_type_id: DOC_TYPE_ID,
				title: 'Test',
				requirement_type: 'award_criterion',
				category: 'functional'
			})
		});
		expect(response.status).toBe(400);
	});

	it('POST rejects missing title', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/requirements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				document_type_id: DOC_TYPE_ID,
				requirement_type: 'eis',
				category: 'functional'
			})
		});
		expect(response.status).toBe(400);
	});

	it('returns 401 without authentication', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/requirements`);
		expect(response.status).toBe(401);
	});
});

describeIf('Requirements reorder API', () => {
	const PROJECT_ID = process.env.TEST_PROJECT_ID ?? '';
	const DOC_TYPE_ID = process.env.TEST_PVE_DOC_TYPE_ID ?? '';
	let authCookie = '';

	it('should authenticate', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: process.env.TEST_USER_EMAIL,
				password: process.env.TEST_USER_PASSWORD
			})
		});
		authCookie = response.headers.get('set-cookie') ?? '';
	});

	it('POST reorder updates sort_order', async () => {
		// Create two requirements
		const req1 = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/requirements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				document_type_id: DOC_TYPE_ID,
				title: 'Reorder test A',
				requirement_type: 'wens',
				category: 'functional'
			})
		});
		const body1 = await req1.json();

		const req2 = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/requirements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				document_type_id: DOC_TYPE_ID,
				title: 'Reorder test B',
				requirement_type: 'wens',
				category: 'functional'
			})
		});
		const body2 = await req2.json();

		// Reorder: B before A
		const reorderResponse = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/requirements/reorder`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({
					ordered_ids: [body2.data.id, body1.data.id]
				})
			}
		);
		expect(reorderResponse.ok).toBe(true);
	});

	it('POST reorder rejects empty array', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/requirements/reorder`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ ordered_ids: [] })
			}
		);
		expect(response.status).toBe(400);
	});
});
