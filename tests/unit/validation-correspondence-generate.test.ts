// Unit tests for Sprint R11 — generateLetterSchema validation

import { describe, it, expect } from 'vitest';
import { generateLetterSchema } from '../../src/lib/server/api/validation';

describe('generateLetterSchema', () => {
	it('accepts valid request with only letter_type', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'rejection'
		});
		expect(result.success).toBe(true);
	});

	it('accepts fully populated request', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'rejection',
			recipient: 'Leverancier B.V.',
			instructions: 'Gebruik een zakelijke maar correcte toon.',
			evaluation_id: '123e4567-e89b-12d3-a456-426614174000'
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing letter_type', () => {
		const result = generateLetterSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('rejects empty letter_type', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: ''
		});
		expect(result.success).toBe(false);
	});

	it('rejects letter_type exceeding max length (100)', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'A'.repeat(101)
		});
		expect(result.success).toBe(false);
	});

	it('accepts letter_type at max length (100)', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'A'.repeat(100)
		});
		expect(result.success).toBe(true);
	});

	it('recipient is optional', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'nvi'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.recipient).toBeUndefined();
		}
	});

	it('rejects recipient exceeding max length (500)', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'rejection',
			recipient: 'A'.repeat(501)
		});
		expect(result.success).toBe(false);
	});

	it('accepts recipient at max length (500)', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'rejection',
			recipient: 'A'.repeat(500)
		});
		expect(result.success).toBe(true);
	});

	it('instructions is optional', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'nvi'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.instructions).toBeUndefined();
		}
	});

	it('rejects instructions exceeding max length (5000)', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'rejection',
			instructions: 'A'.repeat(5001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts instructions at max length (5000)', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'rejection',
			instructions: 'A'.repeat(5000)
		});
		expect(result.success).toBe(true);
	});

	it('evaluation_id is optional', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'rejection'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.evaluation_id).toBeUndefined();
		}
	});

	it('rejects invalid evaluation_id (not UUID)', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'rejection',
			evaluation_id: 'not-a-uuid'
		});
		expect(result.success).toBe(false);
	});

	it('accepts valid evaluation_id (UUID)', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'rejection',
			evaluation_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(true);
	});

	it('provides correct error message for missing letter_type', () => {
		const result = generateLetterSchema.safeParse({});
		expect(result.success).toBe(false);
		if (!result.success) {
			const letterTypeError = result.error.errors.find((e) => e.path.includes('letter_type'));
			expect(letterTypeError).toBeDefined();
		}
	});

	it('provides correct error message for invalid evaluation_id', () => {
		const result = generateLetterSchema.safeParse({
			letter_type: 'test',
			evaluation_id: 'invalid'
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const evalError = result.error.errors.find((e) => e.path.includes('evaluation_id'));
			expect(evalError).toBeDefined();
			expect(evalError?.message).toContain('evaluatie');
		}
	});

	it('accepts all common letter types', () => {
		const types = [
			'invitation_rfi',
			'invitation_consultation',
			'thank_you',
			'nvi',
			'provisional_award',
			'rejection',
			'final_award',
			'pv_opening',
			'pv_evaluation',
			'invitation_signing',
			'cover_letter'
		];
		for (const letterType of types) {
			const result = generateLetterSchema.safeParse({ letter_type: letterType });
			expect(result.success).toBe(true);
		}
	});
});
