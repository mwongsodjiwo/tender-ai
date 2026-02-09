// Unit tests for Sprint R2 — Project profile validation schemas

import { describe, it, expect } from 'vitest';
import {
	createProjectProfileSchema,
	updateProjectProfileSchema
} from '../../src/lib/server/api/validation';

describe('createProjectProfileSchema', () => {
	it('accepts empty object (all fields have defaults)', () => {
		const result = createProjectProfileSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.contracting_authority).toBe('');
			expect(result.data.department).toBe('');
			expect(result.data.contact_name).toBe('');
			expect(result.data.contact_email).toBe('');
			expect(result.data.contact_phone).toBe('');
			expect(result.data.project_goal).toBe('');
			expect(result.data.scope_description).toBe('');
			expect(result.data.currency).toBe('EUR');
			expect(result.data.cpv_codes).toEqual([]);
			expect(result.data.nuts_codes).toEqual([]);
		}
	});

	it('accepts a fully populated profile', () => {
		const result = createProjectProfileSchema.safeParse({
			contracting_authority: 'Gemeente Amsterdam',
			department: 'Inkoopafdeling',
			contact_name: 'Jan de Vries',
			contact_email: 'jan@amsterdam.nl',
			contact_phone: '+31 20 1234567',
			project_goal: 'Aanbesteding ICT-diensten',
			scope_description: 'Levering en onderhoud van kantoorapparatuur voor alle gemeentelijke gebouwen.',
			estimated_value: 500000,
			currency: 'EUR',
			cpv_codes: ['72000000', '30200000'],
			nuts_codes: ['NL329'],
			timeline_start: '2026-04-01',
			timeline_end: '2027-03-31'
		});
		expect(result.success).toBe(true);
	});

	it('accepts valid email', () => {
		const result = createProjectProfileSchema.safeParse({
			contact_email: 'test@example.com'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty string as email', () => {
		const result = createProjectProfileSchema.safeParse({
			contact_email: ''
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid email', () => {
		const result = createProjectProfileSchema.safeParse({
			contact_email: 'not-an-email'
		});
		expect(result.success).toBe(false);
	});

	it('rejects negative estimated_value', () => {
		const result = createProjectProfileSchema.safeParse({
			estimated_value: -100
		});
		expect(result.success).toBe(false);
	});

	it('rejects zero estimated_value', () => {
		const result = createProjectProfileSchema.safeParse({
			estimated_value: 0
		});
		expect(result.success).toBe(false);
	});

	it('accepts positive estimated_value', () => {
		const result = createProjectProfileSchema.safeParse({
			estimated_value: 100000
		});
		expect(result.success).toBe(true);
	});

	it('rejects contracting_authority exceeding max length', () => {
		const result = createProjectProfileSchema.safeParse({
			contracting_authority: 'A'.repeat(501)
		});
		expect(result.success).toBe(false);
	});

	it('rejects scope_description exceeding max length', () => {
		const result = createProjectProfileSchema.safeParse({
			scope_description: 'A'.repeat(10001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts cpv_codes as array of strings', () => {
		const result = createProjectProfileSchema.safeParse({
			cpv_codes: ['72000000', '30200000']
		});
		expect(result.success).toBe(true);
	});

	it('rejects cpv_codes with entries exceeding max length', () => {
		const result = createProjectProfileSchema.safeParse({
			cpv_codes: ['A'.repeat(21)]
		});
		expect(result.success).toBe(false);
	});
});

describe('updateProjectProfileSchema', () => {
	it('accepts empty object (all fields optional)', () => {
		const result = updateProjectProfileSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts partial update', () => {
		const result = updateProjectProfileSchema.safeParse({
			contracting_authority: 'Gemeente Rotterdam',
			project_goal: 'Nieuwe doelstelling'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid email in update', () => {
		const result = updateProjectProfileSchema.safeParse({
			contact_email: 'bad-email'
		});
		expect(result.success).toBe(false);
	});

	it('accepts empty email in update', () => {
		const result = updateProjectProfileSchema.safeParse({
			contact_email: ''
		});
		expect(result.success).toBe(true);
	});

	it('rejects negative estimated_value in update', () => {
		const result = updateProjectProfileSchema.safeParse({
			estimated_value: -1
		});
		expect(result.success).toBe(false);
	});
});
