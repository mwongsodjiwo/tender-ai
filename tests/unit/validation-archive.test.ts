// Fase 54 — Zod validation tests: archive param schemas

import { describe, it, expect } from 'vitest';
import {
	archiveDocumentParamsSchema,
	archiveCorrespondenceParamsSchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('archiveDocumentParamsSchema', () => {
	it('accepts valid UUIDs', () => {
		const result = archiveDocumentParamsSchema.safeParse({
			id: VALID_UUID,
			docTypeId: VALID_UUID
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing id', () => {
		const result = archiveDocumentParamsSchema.safeParse({
			docTypeId: VALID_UUID
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing docTypeId', () => {
		const result = archiveDocumentParamsSchema.safeParse({
			id: VALID_UUID
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid UUID for id', () => {
		const result = archiveDocumentParamsSchema.safeParse({
			id: 'not-a-uuid',
			docTypeId: VALID_UUID
		});
		expect(result.success).toBe(false);
	});

	it('rejects null values', () => {
		const result = archiveDocumentParamsSchema.safeParse({
			id: null,
			docTypeId: null
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty strings', () => {
		const result = archiveDocumentParamsSchema.safeParse({
			id: '',
			docTypeId: ''
		});
		expect(result.success).toBe(false);
	});
});

describe('archiveCorrespondenceParamsSchema', () => {
	it('accepts valid UUIDs', () => {
		const result = archiveCorrespondenceParamsSchema.safeParse({
			id: VALID_UUID,
			letterId: VALID_UUID
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing letterId', () => {
		const result = archiveCorrespondenceParamsSchema.safeParse({
			id: VALID_UUID
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid UUID for letterId', () => {
		const result = archiveCorrespondenceParamsSchema.safeParse({
			id: VALID_UUID,
			letterId: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('rejects wrong types (number)', () => {
		const result = archiveCorrespondenceParamsSchema.safeParse({
			id: 123,
			letterId: 456
		});
		expect(result.success).toBe(false);
	});
});
