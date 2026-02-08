// Integration tests for Sprint R7 — Contract API endpoints

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:5173';

// These tests require a running server with seeded data.
// When TEST_BASE_URL is not set, tests are skipped.
const describeIf = process.env.TEST_BASE_URL ? describe : describe.skip;

describeIf('Contract API — /api/projects/:id/contract', () => {
	const PROJECT_ID = process.env.TEST_PROJECT_ID ?? '';
	let authCookie = '';

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

	it('GET settings returns initial state', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{ headers: { Cookie: authCookie } }
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data).toBeDefined();
		expect(body.data).toHaveProperty('contract_type');
		expect(body.data).toHaveProperty('general_conditions');
	});

	it('PUT updates contract type to diensten', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ contract_type: 'diensten' })
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.contract_type).toBe('diensten');
	});

	it('PUT updates contract type to leveringen', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ contract_type: 'leveringen' })
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.contract_type).toBe('leveringen');
	});

	it('PUT updates contract type to werken', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ contract_type: 'werken' })
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.contract_type).toBe('werken');
	});

	it('PUT updates general conditions to arvodi_2018', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ general_conditions: 'arvodi_2018' })
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.general_conditions).toBe('arvodi_2018');
	});

	it('PUT updates general conditions to ariv_2018', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ general_conditions: 'ariv_2018' })
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.general_conditions).toBe('ariv_2018');
	});

	it('PUT updates both settings at once', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({
					contract_type: 'diensten',
					general_conditions: 'arvodi_2018'
				})
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.contract_type).toBe('diensten');
		expect(body.data.general_conditions).toBe('arvodi_2018');
	});

	it('PUT rejects invalid contract type', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ contract_type: 'invalid' })
			}
		);
		expect(response.status).toBe(400);
	});

	it('PUT rejects invalid general conditions', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ general_conditions: 'invalid' })
			}
		);
		expect(response.status).toBe(400);
	});

	it('GET standard text returns text for arvodi_2018 definities', async () => {
		// First ensure general conditions is set
		await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ general_conditions: 'arvodi_2018' })
			}
		);

		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/standard-text/definities`,
			{ headers: { Cookie: authCookie } }
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data).toBeDefined();
		expect(body.data.section_key).toBe('definities');
		expect(body.data.content).toBeDefined();
		expect(body.data.content.length).toBeGreaterThan(0);
	});

	it('GET standard text returns 404 for unknown section', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/standard-text/nonexistent`,
			{ headers: { Cookie: authCookie } }
		);
		expect(response.status).toBe(404);
	});

	it('GET standard text returns 400 when no conditions set', async () => {
		// Reset conditions to null
		await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ general_conditions: null })
			}
		);

		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/standard-text/definities`,
			{ headers: { Cookie: authCookie } }
		);
		expect(response.status).toBe(400);
	});

	it('returns 401 without authentication', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/contract/settings`
		);
		expect(response.status).toBe(401);
	});
});
