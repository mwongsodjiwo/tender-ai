// E2E test: Fase 29-31 — Create team member, assign document role, view in drawer
// Tests run against a live dev server with authenticated session

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

const testState = {
	email: `e2e-team-${Date.now()}@example.com`,
	password: 'TestPassword123!',
	accessToken: '',
	organizationId: '',
	projectId: '',
	memberId: ''
};

function authHeaders(): Record<string, string> {
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${testState.accessToken}`
	};
}

// =============================================================================
// STEP 1: SETUP — Register, create org and project
// =============================================================================

describe('E2E: Team Member + Document Roles', () => {
	describe('Step 1: Setup', () => {
		it('should register a test user', async () => {
			const response = await fetch(`${BASE_URL}/api/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: testState.email,
					password: testState.password,
					first_name: 'E2E Team',
					last_name: 'Tester'
				})
			});
			expect([200, 201]).toContain(response.status);
			const json = await response.json();
			testState.accessToken = json.data?.access_token ?? '';
		});

		it('should create an organization', async () => {
			const response = await fetch(`${BASE_URL}/api/organizations`, {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({
					name: 'E2E Test Org',
					organization_type: 'government'
				})
			});
			expect([200, 201]).toContain(response.status);
			const json = await response.json();
			testState.organizationId = json.data?.id ?? '';
		});

		it('should create a project', async () => {
			const response = await fetch(`${BASE_URL}/api/projects`, {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({
					name: 'E2E Team Test Project',
					organization_id: testState.organizationId,
					procedure_type: 'open'
				})
			});
			expect([200, 201]).toContain(response.status);
			const json = await response.json();
			testState.projectId = json.data?.id ?? '';
		});
	});

	// ===========================================================================
	// STEP 2: INVITE — Add team member to organization
	// ===========================================================================

	describe('Step 2: Invite team member', () => {
		it('should invite a member to the organization', async () => {
			const memberEmail = `team-member-${Date.now()}@example.com`;
			// First register the member account
			await fetch(`${BASE_URL}/api/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: memberEmail,
					password: 'MemberPass123!',
					first_name: 'Team',
					last_name: 'Lid'
				})
			});

			const response = await fetch(
				`${BASE_URL}/api/organizations/${testState.organizationId}/members`,
				{
					method: 'POST',
					headers: authHeaders(),
					body: JSON.stringify({
						email: memberEmail,
						role: 'member'
					})
				}
			);
			expect([200, 201]).toContain(response.status);
			const json = await response.json();
			testState.memberId = json.data?.id ?? '';
			expect(testState.memberId).toBeTruthy();
		});
	});

	// ===========================================================================
	// STEP 3: ASSIGN — Assign document role to team member
	// ===========================================================================

	describe('Step 3: Assign document role', () => {
		it('should assign contactpersoon role linked to team member', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/${testState.projectId}/roles`,
				{
					method: 'POST',
					headers: authHeaders(),
					body: JSON.stringify({
						role_key: 'contactpersoon',
						role_label: 'Contactpersoon',
						project_member_id: testState.memberId
					})
				}
			);
			expect([200, 201]).toContain(response.status);
			const json = await response.json();
			expect(json.data?.role_key).toBe('contactpersoon');
			expect(json.data?.project_member_id).toBe(testState.memberId);
		});

		it('should auto-fill person data from member profile', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/${testState.projectId}/roles`,
				{ headers: authHeaders() }
			);
			expect(response.status).toBe(200);
			const json = await response.json();
			const contact = json.data?.find(
				(r: Record<string, string>) => r.role_key === 'contactpersoon'
			);
			expect(contact?.person_name).toBeTruthy();
		});
	});

	// ===========================================================================
	// STEP 4: VERIFY — List roles and verify link
	// ===========================================================================

	describe('Step 4: Verify role assignment', () => {
		it('should list roles with member linkage', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/${testState.projectId}/roles`,
				{ headers: authHeaders() }
			);
			expect(response.status).toBe(200);
			const json = await response.json();
			const roles = json.data ?? [];
			const contactRole = roles.find(
				(r: Record<string, string>) => r.role_key === 'contactpersoon'
			);
			expect(contactRole).toBeDefined();
			expect(contactRole?.project_member_id).toBe(testState.memberId);
		});

		it('should unlink member via PATCH with null', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/${testState.projectId}/roles/contactpersoon`,
				{
					method: 'PATCH',
					headers: authHeaders(),
					body: JSON.stringify({ project_member_id: null })
				}
			);
			expect(response.status).toBe(200);
			const json = await response.json();
			expect(json.data?.project_member_id).toBeNull();
		});
	});
});
