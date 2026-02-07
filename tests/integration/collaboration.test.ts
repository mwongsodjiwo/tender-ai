// Integration tests: Sprint 3 — Collaboration & Review

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

describe('Sprint 3: Collaboration & Review', () => {
	// =============================================================================
	// PROJECT MEMBER ROLES
	// =============================================================================

	describe('Project Member Roles', () => {
		it('should return 401 when updating member roles without auth', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/550e8400-e29b-41d4-a716-446655440000/members/660e8400-e29b-41d4-a716-446655440000`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ roles: ['project_leader'] })
				}
			);
			expect(response.status).toBe(401);
		});

		it('should return 401 when deleting member without auth', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/550e8400-e29b-41d4-a716-446655440000/members/660e8400-e29b-41d4-a716-446655440000`,
				{ method: 'DELETE' }
			);
			expect(response.status).toBe(401);
		});

		it('should return 401 when listing members without auth', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/550e8400-e29b-41d4-a716-446655440000/members`
			);
			expect(response.status).toBe(401);
		});
	});

	// =============================================================================
	// SECTION REVIEWERS
	// =============================================================================

	describe('Section Reviewers', () => {
		it('should return 401 when listing reviewers without auth', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/550e8400-e29b-41d4-a716-446655440000/reviewers`
			);
			expect(response.status).toBe(401);
		});

		it('should return 401 when inviting reviewer without auth', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/550e8400-e29b-41d4-a716-446655440000/reviewers`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						artifact_id: '550e8400-e29b-41d4-a716-446655440001',
						email: 'expert@gemeente.nl',
						name: 'Jan de Vries'
					})
				}
			);
			expect(response.status).toBe(401);
		});
	});

	// =============================================================================
	// MAGIC LINK REVIEW
	// =============================================================================

	describe('Magic Link Review', () => {
		it('should return 404 for invalid magic link token', async () => {
			const response = await fetch(`${BASE_URL}/api/review/invalid-token-12345`);
			expect(response.status).toBe(404);
			const data = await response.json();
			expect(data.code).toBe('NOT_FOUND');
		});

		it('should return 404 when submitting review with invalid token', async () => {
			const response = await fetch(`${BASE_URL}/api/review/invalid-token-12345`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ review_status: 'approved' })
			});
			expect(response.status).toBe(404);
		});

		it('should return 404 when chatting with invalid token', async () => {
			const response = await fetch(`${BASE_URL}/api/review/invalid-token-12345/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					token: 'invalid-token-12345',
					message: 'Test'
				})
			});
			expect(response.status).toBe(404);
		});

		it('should validate review status in PATCH request', async () => {
			// Even with invalid token, validation should fail first if body is invalid
			const response = await fetch(`${BASE_URL}/api/review/some-token`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ review_status: 'invalid_status' })
			});
			// Should be 404 (token not found) since token validation comes first
			expect([400, 404]).toContain(response.status);
		});
	});

	// =============================================================================
	// AUDIT LOG
	// =============================================================================

	describe('Audit Log', () => {
		it('should return 401 for unauthenticated project audit request', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/550e8400-e29b-41d4-a716-446655440000/audit`
			);
			expect(response.status).toBe(401);
		});

		it('should return 401 for unauthenticated organization audit request', async () => {
			const response = await fetch(
				`${BASE_URL}/api/organizations/550e8400-e29b-41d4-a716-446655440000/audit`
			);
			expect(response.status).toBe(401);
		});
	});

	// =============================================================================
	// RLS POLICY VALIDATION
	// =============================================================================

	describe('RLS Policy Validation', () => {
		it('should not expose reviewer tokens in unauthenticated requests', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/550e8400-e29b-41d4-a716-446655440000/reviewers`
			);
			expect(response.status).toBe(401);
		});

		it('should not allow cross-project member access without auth', async () => {
			const projectId = '550e8400-e29b-41d4-a716-446655440000';
			const memberId = '660e8400-e29b-41d4-a716-446655440000';

			const response = await fetch(
				`${BASE_URL}/api/projects/${projectId}/members/${memberId}`
			);
			expect(response.status).toBe(401);
		});

		it('should protect audit log from unauthenticated access', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/550e8400-e29b-41d4-a716-446655440000/audit?page=1&per_page=10`
			);
			expect(response.status).toBe(401);
		});
	});

	// =============================================================================
	// REVIEW PAGE (magic link)
	// =============================================================================

	describe('Review Page', () => {
		it('should return error page for invalid review token', async () => {
			const response = await fetch(`${BASE_URL}/review/invalid-token-xyz`);
			// SvelteKit will return the error page (500 or 404)
			expect([404, 500]).toContain(response.status);
		});
	});
});
