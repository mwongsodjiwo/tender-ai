// Fase 54 — Zod validation tests: document comment schemas

import { describe, it, expect } from 'vitest';
import {
	createDocumentCommentSchema,
	updateDocumentCommentSchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('createDocumentCommentSchema', () => {
	it('accepts valid comment data', () => {
		const result = createDocumentCommentSchema.safeParse({
			artifact_id: VALID_UUID,
			selected_text: 'Dit is de geselecteerde tekst',
			comment_text: 'Mijn opmerking hierover'
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

	it('rejects invalid UUID for artifact_id', () => {
		const result = createDocumentCommentSchema.safeParse({
			artifact_id: 'not-a-uuid',
			selected_text: 'Tekst',
			comment_text: 'Opmerking'
		});
		expect(result.success).toBe(false);
	});

	it('rejects text exceeding max length', () => {
		const result = createDocumentCommentSchema.safeParse({
			artifact_id: VALID_UUID,
			selected_text: 'x'.repeat(5001),
			comment_text: 'Opmerking'
		});
		expect(result.success).toBe(false);
	});
});

describe('updateDocumentCommentSchema', () => {
	it('accepts valid update with comment_text', () => {
		const result = updateDocumentCommentSchema.safeParse({
			comment_text: 'Bijgewerkte opmerking'
		});
		expect(result.success).toBe(true);
	});

	it('accepts resolved boolean', () => {
		const result = updateDocumentCommentSchema.safeParse({
			resolved: true
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (all optional)', () => {
		const result = updateDocumentCommentSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects wrong type for resolved', () => {
		const result = updateDocumentCommentSchema.safeParse({
			resolved: 'yes'
		});
		expect(result.success).toBe(false);
	});

	it('rejects comment_text exceeding max', () => {
		const result = updateDocumentCommentSchema.safeParse({
			comment_text: 'x'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});
});
