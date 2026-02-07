// Integration test: Health check endpoint

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

describe('Health Check', () => {
	it('should return healthy status', async () => {
		const response = await fetch(`${BASE_URL}/api/health`);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.status).toBe('healthy');
		expect(body.database).toBe('connected');
		expect(body.timestamp).toBeDefined();
	});
});
