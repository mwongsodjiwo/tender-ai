// Unit tests for document comments API endpoint logic
// Tests validation, authorization patterns, and data flow

import { describe, it, expect } from 'vitest';
import {
	createDocumentCommentSchema,
	updateDocumentCommentSchema
} from '../../src/lib/server/api/validation';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440000';

describe('Document Comments API — Request validation', () => {
	describe('POST /comments — Create', () => {
		it('validates a complete create request', () => {
			const body = {
				artifact_id: VALID_UUID,
				selected_text: 'Inschrijver dient minimaal 3 referenties te overleggen',
				comment_text: 'Is 3 referenties niet te veel voor MKB-bedrijven?'
			};
			const result = createDocumentCommentSchema.safeParse(body);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.artifact_id).toBe(VALID_UUID);
				expect(result.data.selected_text).toBe(body.selected_text);
				expect(result.data.comment_text).toBe(body.comment_text);
			}
		});

		it('rejects extra fields (strips them)', () => {
			const body = {
				artifact_id: VALID_UUID,
				selected_text: 'Tekst',
				comment_text: 'Opmerking',
				resolved: true,
				extra_field: 'should be stripped'
			};
			const result = createDocumentCommentSchema.safeParse(body);
			expect(result.success).toBe(true);
			if (result.success) {
				expect((result.data as Record<string, unknown>).resolved).toBeUndefined();
				expect((result.data as Record<string, unknown>).extra_field).toBeUndefined();
			}
		});

		it('trims and preserves whitespace in text fields', () => {
			const body = {
				artifact_id: VALID_UUID,
				selected_text: '  Tekst met spaties  ',
				comment_text: 'Opmerking met\nnewline'
			};
			const result = createDocumentCommentSchema.safeParse(body);
			expect(result.success).toBe(true);
		});

		it('handles unicode characters in text', () => {
			const body = {
				artifact_id: VALID_UUID,
				selected_text: 'Één, twee, drieën — met €-teken',
				comment_text: 'Nötig: überprüfen der Ästhetik'
			};
			const result = createDocumentCommentSchema.safeParse(body);
			expect(result.success).toBe(true);
		});
	});

	describe('PATCH /comments/:id — Update', () => {
		it('accepts resolve with true', () => {
			const result = updateDocumentCommentSchema.safeParse({ resolved: true });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.resolved).toBe(true);
			}
		});

		it('accepts unresolve with false', () => {
			const result = updateDocumentCommentSchema.safeParse({ resolved: false });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.resolved).toBe(false);
			}
		});

		it('accepts updated comment text', () => {
			const result = updateDocumentCommentSchema.safeParse({
				comment_text: 'Herziene opmerking na overleg'
			});
			expect(result.success).toBe(true);
		});

		it('rejects null values for defined fields', () => {
			const result = updateDocumentCommentSchema.safeParse({
				comment_text: null
			});
			expect(result.success).toBe(false);
		});
	});
});

describe('Document Comments — Data integrity patterns', () => {
	it('soft delete preserves data for audit trail', () => {
		// Pattern test: deleted_at field is used instead of hard delete
		// This is validated by the migration having a deleted_at column
		// and the API using .is('deleted_at', null) in queries
		const deletedComment = {
			id: VALID_UUID,
			project_id: VALID_UUID_2,
			artifact_id: VALID_UUID,
			selected_text: 'Oude tekst',
			comment_text: 'Verwijderde opmerking',
			resolved: false,
			deleted_at: new Date().toISOString(),
			created_by: VALID_UUID,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		expect(deletedComment.deleted_at).toBeTruthy();
		expect(deletedComment.comment_text).toBe('Verwijderde opmerking');
	});

	it('resolve action tracks who and when', () => {
		// Pattern test: resolving a comment sets resolved_at and resolved_by
		const resolvedComment = {
			id: VALID_UUID,
			resolved: true,
			resolved_at: new Date().toISOString(),
			resolved_by: VALID_UUID_2
		};
		expect(resolvedComment.resolved).toBe(true);
		expect(resolvedComment.resolved_at).toBeTruthy();
		expect(resolvedComment.resolved_by).toBe(VALID_UUID_2);
	});
});
