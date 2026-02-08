// Unit tests for Sprint R8 — UEA validation schemas

import { describe, it, expect } from 'vitest';
import {
	toggleUeaQuestionSchema,
	initializeUeaSelectionsSchema
} from '../../src/lib/server/api/validation';

describe('toggleUeaQuestionSchema', () => {
	it('accepts a valid toggle with is_selected true', () => {
		const result = toggleUeaQuestionSchema.safeParse({
			question_id: '550e8400-e29b-41d4-a716-446655440000',
			is_selected: true
		});
		expect(result.success).toBe(true);
	});

	it('accepts a valid toggle with is_selected false', () => {
		const result = toggleUeaQuestionSchema.safeParse({
			question_id: '550e8400-e29b-41d4-a716-446655440000',
			is_selected: false
		});
		expect(result.success).toBe(true);
	});

	it('rejects missing question_id', () => {
		const result = toggleUeaQuestionSchema.safeParse({
			is_selected: true
		});
		expect(result.success).toBe(false);
	});

	it('rejects invalid question_id (not UUID)', () => {
		const result = toggleUeaQuestionSchema.safeParse({
			question_id: 'not-a-uuid',
			is_selected: true
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing is_selected', () => {
		const result = toggleUeaQuestionSchema.safeParse({
			question_id: '550e8400-e29b-41d4-a716-446655440000'
		});
		expect(result.success).toBe(false);
	});

	it('rejects non-boolean is_selected', () => {
		const result = toggleUeaQuestionSchema.safeParse({
			question_id: '550e8400-e29b-41d4-a716-446655440000',
			is_selected: 'yes'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty object', () => {
		const result = toggleUeaQuestionSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

describe('initializeUeaSelectionsSchema', () => {
	it('accepts empty object (defaults to select_all_optional=false)', () => {
		const result = initializeUeaSelectionsSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.select_all_optional).toBe(false);
		}
	});

	it('accepts select_all_optional=true', () => {
		const result = initializeUeaSelectionsSchema.safeParse({
			select_all_optional: true
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.select_all_optional).toBe(true);
		}
	});

	it('accepts select_all_optional=false', () => {
		const result = initializeUeaSelectionsSchema.safeParse({
			select_all_optional: false
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.select_all_optional).toBe(false);
		}
	});

	it('rejects non-boolean select_all_optional', () => {
		const result = initializeUeaSelectionsSchema.safeParse({
			select_all_optional: 'yes'
		});
		expect(result.success).toBe(false);
	});
});
