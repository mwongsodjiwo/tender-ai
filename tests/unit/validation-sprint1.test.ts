// Unit tests: Sprint 1 validation schemas (projects, members, artifacts, briefing)

import { describe, it, expect } from 'vitest';
import {
	createProjectSchema,
	updateProjectSchema,
	addProjectMemberSchema,
	createArtifactSchema,
	updateArtifactSchema,
	createConversationSchema,
	briefingStartSchema,
	briefingMessageSchema
} from '../../src/lib/server/api/validation';

describe('createProjectSchema', () => {
	it('should accept valid project data', () => {
		const result = createProjectSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'ICT-aanbesteding 2026'
		});
		expect(result.success).toBe(true);
	});

	it('should accept with all optional fields', () => {
		const result = createProjectSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'ICT-aanbesteding 2026',
			description: 'Europese aanbesteding voor ICT-diensten',
			procedure_type: 'open',
			estimated_value: 500000,
			publication_date: '2026-06-01',
			deadline_date: '2026-07-15'
		});
		expect(result.success).toBe(true);
	});

	it('should reject missing organization_id', () => {
		const result = createProjectSchema.safeParse({
			name: 'ICT-aanbesteding 2026'
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid organization_id', () => {
		const result = createProjectSchema.safeParse({
			organization_id: 'not-a-uuid',
			name: 'ICT-aanbesteding 2026'
		});
		expect(result.success).toBe(false);
	});

	it('should reject short name', () => {
		const result = createProjectSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'X'
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid procedure type', () => {
		const result = createProjectSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'ICT-aanbesteding 2026',
			procedure_type: 'invalid_type'
		});
		expect(result.success).toBe(false);
	});

	it('should reject negative estimated value', () => {
		const result = createProjectSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			name: 'ICT-aanbesteding 2026',
			estimated_value: -100
		});
		expect(result.success).toBe(false);
	});
});

describe('updateProjectSchema', () => {
	it('should accept partial update', () => {
		const result = updateProjectSchema.safeParse({
			name: 'Nieuwe naam'
		});
		expect(result.success).toBe(true);
	});

	it('should accept status change', () => {
		const result = updateProjectSchema.safeParse({
			status: 'briefing'
		});
		expect(result.success).toBe(true);
	});

	it('should accept briefing_data update', () => {
		const result = updateProjectSchema.safeParse({
			briefing_data: { summary: 'test', questions: [] }
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid status', () => {
		const result = updateProjectSchema.safeParse({
			status: 'nonexistent_status'
		});
		expect(result.success).toBe(false);
	});
});

describe('addProjectMemberSchema', () => {
	it('should accept valid member with single role', () => {
		const result = addProjectMemberSchema.safeParse({
			profile_id: '550e8400-e29b-41d4-a716-446655440000',
			roles: ['procurement_advisor']
		});
		expect(result.success).toBe(true);
	});

	it('should accept multiple roles', () => {
		const result = addProjectMemberSchema.safeParse({
			profile_id: '550e8400-e29b-41d4-a716-446655440000',
			roles: ['project_leader', 'procurement_advisor']
		});
		expect(result.success).toBe(true);
	});

	it('should reject empty roles array', () => {
		const result = addProjectMemberSchema.safeParse({
			profile_id: '550e8400-e29b-41d4-a716-446655440000',
			roles: []
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid role', () => {
		const result = addProjectMemberSchema.safeParse({
			profile_id: '550e8400-e29b-41d4-a716-446655440000',
			roles: ['invalid_role']
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid profile_id', () => {
		const result = addProjectMemberSchema.safeParse({
			profile_id: 'not-a-uuid',
			roles: ['viewer']
		});
		expect(result.success).toBe(false);
	});
});

describe('createArtifactSchema', () => {
	it('should accept valid artifact', () => {
		const result = createArtifactSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			section_key: 'introduction',
			title: 'Inleiding'
		});
		expect(result.success).toBe(true);
	});

	it('should accept with all fields', () => {
		const result = createArtifactSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			section_key: 'introduction',
			title: 'Inleiding',
			content: 'Dit is de inhoud van de inleiding.',
			sort_order: 1,
			metadata: { generated: true }
		});
		expect(result.success).toBe(true);
	});

	it('should reject missing title', () => {
		const result = createArtifactSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			section_key: 'introduction'
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid document_type_id', () => {
		const result = createArtifactSchema.safeParse({
			document_type_id: 'not-a-uuid',
			section_key: 'introduction',
			title: 'Inleiding'
		});
		expect(result.success).toBe(false);
	});
});

describe('updateArtifactSchema', () => {
	it('should accept content update', () => {
		const result = updateArtifactSchema.safeParse({
			content: 'Bijgewerkte inhoud'
		});
		expect(result.success).toBe(true);
	});

	it('should accept status change', () => {
		const result = updateArtifactSchema.safeParse({
			status: 'approved'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid status', () => {
		const result = updateArtifactSchema.safeParse({
			status: 'invalid'
		});
		expect(result.success).toBe(false);
	});
});

describe('createConversationSchema', () => {
	it('should accept valid conversation', () => {
		const result = createConversationSchema.safeParse({
			project_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('should accept with optional fields', () => {
		const result = createConversationSchema.safeParse({
			project_id: '550e8400-e29b-41d4-a716-446655440000',
			artifact_id: '660e8400-e29b-41d4-a716-446655440000',
			title: 'Bespreking inleiding',
			context_type: 'review'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid project_id', () => {
		const result = createConversationSchema.safeParse({
			project_id: 'not-a-uuid'
		});
		expect(result.success).toBe(false);
	});
});

describe('briefingStartSchema', () => {
	it('should accept valid project_id', () => {
		const result = briefingStartSchema.safeParse({
			project_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid project_id', () => {
		const result = briefingStartSchema.safeParse({
			project_id: 'not-a-uuid'
		});
		expect(result.success).toBe(false);
	});

	it('should reject missing project_id', () => {
		const result = briefingStartSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

describe('briefingMessageSchema', () => {
	it('should accept valid briefing message', () => {
		const result = briefingMessageSchema.safeParse({
			project_id: '550e8400-e29b-41d4-a716-446655440000',
			conversation_id: '660e8400-e29b-41d4-a716-446655440000',
			message: 'We willen ICT-dienstverlening inkopen voor onze gemeente.'
		});
		expect(result.success).toBe(true);
	});

	it('should reject empty message', () => {
		const result = briefingMessageSchema.safeParse({
			project_id: '550e8400-e29b-41d4-a716-446655440000',
			conversation_id: '660e8400-e29b-41d4-a716-446655440000',
			message: ''
		});
		expect(result.success).toBe(false);
	});

	it('should reject missing conversation_id', () => {
		const result = briefingMessageSchema.safeParse({
			project_id: '550e8400-e29b-41d4-a716-446655440000',
			message: 'Test'
		});
		expect(result.success).toBe(false);
	});
});
