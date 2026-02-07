// Unit tests: Zod validation schemas

import { describe, it, expect } from 'vitest';
import {
	loginSchema,
	registerSchema,
	createOrganizationSchema,
	updateProfileSchema,
	chatMessageSchema
} from '../../src/lib/server/api/validation';

describe('loginSchema', () => {
	it('should accept valid login data', () => {
		const result = loginSchema.safeParse({
			email: 'test@example.com',
			password: 'password123'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid email', () => {
		const result = loginSchema.safeParse({
			email: 'not-an-email',
			password: 'password123'
		});
		expect(result.success).toBe(false);
	});

	it('should reject short password', () => {
		const result = loginSchema.safeParse({
			email: 'test@example.com',
			password: 'short'
		});
		expect(result.success).toBe(false);
	});
});

describe('registerSchema', () => {
	it('should accept valid registration data', () => {
		const result = registerSchema.safeParse({
			email: 'test@example.com',
			password: 'password123',
			full_name: 'Jan de Vries'
		});
		expect(result.success).toBe(true);
	});

	it('should reject missing full_name', () => {
		const result = registerSchema.safeParse({
			email: 'test@example.com',
			password: 'password123'
		});
		expect(result.success).toBe(false);
	});

	it('should reject short full_name', () => {
		const result = registerSchema.safeParse({
			email: 'test@example.com',
			password: 'password123',
			full_name: 'J'
		});
		expect(result.success).toBe(false);
	});
});

describe('createOrganizationSchema', () => {
	it('should accept valid organization data', () => {
		const result = createOrganizationSchema.safeParse({
			name: 'Gemeente Amsterdam',
			slug: 'gemeente-amsterdam',
			description: 'Gemeente Amsterdam inkoopafdeling'
		});
		expect(result.success).toBe(true);
	});

	it('should accept without optional description', () => {
		const result = createOrganizationSchema.safeParse({
			name: 'Gemeente Amsterdam',
			slug: 'gemeente-amsterdam'
		});
		expect(result.success).toBe(true);
	});

	it('should reject invalid slug with uppercase', () => {
		const result = createOrganizationSchema.safeParse({
			name: 'Gemeente Amsterdam',
			slug: 'Gemeente-Amsterdam'
		});
		expect(result.success).toBe(false);
	});

	it('should reject slug with spaces', () => {
		const result = createOrganizationSchema.safeParse({
			name: 'Gemeente Amsterdam',
			slug: 'gemeente amsterdam'
		});
		expect(result.success).toBe(false);
	});
});

describe('updateProfileSchema', () => {
	it('should accept partial update', () => {
		const result = updateProfileSchema.safeParse({
			full_name: 'Jan de Vries'
		});
		expect(result.success).toBe(true);
	});

	it('should accept empty object', () => {
		const result = updateProfileSchema.safeParse({});
		expect(result.success).toBe(true);
	});
});

describe('chatMessageSchema', () => {
	it('should accept valid chat message', () => {
		const result = chatMessageSchema.safeParse({
			conversation_id: '550e8400-e29b-41d4-a716-446655440000',
			message: 'Hallo, ik wil een aanbesteding starten'
		});
		expect(result.success).toBe(true);
	});

	it('should reject empty message', () => {
		const result = chatMessageSchema.safeParse({
			conversation_id: '550e8400-e29b-41d4-a716-446655440000',
			message: ''
		});
		expect(result.success).toBe(false);
	});

	it('should reject invalid UUID', () => {
		const result = chatMessageSchema.safeParse({
			conversation_id: 'not-a-uuid',
			message: 'Hallo'
		});
		expect(result.success).toBe(false);
	});
});
