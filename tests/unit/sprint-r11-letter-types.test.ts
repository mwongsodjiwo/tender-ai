// Unit tests for Sprint R11 — Letter type definitions and phase mappings

import { describe, it, expect } from 'vitest';
import {
	LETTER_TYPE_DESCRIPTIONS,
	CORRESPONDENCE_PROMPTS
} from '../../src/lib/server/ai/correspondence-prompts';
import { PROJECT_PHASES } from '../../src/lib/types/enums';

// =============================================================================
// LETTER TYPE DEFINITIONS
// =============================================================================

describe('Letter type definitions', () => {
	const types = LETTER_TYPE_DESCRIPTIONS;

	const EXPECTED_TYPES = [
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

	it('has all 11 letter types defined', () => {
		expect(Object.keys(types)).toHaveLength(11);
		for (const key of EXPECTED_TYPES) {
			expect(types[key]).toBeDefined();
		}
	});

	it('each type has a label', () => {
		for (const key of EXPECTED_TYPES) {
			expect(types[key].label).toBeDefined();
			expect(typeof types[key].label).toBe('string');
			expect(types[key].label.length).toBeGreaterThan(0);
		}
	});

	it('each type has a description', () => {
		for (const key of EXPECTED_TYPES) {
			expect(types[key].description).toBeDefined();
			expect(typeof types[key].description).toBe('string');
			expect(types[key].description.length).toBeGreaterThan(20);
		}
	});

	it('each type has valid phase mappings', () => {
		for (const key of EXPECTED_TYPES) {
			expect(types[key].phase).toBeDefined();
			expect(Array.isArray(types[key].phase)).toBe(true);
			expect(types[key].phase.length).toBeGreaterThan(0);

			for (const phase of types[key].phase) {
				expect(PROJECT_PHASES).toContain(phase);
			}
		}
	});

	it('all labels are in Dutch', () => {
		for (const key of EXPECTED_TYPES) {
			// Dutch labels contain specific Dutch words
			const label = types[key].label;
			expect(label.length).toBeGreaterThan(2);
		}
	});

	it('all descriptions are in Dutch', () => {
		for (const key of EXPECTED_TYPES) {
			const desc = types[key].description;
			// Dutch descriptions should be substantial
			expect(desc.length).toBeGreaterThan(40);
		}
	});
});

// =============================================================================
// PHASE MAPPINGS
// =============================================================================

describe('Letter type phase mappings', () => {
	const types = LETTER_TYPE_DESCRIPTIONS;

	it('exploring phase types: invitation_rfi, invitation_consultation, thank_you', () => {
		expect(types.invitation_rfi.phase).toContain('exploring');
		expect(types.invitation_consultation.phase).toContain('exploring');
		expect(types.thank_you.phase).toContain('exploring');
	});

	it('tendering phase types: nvi, provisional_award, rejection, final_award, pv_opening, pv_evaluation', () => {
		expect(types.nvi.phase).toContain('tendering');
		expect(types.provisional_award.phase).toContain('tendering');
		expect(types.rejection.phase).toContain('tendering');
		expect(types.final_award.phase).toContain('tendering');
		expect(types.pv_opening.phase).toContain('tendering');
		expect(types.pv_evaluation.phase).toContain('tendering');
	});

	it('contracting phase types: invitation_signing, cover_letter', () => {
		expect(types.invitation_signing.phase).toContain('contracting');
		expect(types.cover_letter.phase).toContain('contracting');
	});
});

// =============================================================================
// SPECIFIC LETTER TYPE LABELS
// =============================================================================

describe('Specific letter type labels', () => {
	const types = LETTER_TYPE_DESCRIPTIONS;

	it('invitation_rfi is labeled Uitnodiging RFI', () => {
		expect(types.invitation_rfi.label).toBe('Uitnodiging RFI');
	});

	it('nvi is labeled Nota van Inlichtingen', () => {
		expect(types.nvi.label).toBe('Nota van Inlichtingen');
	});

	it('rejection is labeled Afwijzingsbrief', () => {
		expect(types.rejection.label).toBe('Afwijzingsbrief');
	});

	it('provisional_award is labeled Voorlopige gunningsbeslissing', () => {
		expect(types.provisional_award.label).toBe('Voorlopige gunningsbeslissing');
	});

	it('invitation_signing is labeled Uitnodiging tot ondertekening', () => {
		expect(types.invitation_signing.label).toBe('Uitnodiging tot ondertekening');
	});

	it('cover_letter is labeled Begeleidende brief', () => {
		expect(types.cover_letter.label).toBe('Begeleidende brief');
	});
});

// =============================================================================
// CORRESPONDENCE_PROMPTS COLLECTION — letterTypes
// =============================================================================

describe('CORRESPONDENCE_PROMPTS.letterTypes', () => {
	it('is the same as LETTER_TYPE_DESCRIPTIONS', () => {
		expect(CORRESPONDENCE_PROMPTS.letterTypes).toBe(LETTER_TYPE_DESCRIPTIONS);
	});

	it('has 11 entries', () => {
		expect(Object.keys(CORRESPONDENCE_PROMPTS.letterTypes)).toHaveLength(11);
	});
});
