// Unit tests for document comments validation schemas and types

import { describe, it, expect } from 'vitest';
import {
	createDocumentCommentSchema,
	updateDocumentCommentSchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('createDocumentCommentSchema', () => {
	it('accepts a valid comment', () => {
		const result = createDocumentCommentSchema.safeParse({
			artifact_id: VALID_UUID,
			selected_text: 'De opdrachtgever behoudt zich het recht voor',
			comment_text: 'Deze formulering is te vaag, specificeer welk recht.'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing artifact_id', () => {
		const result = createDocumentCommentSchema.safeParse({
			selected_text: 'Tekst',
			comment_text: 'Opmerking'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid artifact_id', () => {
		const result = createDocumentCommentSchema.safeParse({
			artifact_id: 'not-a-uuid',
			selected_text: 'Tekst',
			comment_text: 'Opmerking'
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.artifact_id).toBeDefined();
		}
	});

	it('rejects empty selected_text', () => {
		const result = createDocumentCommentSchema.safeParse({
			artifact_id: VALID_UUID,
			selected_text: '',
			comment_text: 'Opmerking'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty comment_text', () => {
		const result = createDocumentCommentSchema.safeParse({
			artifact_id: VALID_UUID,
			selected_text: 'Tekst',
			comment_text: ''
		});
		expect(result.success).toBe(false);
	});

	it('rejects selected_text exceeding max length', () => {
		const result = createDocumentCommentSchema.safeParse({
			artifact_id: VALID_UUID,
			selected_text: 'a'.repeat(5001),
			comment_text: 'Opmerking'
		});
		expect(result.success).toBe(false);
	});

	it('rejects comment_text exceeding max length', () => {
		const result = createDocumentCommentSchema.safeParse({
			artifact_id: VALID_UUID,
			selected_text: 'Tekst',
			comment_text: 'a'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts maximum length values', () => {
		const result = createDocumentCommentSchema.safeParse({
			artifact_id: VALID_UUID,
			selected_text: 'a'.repeat(5000),
			comment_text: 'a'.repeat(5000)
		});
		expect(result.success).toBe(true);
	});
});

describe('updateDocumentCommentSchema', () => {
	it('accepts resolved update', () => {
		const result = updateDocumentCommentSchema.safeParse({
			resolved: true
		});
		expect(result.success).toBe(true);
	});

	it('accepts comment_text update', () => {
		const result = updateDocumentCommentSchema.safeParse({
			comment_text: 'Aangepaste opmerking'
		});
		expect(result.success).toBe(true);
	});

	it('accepts both fields', () => {
		const result = updateDocumentCommentSchema.safeParse({
			comment_text: 'Nieuwe tekst',
			resolved: false
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (all optional)', () => {
		const result = updateDocumentCommentSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects empty comment_text', () => {
		const result = updateDocumentCommentSchema.safeParse({
			comment_text: ''
		});
		expect(result.success).toBe(false);
	});

	it('rejects non-boolean resolved', () => {
		const result = updateDocumentCommentSchema.safeParse({
			resolved: 'true'
		});
		expect(result.success).toBe(false);
	});

	it('rejects comment_text exceeding max length', () => {
		const result = updateDocumentCommentSchema.safeParse({
			comment_text: 'a'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});
});
