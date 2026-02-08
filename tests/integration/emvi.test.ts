// Integration tests for Sprint R6 — EMVI API endpoints

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:5173';

// These tests require a running server with seeded data.
// When TEST_BASE_URL is not set, tests are skipped.
const describeIf = process.env.TEST_BASE_URL ? describe : describe.skip;

describeIf('EMVI API — /api/projects/:id/emvi', () => {
	const PROJECT_ID = process.env.TEST_PROJECT_ID ?? '';
	let authCookie = '';
	let createdCriterionId = '';

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

	it('GET returns initial state', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/emvi`, {
			headers: { Cookie: authCookie }
		});
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data).toBeDefined();
		expect(Array.isArray(body.data.criteria)).toBe(true);
		expect(typeof body.data.total_weight).toBe('number');
	});

	it('PUT updates scoring methodology to emvi', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/emvi/methodology`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ scoring_methodology: 'emvi' })
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.scoring_methodology).toBe('emvi');
	});

	it('PUT updates scoring methodology to lowest_price', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/emvi/methodology`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ scoring_methodology: 'lowest_price' })
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.scoring_methodology).toBe('lowest_price');
	});

	it('PUT updates scoring methodology to best_price_quality', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/emvi/methodology`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ scoring_methodology: 'best_price_quality' })
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.scoring_methodology).toBe('best_price_quality');
	});

	it('PUT rejects invalid methodology', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/emvi/methodology`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ scoring_methodology: 'invalid' })
			}
		);
		expect(response.status).toBe(400);
	});

	it('POST creates a price criterion', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/emvi`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				name: 'Inschrijvingsprijs',
				description: 'De totale prijs van de inschrijving.',
				criterion_type: 'price',
				weight_percentage: 40
			})
		});
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.data.id).toBeDefined();
		expect(body.data.name).toBe('Inschrijvingsprijs');
		expect(body.data.criterion_type).toBe('price');
		expect(Number(body.data.weight_percentage)).toBe(40);
		createdCriterionId = body.data.id;
	});

	it('POST creates a quality criterion', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/emvi`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				name: 'Plan van Aanpak',
				description: 'Beoordeling op kwaliteit van het plan.',
				criterion_type: 'quality',
				weight_percentage: 35
			})
		});
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.data.criterion_type).toBe('quality');
	});

	it('GET returns criteria with total weight', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/emvi`, {
			headers: { Cookie: authCookie }
		});
		const body = await response.json();
		expect(body.data.criteria.length).toBeGreaterThanOrEqual(2);
		expect(body.data.total_weight).toBeGreaterThan(0);
	});

	it('PATCH updates a criterion', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/emvi/criteria/${createdCriterionId}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', Cookie: authCookie },
				body: JSON.stringify({ name: 'Aangepaste prijs', weight_percentage: 45 })
			}
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.name).toBe('Aangepaste prijs');
		expect(Number(body.data.weight_percentage)).toBe(45);
	});

	it('GET single criterion returns updated data', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/emvi/criteria/${createdCriterionId}`,
			{ headers: { Cookie: authCookie } }
		);
		expect(response.ok).toBe(true);
		const body = await response.json();
		expect(body.data.name).toBe('Aangepaste prijs');
	});

	it('DELETE soft-deletes a criterion', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/emvi/criteria/${createdCriterionId}`,
			{ method: 'DELETE', headers: { Cookie: authCookie } }
		);
		expect(response.ok).toBe(true);
	});

	it('GET no longer returns deleted criterion', async () => {
		const response = await fetch(
			`${BASE_URL}/api/projects/${PROJECT_ID}/emvi/criteria/${createdCriterionId}`,
			{ headers: { Cookie: authCookie } }
		);
		expect(response.status).toBe(404);
	});

	it('POST rejects missing name', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/emvi`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				criterion_type: 'quality',
				weight_percentage: 20
			})
		});
		expect(response.status).toBe(400);
	});

	it('POST rejects invalid criterion type', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/emvi`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: authCookie },
			body: JSON.stringify({
				name: 'Test',
				criterion_type: 'invalid',
				weight_percentage: 20
			})
		});
		expect(response.status).toBe(400);
	});

	it('returns 401 without authentication', async () => {
		const response = await fetch(`${BASE_URL}/api/projects/${PROJECT_ID}/emvi`);
		expect(response.status).toBe(401);
	});
});
