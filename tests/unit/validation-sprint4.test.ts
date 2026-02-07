// Unit tests for Sprint 4 validation schemas

import { describe, it, expect } from 'vitest';
import {
	uploadDocumentSchema,
	uploadFileValidation,
	tenderNedSearchSchema,
	contextSearchSchema
} from '../../src/lib/server/api/validation';

describe('Upload document schema', () => {
	it('accepts valid upload metadata', () => {
		const result = uploadDocumentSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			project_id: '550e8400-e29b-41d4-a716-446655440001',
			category: 'reference',
			name: 'test-document.pdf'
		});
		expect(result.success).toBe(true);
	});

	it('accepts without optional project_id', () => {
		const result = uploadDocumentSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			category: 'policy'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid organization_id', () => {
		const result = uploadDocumentSchema.safeParse({
			organization_id: 'not-a-uuid',
			category: 'reference'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid category', () => {
		const result = uploadDocumentSchema.safeParse({
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			category: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('accepts all valid document categories', () => {
		const categories = ['policy', 'specification', 'template', 'reference', 'tenderned'];
		for (const category of categories) {
			const result = uploadDocumentSchema.safeParse({
				organization_id: '550e8400-e29b-41d4-a716-446655440000',
				category
			});
			expect(result.success).toBe(true);
		}
	});
});

describe('Upload file validation', () => {
	it('accepts valid PDF file', () => {
		const result = uploadFileValidation.safeParse({
			size: 1024 * 1024, // 1 MB
			type: 'application/pdf'
		});
		expect(result.success).toBe(true);
	});

	it('accepts valid DOCX file', () => {
		const result = uploadFileValidation.safeParse({
			size: 500 * 1024,
			type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		});
		expect(result.success).toBe(true);
	});

	it('accepts valid CSV file', () => {
		const result = uploadFileValidation.safeParse({
			size: 100 * 1024,
			type: 'text/csv'
		});
		expect(result.success).toBe(true);
	});

	it('rejects file exceeding 50 MB', () => {
		const result = uploadFileValidation.safeParse({
			size: 51 * 1024 * 1024,
			type: 'application/pdf'
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain('50 MB');
		}
	});

	it('rejects unsupported file type', () => {
		const result = uploadFileValidation.safeParse({
			size: 1024,
			type: 'image/png'
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.errors[0].message).toContain('niet toegestaan');
		}
	});

	it('accepts zero-size file', () => {
		const result = uploadFileValidation.safeParse({
			size: 0,
			type: 'text/plain'
		});
		expect(result.success).toBe(true);
	});
});

describe('TenderNed search schema', () => {
	it('accepts valid search query', () => {
		const result = tenderNedSearchSchema.safeParse({
			query: 'ICT diensten',
			limit: 10,
			offset: 0
		});
		expect(result.success).toBe(true);
	});

	it('applies default limit and offset', () => {
		const result = tenderNedSearchSchema.safeParse({
			query: 'bouwwerkzaamheden'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(10);
			expect(result.data.offset).toBe(0);
		}
	});

	it('accepts procedure_type filter', () => {
		const result = tenderNedSearchSchema.safeParse({
			query: 'onderhoud',
			procedure_type: 'open'
		});
		expect(result.success).toBe(true);
	});

	it('accepts cpv_code filter', () => {
		const result = tenderNedSearchSchema.safeParse({
			query: 'schoonmaak',
			cpv_code: '90910000'
		});
		expect(result.success).toBe(true);
	});

	it('rejects query shorter than 2 characters', () => {
		const result = tenderNedSearchSchema.safeParse({
			query: 'a'
		});
		expect(result.success).toBe(false);
	});

	it('rejects limit above 50', () => {
		const result = tenderNedSearchSchema.safeParse({
			query: 'test',
			limit: 100
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid procedure_type', () => {
		const result = tenderNedSearchSchema.safeParse({
			query: 'test',
			procedure_type: 'invalid_procedure'
		});
		expect(result.success).toBe(false);
	});
});

describe('Context search schema (updated)', () => {
	it('accepts organization_id parameter', () => {
		const result = contextSearchSchema.safeParse({
			query: 'aanbestedingswet',
			organization_id: '550e8400-e29b-41d4-a716-446655440000',
			project_id: '550e8400-e29b-41d4-a716-446655440001',
			limit: 5
		});
		expect(result.success).toBe(true);
	});

	it('still works without organization_id', () => {
		const result = contextSearchSchema.safeParse({
			query: 'selectiecriteria',
			project_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});
});
