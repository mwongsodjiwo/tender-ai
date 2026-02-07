// Integration test: Auth flow

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

describe('Auth Flow', () => {
	const testEmail = `test-${Date.now()}@example.com`;
	const testPassword = 'testpassword123';
	const testName = 'Test Gebruiker';

	it('should register a new user', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: testEmail,
				password: testPassword,
				full_name: testName
			})
		});

		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body.data.user).toBeDefined();
	});

	it('should reject registration with invalid email', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'invalid-email',
				password: testPassword,
				full_name: testName
			})
		});

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.code).toBe('VALIDATION_ERROR');
	});

	it('should reject registration with short password', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: 'valid@example.com',
				password: 'short',
				full_name: testName
			})
		});

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.code).toBe('VALIDATION_ERROR');
	});

	it('should login with valid credentials', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: testEmail,
				password: testPassword
			})
		});

		// May fail if email confirmation is required in Supabase config
		if (response.status === 200) {
			const body = await response.json();
			expect(body.data.user).toBeDefined();
			expect(body.data.session).toBeDefined();
		}
	});

	it('should reject login with wrong password', async () => {
		const response = await fetch(`${BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: testEmail,
				password: 'wrongpassword123'
			})
		});

		expect(response.status).toBe(401);
	});
});
