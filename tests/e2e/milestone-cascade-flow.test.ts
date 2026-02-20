// E2E test: Fase 34-35 — Modify milestone date and verify cascade
// Tests run against a live dev server with authenticated session

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

const testState = {
	email: `e2e-milestone-${Date.now()}@example.com`,
	password: 'TestPassword123!',
	accessToken: '',
	organizationId: '',
	projectId: '',
	milestoneIds: [] as string[]
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

describe('E2E: Milestone Date Cascade', () => {
	describe('Step 1: Setup', () => {
		it('should register and get access token', async () => {
			const response = await fetch(`${BASE_URL}/api/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: testState.email,
					password: testState.password,
					first_name: 'E2E Milestone',
					last_name: 'Tester'
				})
			});
			expect([200, 201]).toContain(response.status);
			const json = await response.json();
			testState.accessToken = json.data?.access_token ?? '';
		});

		it('should create organization', async () => {
			const response = await fetch(`${BASE_URL}/api/organizations`, {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({
					name: 'E2E Milestone Org',
					organization_type: 'government'
				})
			});
			expect([200, 201]).toContain(response.status);
			const json = await response.json();
			testState.organizationId = json.data?.id ?? '';
		});

		it('should create project with open procedure', async () => {
			const response = await fetch(`${BASE_URL}/api/projects`, {
				method: 'POST',
				headers: authHeaders(),
				body: JSON.stringify({
					name: 'E2E Milestone Project',
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
	// STEP 2: GENERATE — Generate milestones from anchor date
	// ===========================================================================

	describe('Step 2: Generate milestones', () => {
		it('should generate milestones via planning/generate', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/${testState.projectId}/planning/generate`,
				{
					method: 'POST',
					headers: authHeaders(),
					body: JSON.stringify({
						anchor_date: '2026-09-01',
						procedure_type: 'open'
					})
				}
			);
			expect([200, 201]).toContain(response.status);
			const json = await response.json();
			const milestones = json.data ?? [];
			testState.milestoneIds = milestones.map(
				(m: Record<string, string>) => m.id
			);
			expect(testState.milestoneIds.length).toBeGreaterThanOrEqual(4);
		});
	});

	// ===========================================================================
	// STEP 3: LIST — Verify initial milestone dates
	// ===========================================================================

	describe('Step 3: Verify initial milestones', () => {
		it('should list milestones for the project', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/${testState.projectId}/milestones`,
				{ headers: authHeaders() }
			);
			expect(response.status).toBe(200);
			const json = await response.json();
			const milestones = json.data ?? [];
			expect(milestones.length).toBeGreaterThanOrEqual(4);

			// Verify publication starts on anchor date
			const pub = milestones.find(
				(m: Record<string, string>) =>
					m.milestone_type === 'publication'
			);
			expect(pub?.target_date).toContain('2026-09-01');
		});
	});

	// ===========================================================================
	// STEP 4: CASCADE — Change publication date, verify cascade
	// ===========================================================================

	describe('Step 4: Cascade date change', () => {
		it('should update publication date and cascade downstream', async () => {
			if (testState.milestoneIds.length === 0) return;

			const pubId = testState.milestoneIds[0];
			const response = await fetch(
				`${BASE_URL}/api/projects/${testState.projectId}/milestones/${pubId}`,
				{
					method: 'PATCH',
					headers: authHeaders(),
					body: JSON.stringify({
						target_date: '2026-09-15',
						cascade: true
					})
				}
			);
			expect(response.status).toBe(200);
		});

		it('should have cascaded submission deadline', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/${testState.projectId}/milestones`,
				{ headers: authHeaders() }
			);
			expect(response.status).toBe(200);
			const json = await response.json();
			const milestones = json.data ?? [];
			const sub = milestones.find(
				(m: Record<string, string>) =>
					m.milestone_type === 'submission_deadline'
			);
			// Open procedure: submission >= publication + 35 days
			// 2026-09-15 + 35d = 2026-10-20
			if (sub?.target_date) {
				const subDate = new Date(sub.target_date);
				const minDate = new Date('2026-10-20');
				expect(subDate.getTime()).toBeGreaterThanOrEqual(
					minDate.getTime()
				);
			}
		});
	});

	// ===========================================================================
	// STEP 5: VERIFY — Milestones persist after cascade
	// ===========================================================================

	describe('Step 5: Persistence verification', () => {
		it('should persist cascaded dates on reload', async () => {
			const response = await fetch(
				`${BASE_URL}/api/projects/${testState.projectId}/milestones`,
				{ headers: authHeaders() }
			);
			expect(response.status).toBe(200);
			const json = await response.json();
			const milestones = json.data ?? [];

			const pub = milestones.find(
				(m: Record<string, string>) =>
					m.milestone_type === 'publication'
			);
			expect(pub?.target_date).toContain('2026-09-15');
		});
	});
});
