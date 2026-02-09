// Unit tests for Sprint R6 — generateLeidraadSectionSchema validation

import { describe, it, expect } from 'vitest';
import { generateLeidraadSectionSchema } from '../../src/lib/server/api/validation';

describe('generateLeidraadSectionSchema', () => {
	it('accepts empty object (generate all sections)', () => {
		const result = generateLeidraadSectionSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts section_key only', () => {
		const result = generateLeidraadSectionSchema.safeParse({
			section_key: 'inleiding'
		});
		expect(result.success).toBe(true);
		expect(result.data?.section_key).toBe('inleiding');
	});

	it('accepts instructions only', () => {
		const result = generateLeidraadSectionSchema.safeParse({
			instructions: 'Focus op duurzaamheid'
		});
		expect(result.success).toBe(true);
		expect(result.data?.instructions).toBe('Focus op duurzaamheid');
	});

	it('accepts both section_key and instructions', () => {
		const result = generateLeidraadSectionSchema.safeParse({
			section_key: 'procedure',
			instructions: 'Gebruik openbare procedure'
		});
		expect(result.success).toBe(true);
		expect(result.data?.section_key).toBe('procedure');
		expect(result.data?.instructions).toBe('Gebruik openbare procedure');
	});

	it('rejects section_key longer than 100 chars', () => {
		const result = generateLeidraadSectionSchema.safeParse({
			section_key: 'a'.repeat(101)
		});
		expect(result.success).toBe(false);
	});

	it('rejects instructions longer than 5000 chars', () => {
		const result = generateLeidraadSectionSchema.safeParse({
			instructions: 'a'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts section_key at exactly 100 chars', () => {
		const result = generateLeidraadSectionSchema.safeParse({
			section_key: 'a'.repeat(100)
		});
		expect(result.success).toBe(true);
	});

	it('accepts instructions at exactly 5000 chars', () => {
		const result = generateLeidraadSectionSchema.safeParse({
			instructions: 'a'.repeat(5000)
		});
		expect(result.success).toBe(true);
	});

	it('allows optional fields to be undefined', () => {
		const result = generateLeidraadSectionSchema.safeParse({
			section_key: undefined,
			instructions: undefined
		});
		expect(result.success).toBe(true);
	});

	it('ignores extra fields', () => {
		const result = generateLeidraadSectionSchema.safeParse({
			section_key: 'inleiding',
			extra_field: 'should be ignored'
		});
		expect(result.success).toBe(true);
	});
});
