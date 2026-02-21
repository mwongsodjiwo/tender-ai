// Fase 54 — Zod validation tests: auth admin schemas

import { describe, it, expect } from 'vitest';
import {
	inviteMemberSchema,
	adminAddMemberSchema,
	adminUpdateMemberRoleSchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('inviteMemberSchema', () => {
	it('accepts valid invite data', () => {
		const result = inviteMemberSchema.safeParse({
			email: 'jan@example.com',
			role: 'member'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing email', () => {
		const result = inviteMemberSchema.safeParse({ role: 'member' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid email format', () => {
		const result = inviteMemberSchema.safeParse({
			email: 'not-valid',
			role: 'admin'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid role value', () => {
		const result = inviteMemberSchema.safeParse({
			email: 'jan@example.com',
			role: 'superuser'
		});
		expect(result.success).toBe(false);
	});

	it('accepts all valid roles', () => {
		for (const role of ['owner', 'admin', 'member', 'external_advisor', 'auditor']) {
			const result = inviteMemberSchema.safeParse({
				email: 'test@example.com',
				role
			});
			expect(result.success).toBe(true);
		}
	});
});

describe('adminAddMemberSchema', () => {
	it('accepts valid admin add member data', () => {
		const result = adminAddMemberSchema.safeParse({
			email: 'admin@example.com',
			role: 'admin'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing role', () => {
		const result = adminAddMemberSchema.safeParse({
			email: 'admin@example.com'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty email string', () => {
		const result = adminAddMemberSchema.safeParse({
			email: '',
			role: 'member'
		});
		expect(result.success).toBe(false);
	});

	it('rejects wrong type for email (number)', () => {
		const result = adminAddMemberSchema.safeParse({
			email: 12345,
			role: 'member'
		});
		expect(result.success).toBe(false);
	});

	it('rejects null values', () => {
		const result = adminAddMemberSchema.safeParse({
			email: null,
			role: null
		});
		expect(result.success).toBe(false);
	});
});

describe('adminUpdateMemberRoleSchema', () => {
	it('accepts valid role update', () => {
		const result = adminUpdateMemberRoleSchema.safeParse({
			role: 'external_advisor'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing role', () => {
		const result = adminUpdateMemberRoleSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects invalid role string', () => {
		const result = adminUpdateMemberRoleSchema.safeParse({
			role: 'god_mode'
		});
		expect(result.success).toBe(false);
	});

	it('rejects wrong type (number)', () => {
		const result = adminUpdateMemberRoleSchema.safeParse({
			role: 42
		});
		expect(result.success).toBe(false);
	});
});
