// Fase 54 — Zod validation tests: member search & update schemas

import { describe, it, expect } from 'vitest';
import {
	memberSearchSchema,
	updateMemberSchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('memberSearchSchema', () => {
	it('accepts valid search with defaults', () => {
		const result = memberSearchSchema.safeParse({
			search: 'Jan'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe('all');
			expect(result.data.limit).toBe(25);
			expect(result.data.offset).toBe(0);
		}
	});

	it('accepts empty object with defaults', () => {
		const result = memberSearchSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts status filter', () => {
		const result = memberSearchSchema.safeParse({
			status: 'active'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid status', () => {
		const result = memberSearchSchema.safeParse({
			status: 'suspended'
		});
		expect(result.success).toBe(false);
	});

	it('rejects search exceeding max length', () => {
		const result = memberSearchSchema.safeParse({
			search: 'x'.repeat(201)
		});
		expect(result.success).toBe(false);
	});

	it('rejects limit above 100', () => {
		const result = memberSearchSchema.safeParse({
			limit: 200
		});
		expect(result.success).toBe(false);
	});
});

describe('updateMemberSchema', () => {
	it('accepts valid status update', () => {
		const result = updateMemberSchema.safeParse({
			status: 'inactive'
		});
		expect(result.success).toBe(true);
	});

	it('accepts manager_id UUID', () => {
		const result = updateMemberSchema.safeParse({
			manager_id: VALID_UUID
		});
		expect(result.success).toBe(true);
	});

	it('accepts nullable manager_id', () => {
		const result = updateMemberSchema.safeParse({
			manager_id: null
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object (all optional)', () => {
		const result = updateMemberSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('rejects invalid status value', () => {
		const result = updateMemberSchema.safeParse({
			status: 'banned'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid manager_id', () => {
		const result = updateMemberSchema.safeParse({
			manager_id: 'not-a-uuid'
		});
		expect(result.success).toBe(false);
	});
});
