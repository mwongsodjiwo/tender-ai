// Fase 54 — Zod validation tests: document template schemas

import { describe, it, expect } from 'vitest';
import {
	uploadTemplateSchema,
	uploadTemplateFileValidation,
	updateTemplateSchema,
	listTemplatesSchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

describe('uploadTemplateSchema', () => {
	it('accepts valid upload data', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: VALID_UUID,
			document_type_id: VALID_UUID,
			name: 'Standaard PvE template'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing name', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: VALID_UUID,
			document_type_id: VALID_UUID
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid organization_id', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: 'invalid',
			document_type_id: VALID_UUID,
			name: 'Template'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty name', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: VALID_UUID,
			document_type_id: VALID_UUID,
			name: ''
		});
		expect(result.success).toBe(false);
	});

	it('accepts nullable category_type', () => {
		const result = uploadTemplateSchema.safeParse({
			organization_id: VALID_UUID,
			document_type_id: VALID_UUID,
			name: 'Template',
			category_type: null
		});
		expect(result.success).toBe(true);
	});
});

describe('uploadTemplateFileValidation', () => {
	it('accepts valid docx file', () => {
		const result = uploadTemplateFileValidation.safeParse({
			size: 1024 * 1024,
			type: DOCX_MIME
		});
		expect(result.success).toBe(true);
	});

	it('rejects file exceeding 50MB', () => {
		const result = uploadTemplateFileValidation.safeParse({
			size: 60 * 1024 * 1024,
			type: DOCX_MIME
		});
		expect(result.success).toBe(false);
	});

	it('rejects non-docx mime type', () => {
		const result = uploadTemplateFileValidation.safeParse({
			size: 1024,
			type: 'application/pdf'
		});
		expect(result.success).toBe(false);
	});

	it('rejects wrong type for size', () => {
		const result = uploadTemplateFileValidation.safeParse({
			size: '1024',
			type: DOCX_MIME
		});
		expect(result.success).toBe(false);
	});
});

describe('updateTemplateSchema', () => {
	it('accepts partial update', () => {
		const result = updateTemplateSchema.safeParse({
			name: 'Nieuwe naam'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object', () => {
		const result = updateTemplateSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts is_default boolean', () => {
		const result = updateTemplateSchema.safeParse({
			is_default: true
		});
		expect(result.success).toBe(true);
	});

	it('rejects name exceeding max', () => {
		const result = updateTemplateSchema.safeParse({
			name: 'x'.repeat(301)
		});
		expect(result.success).toBe(false);
	});
});

describe('listTemplatesSchema', () => {
	it('accepts valid list query', () => {
		const result = listTemplatesSchema.safeParse({
			organization_id: VALID_UUID,
			document_type_id: VALID_UUID
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing organization_id', () => {
		const result = listTemplatesSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('accepts without optional document_type_id', () => {
		const result = listTemplatesSchema.safeParse({
			organization_id: VALID_UUID
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid UUID', () => {
		const result = listTemplatesSchema.safeParse({
			organization_id: 'not-valid'
		});
		expect(result.success).toBe(false);
	});
});
