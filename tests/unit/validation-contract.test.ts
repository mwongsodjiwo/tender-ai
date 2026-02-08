// Unit tests for Sprint R7 — Contract validation schemas

import { describe, it, expect } from 'vitest';
import {
	updateContractSettingsSchema,
	generateContractArticleSchema
} from '../../src/lib/server/api/validation';

describe('updateContractSettingsSchema', () => {
	it('accepts diensten contract type', () => {
		const result = updateContractSettingsSchema.safeParse({
			contract_type: 'diensten'
		});
		expect(result.success).toBe(true);
	});

	it('accepts leveringen contract type', () => {
		const result = updateContractSettingsSchema.safeParse({
			contract_type: 'leveringen'
		});
		expect(result.success).toBe(true);
	});

	it('accepts werken contract type', () => {
		const result = updateContractSettingsSchema.safeParse({
			contract_type: 'werken'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid contract type', () => {
		const result = updateContractSettingsSchema.safeParse({
			contract_type: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('accepts null contract type', () => {
		const result = updateContractSettingsSchema.safeParse({
			contract_type: null
		});
		expect(result.success).toBe(true);
	});

	it('accepts arvodi_2018 general conditions', () => {
		const result = updateContractSettingsSchema.safeParse({
			general_conditions: 'arvodi_2018'
		});
		expect(result.success).toBe(true);
	});

	it('accepts ariv_2018 general conditions', () => {
		const result = updateContractSettingsSchema.safeParse({
			general_conditions: 'ariv_2018'
		});
		expect(result.success).toBe(true);
	});

	it('accepts uav_gc_2005 general conditions', () => {
		const result = updateContractSettingsSchema.safeParse({
			general_conditions: 'uav_gc_2005'
		});
		expect(result.success).toBe(true);
	});

	it('accepts uav_2012 general conditions', () => {
		const result = updateContractSettingsSchema.safeParse({
			general_conditions: 'uav_2012'
		});
		expect(result.success).toBe(true);
	});

	it('accepts dnr_2011 general conditions', () => {
		const result = updateContractSettingsSchema.safeParse({
			general_conditions: 'dnr_2011'
		});
		expect(result.success).toBe(true);
	});

	it('accepts custom general conditions', () => {
		const result = updateContractSettingsSchema.safeParse({
			general_conditions: 'custom'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid general conditions', () => {
		const result = updateContractSettingsSchema.safeParse({
			general_conditions: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('accepts null general conditions', () => {
		const result = updateContractSettingsSchema.safeParse({
			general_conditions: null
		});
		expect(result.success).toBe(true);
	});

	it('accepts both fields together', () => {
		const result = updateContractSettingsSchema.safeParse({
			contract_type: 'diensten',
			general_conditions: 'arvodi_2018'
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty object', () => {
		const result = updateContractSettingsSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts all valid contract types', () => {
		const types = ['diensten', 'leveringen', 'werken'];
		for (const type of types) {
			const result = updateContractSettingsSchema.safeParse({ contract_type: type });
			expect(result.success).toBe(true);
		}
	});

	it('accepts all valid general conditions', () => {
		const conditions = ['arvodi_2018', 'ariv_2018', 'uav_gc_2005', 'uav_2012', 'dnr_2011', 'custom'];
		for (const condition of conditions) {
			const result = updateContractSettingsSchema.safeParse({ general_conditions: condition });
			expect(result.success).toBe(true);
		}
	});
});

describe('generateContractArticleSchema', () => {
	it('accepts empty object', () => {
		const result = generateContractArticleSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts optional instructions', () => {
		const result = generateContractArticleSchema.safeParse({
			instructions: 'Maak de tekst formeler'
		});
		expect(result.success).toBe(true);
	});

	it('rejects instructions longer than 2000 characters', () => {
		const result = generateContractArticleSchema.safeParse({
			instructions: 'a'.repeat(2001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts instructions of exactly 2000 characters', () => {
		const result = generateContractArticleSchema.safeParse({
			instructions: 'a'.repeat(2000)
		});
		expect(result.success).toBe(true);
	});

	it('accepts empty instructions string', () => {
		const result = generateContractArticleSchema.safeParse({
			instructions: ''
		});
		expect(result.success).toBe(true);
	});
});
