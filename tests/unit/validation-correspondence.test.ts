// Unit tests for Sprint R2 — Correspondence validation schemas

import { describe, it, expect } from 'vitest';
import {
	createCorrespondenceSchema,
	updateCorrespondenceSchema
} from '../../src/lib/server/api/validation';

describe('createCorrespondenceSchema', () => {
	it('accepts valid correspondence with required fields', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'tendering',
			letter_type: 'gunningsbeslissing'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.recipient).toBe('');
			expect(result.data.subject).toBe('');
			expect(result.data.body).toBe('');
			expect(result.data.status).toBe('draft');
		}
	});

	it('accepts fully populated correspondence', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'tendering',
			letter_type: 'afwijzingsbrief',
			recipient: 'Leverancier B.V.',
			subject: 'Afwijzing inschrijving ICT-aanbesteding 2026',
			body: 'Geachte heer/mevrouw, hierbij informeren wij u dat uw inschrijving niet is geselecteerd.',
			status: 'ready'
		});
		expect(result.success).toBe(true);
	});

	it('accepts all valid phases', () => {
		const phases = ['preparing', 'exploring', 'specifying', 'tendering', 'contracting'] as const;
		for (const phase of phases) {
			const result = createCorrespondenceSchema.safeParse({
				phase,
				letter_type: 'test'
			});
			expect(result.success).toBe(true);
		}
	});

	it('rejects invalid phase', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'invalid_phase',
			letter_type: 'test'
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing phase', () => {
		const result = createCorrespondenceSchema.safeParse({
			letter_type: 'test'
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing letter_type', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'tendering'
		});
		expect(result.success).toBe(false);
	});

	it('rejects empty letter_type', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'tendering',
			letter_type: ''
		});
		expect(result.success).toBe(false);
	});

	it('accepts all valid statuses', () => {
		const statuses = ['draft', 'ready', 'sent', 'archived'] as const;
		for (const status of statuses) {
			const result = createCorrespondenceSchema.safeParse({
				phase: 'tendering',
				letter_type: 'test',
				status
			});
			expect(result.success).toBe(true);
		}
	});

	it('rejects invalid status', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'tendering',
			letter_type: 'test',
			status: 'invalid_status'
		});
		expect(result.success).toBe(false);
	});

	it('defaults status to draft', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'tendering',
			letter_type: 'test'
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe('draft');
		}
	});

	it('rejects body exceeding max length (50000)', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'tendering',
			letter_type: 'test',
			body: 'A'.repeat(50001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts body at max length (50000)', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'tendering',
			letter_type: 'test',
			body: 'A'.repeat(50000)
		});
		expect(result.success).toBe(true);
	});

	it('rejects subject exceeding max length', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'tendering',
			letter_type: 'test',
			subject: 'A'.repeat(501)
		});
		expect(result.success).toBe(false);
	});

	it('rejects recipient exceeding max length', () => {
		const result = createCorrespondenceSchema.safeParse({
			phase: 'tendering',
			letter_type: 'test',
			recipient: 'A'.repeat(501)
		});
		expect(result.success).toBe(false);
	});
});

describe('updateCorrespondenceSchema', () => {
	it('accepts empty object (all fields optional)', () => {
		const result = updateCorrespondenceSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('accepts partial update', () => {
		const result = updateCorrespondenceSchema.safeParse({
			status: 'sent',
			sent_at: '2026-03-15T10:00:00Z'
		});
		expect(result.success).toBe(true);
	});

	it('rejects invalid status in update', () => {
		const result = updateCorrespondenceSchema.safeParse({
			status: 'invalid'
		});
		expect(result.success).toBe(false);
	});

	it('accepts body update', () => {
		const result = updateCorrespondenceSchema.safeParse({
			body: 'Bijgewerkte inhoud van de brief.'
		});
		expect(result.success).toBe(true);
	});

	it('rejects body exceeding max length in update', () => {
		const result = updateCorrespondenceSchema.safeParse({
			body: 'A'.repeat(50001)
		});
		expect(result.success).toBe(false);
	});

	it('accepts letter_type update', () => {
		const result = updateCorrespondenceSchema.safeParse({
			letter_type: 'nota_van_inlichtingen'
		});
		expect(result.success).toBe(true);
	});

	it('rejects empty letter_type in update', () => {
		const result = updateCorrespondenceSchema.safeParse({
			letter_type: ''
		});
		expect(result.success).toBe(false);
	});
});
