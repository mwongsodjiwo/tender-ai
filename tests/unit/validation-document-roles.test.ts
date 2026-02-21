// Fase 54 — Zod validation tests: document role schemas

import { describe, it, expect } from 'vitest';
import {
	createDocumentRoleSchema,
	updateDocumentRoleSchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('createDocumentRoleSchema', () => {
	it('accepts valid document role', () => {
		const result = createDocumentRoleSchema.safeParse({
			role_key: 'inkoper',
			role_label: 'Inkoper'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing role_label', () => {
		const result = createDocumentRoleSchema.safeParse({
			role_key: 'inkoper'
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid role_key', () => {
		const result = createDocumentRoleSchema.safeParse({
			role_key: 'onbekende_rol',
			role_label: 'Onbekend'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty role_label', () => {
		const result = createDocumentRoleSchema.safeParse({
			role_key: 'contactpersoon',
			role_label: ''
		});
		expect(result.success).toBe(false);
	});

	it('accepts all valid role_keys', () => {
		const keys = [
			'contactpersoon', 'inkoper', 'projectleider',
			'budgethouder', 'juridisch_adviseur'
		];
		for (const role_key of keys) {
			const result = createDocumentRoleSchema.safeParse({
				role_key,
				role_label: 'Label'
			});
			expect(result.success).toBe(true);
		}
	});

	it('accepts optional person fields', () => {
		const result = createDocumentRoleSchema.safeParse({
			role_key: 'projectleider',
			role_label: 'Projectleider',
			project_member_id: VALID_UUID,
			person_name: 'Jan de Vries',
			person_email: 'jan@example.com',
			person_phone: '0612345678'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty string for person_email', () => {
		const result = createDocumentRoleSchema.safeParse({
			role_key: 'inkoper',
			role_label: 'Inkoper',
			person_email: ''
		});
		expect(result.success).toBe(true);
	});
});

describe('updateDocumentRoleSchema', () => {
	it('accepts valid partial update', () => {
		const result = updateDocumentRoleSchema.safeParse({
			person_name: 'Nieuwe naam'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object', () => {
		const result = updateDocumentRoleSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts nullable project_member_id', () => {
		const result = updateDocumentRoleSchema.safeParse({
			project_member_id: null
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid email format', () => {
		const result = updateDocumentRoleSchema.safeParse({
			person_email: 'ongeldig-email'
		});
		expect(result.success).toBe(false);
	});

	it('rejects name exceeding max', () => {
		const result = updateDocumentRoleSchema.safeParse({
			person_name: 'x'.repeat(201)
		});
		expect(result.success).toBe(false);
	});
});
