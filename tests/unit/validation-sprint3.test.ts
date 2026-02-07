// Unit tests: Sprint 3 validation schemas — Collaboration & Review

import { describe, it, expect } from 'vitest';
import {
	updateProjectMemberRolesSchema,
	inviteReviewerSchema,
	updateReviewSchema,
	reviewChatSchema,
	auditLogQuerySchema
} from '../../src/lib/server/api/validation';

// =============================================================================
// PROJECT MEMBER ROLES
// =============================================================================

describe('updateProjectMemberRolesSchema', () => {
	it('should accept valid roles array', () => {
		const result = updateProjectMemberRolesSchema.safeParse({
			roles: ['project_leader', 'legal_advisor']
		});
		expect(result.success).toBe(true);
	});

	it('should accept single role', () => {
		const result = updateProjectMemberRolesSchema.safeParse({
			roles: ['procurement_advisor']
		});
		expect(result.success).toBe(true);
	});

	it('should reject empty roles array', () => {
		const result = updateProjectMemberRolesSchema.safeParse({
			roles: []
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid role values', () => {
		const result = updateProjectMemberRolesSchema.safeParse({
			roles: ['invalid_role']
		});
		expect(result.success).toBe(false);
	});

	it('should accept all valid project roles', () => {
		const result = updateProjectMemberRolesSchema.safeParse({
			roles: ['project_leader', 'procurement_advisor', 'legal_advisor', 'budget_holder', 'subject_expert', 'viewer']
		});
		expect(result.success).toBe(true);
	});
});

// =============================================================================
// SECTION REVIEWERS
// =============================================================================

describe('inviteReviewerSchema', () => {
	it('should accept valid reviewer invitation', () => {
		const result = inviteReviewerSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			email: 'expert@gemeente.nl',
			name: 'Jan de Vries'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid email', () => {
		const result = inviteReviewerSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			email: 'not-an-email',
			name: 'Jan de Vries'
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid UUID for artifact_id', () => {
		const result = inviteReviewerSchema.safeParse({
			artifact_id: 'not-a-uuid',
			email: 'expert@gemeente.nl',
			name: 'Jan de Vries'
		});
		expect(result.success).toBe(false);
	});

	it('should reject short name', () => {
		const result = inviteReviewerSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			email: 'expert@gemeente.nl',
			name: 'J'
		});
		expect(result.success).toBe(false);
	});

	it('should reject missing fields', () => {
		const result = inviteReviewerSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// UPDATE REVIEW
// =============================================================================

describe('updateReviewSchema', () => {
	it('should accept approval without feedback', () => {
		const result = updateReviewSchema.safeParse({
			review_status: 'approved'
		});
		expect(result.success).toBe(true);
	});

	it('should accept rejection with feedback', () => {
		const result = updateReviewSchema.safeParse({
			review_status: 'rejected',
			feedback: 'De selectiecriteria zijn te streng voor deze markt.'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid status', () => {
		const result = updateReviewSchema.safeParse({
			review_status: 'pending'
		});
		expect(result.success).toBe(false);
	});

	it('should reject status not in approved/rejected', () => {
		const result = updateReviewSchema.safeParse({
			review_status: 'unknown'
		});
		expect(result.success).toBe(false);
	});

	it('should accept approval with feedback', () => {
		const result = updateReviewSchema.safeParse({
			review_status: 'approved',
			feedback: 'Ziet er goed uit, kleine textcorrectie op pagina 3.'
		});
		expect(result.success).toBe(true);
	});

	it('should reject feedback exceeding max length', () => {
		const result = updateReviewSchema.safeParse({
			review_status: 'approved',
			feedback: 'x'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// REVIEW CHAT
// =============================================================================

describe('reviewChatSchema', () => {
	it('should accept valid review chat message', () => {
		const result = reviewChatSchema.safeParse({
			token: 'abc123def456',
			message: 'Wat is de reden voor de geschiktheidseisen in sectie 3?'
		});
		expect(result.success).toBe(true);
	});

	it('should accept with conversation_id', () => {
		const result = reviewChatSchema.safeParse({
			token: 'abc123def456',
			conversation_id: '550e8400-e29b-41d4-a716-446655440000',
			message: 'Bedankt, kun je de formulering aanpassen?'
		});
		expect(result.success).toBe(true);
	});

	it('should reject empty token', () => {
		const result = reviewChatSchema.safeParse({
			token: '',
			message: 'Test'
		});
		expect(result.success).toBe(false);
	});

	it('should reject empty message', () => {
		const result = reviewChatSchema.safeParse({
			token: 'abc123',
			message: ''
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid conversation_id', () => {
		const result = reviewChatSchema.safeParse({
			token: 'abc123',
			conversation_id: 'not-a-uuid',
			message: 'Test bericht'
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// AUDIT LOG QUERY
// =============================================================================

describe('auditLogQuerySchema', () => {
	it('should accept empty query (uses defaults)', () => {
		const result = auditLogQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.page).toBe(1);
			expect(result.data.per_page).toBe(25);
		}
	});

	it('should accept valid query parameters', () => {
		const result = auditLogQuerySchema.safeParse({
			page: '2',
			per_page: '10',
			action: 'create',
			entity_type: 'artifact'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.page).toBe(2);
			expect(result.data.per_page).toBe(10);
			expect(result.data.action).toBe('create');
		}
	});

	it('should accept valid actor_id filter', () => {
		const result = auditLogQuerySchema.safeParse({
			actor_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid action', () => {
		const result = auditLogQuerySchema.safeParse({
			action: 'invalid_action'
		});
		expect(result.success).toBe(false);
	});

	it('should reject per_page exceeding max', () => {
		const result = auditLogQuerySchema.safeParse({
			per_page: '200'
		});
		expect(result.success).toBe(false);
	});

	it('should coerce string numbers to numbers', () => {
		const result = auditLogQuerySchema.safeParse({
			page: '5',
			per_page: '50'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(typeof result.data.page).toBe('number');
			expect(typeof result.data.per_page).toBe('number');
		}
	});
});
