// Integration test: Briefing flow

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

describe('Briefing Flow', () => {
	describe('Projects API', () => {
		it('should return 401 for unauthenticated project list', async () => {
			const response = await fetch(`${BASE_URL}/api/projects`);
			expect(response.status).toBe(401);
		});

		it('should return 401 for unauthenticated project creation', async () => {
			const response = await fetch(`${BASE_URL}/api/projects`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					organization_id: '550e8400-e29b-41d4-a716-446655440000',
					name: 'Test Project'
				})
			});
			expect(response.status).toBe(401);
		});

		it('should validate project creation payload', async () => {
			const response = await fetch(`${BASE_URL}/api/projects`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			// Either 400 (validation) or 401 (not authenticated)
			expect([400, 401]).toContain(response.status);
		});
	});

	describe('Artifacts API', () => {
		it('should return 401 for unauthenticated artifact list', async () => {
			const projectId = '550e8400-e29b-41d4-a716-446655440000';
			const response = await fetch(`${BASE_URL}/api/projects/${projectId}/artifacts`);
			expect(response.status).toBe(401);
		});
	});

	describe('Briefing API', () => {
		it('should return 401 for unauthenticated briefing start', async () => {
			const response = await fetch(`${BASE_URL}/api/briefing/start`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					project_id: '550e8400-e29b-41d4-a716-446655440000'
				})
			});
			expect(response.status).toBe(401);
		});

		it('should return 401 for unauthenticated briefing message', async () => {
			const response = await fetch(`${BASE_URL}/api/briefing/message`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					project_id: '550e8400-e29b-41d4-a716-446655440000',
					conversation_id: '660e8400-e29b-41d4-a716-446655440000',
					message: 'Test message'
				})
			});
			expect(response.status).toBe(401);
		});

		it('should validate briefing start payload', async () => {
			const response = await fetch(`${BASE_URL}/api/briefing/start`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			// Either 400 (validation) or 401 (not authenticated)
			expect([400, 401]).toContain(response.status);
		});
	});

	describe('Project Members API', () => {
		it('should return 401 for unauthenticated member list', async () => {
			const projectId = '550e8400-e29b-41d4-a716-446655440000';
			const response = await fetch(`${BASE_URL}/api/projects/${projectId}/members`);
			expect(response.status).toBe(401);
		});
	});

	describe('Conversations API', () => {
		it('should return 401 for unauthenticated conversation list', async () => {
			const projectId = '550e8400-e29b-41d4-a716-446655440000';
			const response = await fetch(`${BASE_URL}/api/projects/${projectId}/conversations`);
			expect(response.status).toBe(401);
		});
	});
});
