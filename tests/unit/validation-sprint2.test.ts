// Unit tests: Sprint 2 validation schemas (assembly, export, regeneration, context search, section chat)

import { describe, it, expect } from 'vitest';
import {
	assembleDocumentSchema,
	exportDocumentSchema,
	regenerateSectionSchema,
	contextSearchSchema,
	sectionChatSchema
} from '../../src/lib/server/api/validation';

// =============================================================================
// ASSEMBLE DOCUMENT
// =============================================================================

describe('assembleDocumentSchema', () => {
	it('should accept valid document_type_id', () => {
		const result = assembleDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid UUID', () => {
		const result = assembleDocumentSchema.safeParse({
			document_type_id: 'not-a-uuid'
		});
		expect(result.success).toBe(false);
	});

	it('should reject missing document_type_id', () => {
		const result = assembleDocumentSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// EXPORT DOCUMENT
// =============================================================================

describe('exportDocumentSchema', () => {
	it('should accept docx format', () => {
		const result = exportDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			format: 'docx'
		});
		expect(result.success).toBe(true);
	});

	it('should accept pdf format', () => {
		const result = exportDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			format: 'pdf'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid format', () => {
		const result = exportDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000',
			format: 'html'
		});
		expect(result.success).toBe(false);
	});

	it('should reject missing format', () => {
		const result = exportDocumentSchema.safeParse({
			document_type_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid document_type_id', () => {
		const result = exportDocumentSchema.safeParse({
			document_type_id: 'not-a-uuid',
			format: 'docx'
		});
		expect(result.success).toBe(false);
	});

	it('should reject missing document_type_id', () => {
		const result = exportDocumentSchema.safeParse({
			format: 'pdf'
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// REGENERATE SECTION
// =============================================================================

describe('regenerateSectionSchema', () => {
	it('should accept with artifact_id only', () => {
		const result = regenerateSectionSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('should accept with instructions', () => {
		const result = regenerateSectionSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			instructions: 'Maak de tekst meer specifiek voor ICT-dienstverlening'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid artifact_id', () => {
		const result = regenerateSectionSchema.safeParse({
			artifact_id: 'not-a-uuid'
		});
		expect(result.success).toBe(false);
	});

	it('should reject missing artifact_id', () => {
		const result = regenerateSectionSchema.safeParse({
			instructions: 'Verbeter de tekst'
		});
		expect(result.success).toBe(false);
	});

	it('should reject instructions longer than 2000 chars', () => {
		const result = regenerateSectionSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			instructions: 'x'.repeat(2001)
		});
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// CONTEXT SEARCH
// =============================================================================

describe('contextSearchSchema', () => {
	it('should accept valid search query', () => {
		const result = contextSearchSchema.safeParse({
			query: 'selectiecriteria'
		});
		expect(result.success).toBe(true);
	});

	it('should accept with project_id', () => {
		const result = contextSearchSchema.safeParse({
			query: 'gunningscriteria',
			project_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('should accept with custom limit', () => {
		const result = contextSearchSchema.safeParse({
			query: 'proportionaliteit',
			limit: 10
		});
		expect(result.success).toBe(true);
	});

	it('should reject too short query', () => {
		const result = contextSearchSchema.safeParse({
			query: 'x'
		});
		expect(result.success).toBe(false);
	});

	it('should reject too long query', () => {
		const result = contextSearchSchema.safeParse({
			query: 'x'.repeat(501)
		});
		expect(result.success).toBe(false);
	});

	it('should reject limit over 20', () => {
		const result = contextSearchSchema.safeParse({
			query: 'selectiecriteria',
			limit: 25
		});
		expect(result.success).toBe(false);
	});

	it('should reject limit of 0', () => {
		const result = contextSearchSchema.safeParse({
			query: 'selectiecriteria',
			limit: 0
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid project_id', () => {
		const result = contextSearchSchema.safeParse({
			query: 'selectiecriteria',
			project_id: 'not-a-uuid'
		});
		expect(result.success).toBe(false);
	});

	it('should default limit to 5', () => {
		const result = contextSearchSchema.safeParse({
			query: 'selectiecriteria'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(5);
		}
	});
});

// =============================================================================
// SECTION CHAT
// =============================================================================

describe('sectionChatSchema', () => {
	it('should accept valid message with artifact_id', () => {
		const result = sectionChatSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			message: 'Kun je de inleiding meer specifiek maken?'
		});
		expect(result.success).toBe(true);
	});

	it('should accept with conversation_id', () => {
		const result = sectionChatSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			conversation_id: '660e8400-e29b-41d4-a716-446655440000',
			message: 'Verwerk de feedback van de jurist'
		});
		expect(result.success).toBe(true);
	});

	it('should accept without conversation_id (new conversation)', () => {
		const result = sectionChatSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			message: 'Eerste vraag over deze sectie'
		});
		expect(result.success).toBe(true);
	});

	it('should reject empty message', () => {
		const result = sectionChatSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			message: ''
		});
		expect(result.success).toBe(false);
	});

	it('should reject message longer than 10000 chars', () => {
		const result = sectionChatSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			message: 'x'.repeat(10001)
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid artifact_id', () => {
		const result = sectionChatSchema.safeParse({
			artifact_id: 'not-a-uuid',
			message: 'Test'
		});
		expect(result.success).toBe(false);
	});

	it('should reject missing artifact_id', () => {
		const result = sectionChatSchema.safeParse({
			message: 'Test'
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid conversation_id', () => {
		const result = sectionChatSchema.safeParse({
			artifact_id: '550e8400-e29b-41d4-a716-446655440000',
			conversation_id: 'not-a-uuid',
			message: 'Test'
		});
		expect(result.success).toBe(false);
	});
});
