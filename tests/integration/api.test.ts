// Integration test: API endpoints basic validation

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

describe('API Endpoints', () => {
	describe('Organizations', () => {
		it('should return 401 for unauthenticated requests', async () => {
			const response = await fetch(`${BASE_URL}/api/organizations`);
			expect(response.status).toBe(401);
		});

		it('should reject invalid organization creation', async () => {
			const response = await fetch(`${BASE_URL}/api/organizations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			expect(response.status).toBe(401);
		});
	});

	describe('Profile', () => {
		it('should return 401 for unauthenticated profile request', async () => {
			const response = await fetch(`${BASE_URL}/api/profile`);
			expect(response.status).toBe(401);
		});
	});

	describe('Chat', () => {
		it('should return 401 for unauthenticated chat request', async () => {
			const response = await fetch(`${BASE_URL}/api/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ conversation_id: 'test', message: 'hello' })
			});
			expect(response.status).toBe(401);
		});
	});
});
