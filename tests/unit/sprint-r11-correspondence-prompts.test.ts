// Unit tests for Sprint R11 — Correspondence letter generation prompts

import { describe, it, expect } from 'vitest';
import {
	LETTER_GENERATION_PROMPT,
	CORRESPONDENCE_PROMPTS
} from '../../src/lib/server/ai/correspondence-prompts';

// =============================================================================
// LETTER GENERATION SYSTEM PROMPT
// =============================================================================

describe('Letter generation system prompt', () => {
	const prompt = LETTER_GENERATION_PROMPT;

	it('is defined and non-empty', () => {
		expect(prompt).toBeDefined();
		expect(prompt.length).toBeGreaterThan(0);
	});

	it('is in Dutch', () => {
		expect(prompt).toContain('inkoopadviseur');
		expect(prompt).toContain('correspondentiespecialist');
		expect(prompt).toContain('Nederlands');
	});

	it('defines the legal framework', () => {
		expect(prompt).toContain('Aanbestedingswet 2012');
		expect(prompt).toContain('ARW 2016');
		expect(prompt).toContain('Gids Proportionaliteit');
		expect(prompt).toContain('Richtlijn 2014/24/EU');
	});

	it('includes Alcatel-termijn', () => {
		expect(prompt).toContain('Alcatel-termijn');
		expect(prompt).toContain('standstill-periode');
		expect(prompt).toContain('20 kalenderdagen');
	});

	it('references key articles from Aw 2012', () => {
		expect(prompt).toContain('art. 2.130');
		expect(prompt).toContain('art. 2.127');
	});

	it('requires formal Dutch output', () => {
		expect(prompt).toContain('formeel Nederlands');
		expect(prompt).toContain('overheidscorrespondentie');
	});

	it('specifies correct letter opening and closing', () => {
		expect(prompt).toContain('aanhef');
		expect(prompt).toContain('afsluiting');
		expect(prompt).toContain('Geachte heer/mevrouw');
		expect(prompt).toContain('Hoogachtend');
	});

	it('specifies output format with Onderwerp prefix', () => {
		expect(prompt).toContain('Onderwerp:');
		expect(prompt).toContain('Markdown');
	});

	it('requires placeholder markers for missing info', () => {
		expect(prompt).toContain('[NOG IN TE VULLEN');
	});

	it('defines chain-of-thought reasoning steps', () => {
		expect(prompt).toContain('stap voor stap');
		expect(prompt).toContain('wettelijke verplichtingen');
	});

	it('includes guardrails', () => {
		expect(prompt).toContain('Verzin GEEN');
		expect(prompt).toContain('wetsartikelen');
	});

	it('specifies exact legal terminology', () => {
		expect(prompt).toContain('inschrijver');
		expect(prompt).toContain('aanbestedende dienst');
		expect(prompt).toContain('gegadigde');
	});

	it('has instructions for rejection letters', () => {
		expect(prompt).toContain('Afwijzingsbrief');
		expect(prompt).toContain('gunningscriteria');
		expect(prompt).toContain('winnende inschrijver');
	});

	it('has instructions for provisional award letters', () => {
		expect(prompt).toContain('Voorlopige gunningsbeslissing');
		expect(prompt).toContain('standstill-periode');
	});

	it('has instructions for NvI', () => {
		expect(prompt).toContain('Nota van Inlichtingen');
		expect(prompt).toContain('aanbestedingsdocumenten');
	});

	it('has instructions for invitation to sign', () => {
		expect(prompt).toContain('Uitnodiging tot ondertekening');
		expect(prompt).toContain('ondertekenaars');
	});

	it('has substantial content (> 1000 chars)', () => {
		expect(prompt.length).toBeGreaterThan(1000);
	});
});

// =============================================================================
// PROMPTS COLLECTION
// =============================================================================

describe('CORRESPONDENCE_PROMPTS collection', () => {
	it('has letterGeneration prompt', () => {
		expect(CORRESPONDENCE_PROMPTS.letterGeneration).toBeDefined();
		expect(typeof CORRESPONDENCE_PROMPTS.letterGeneration).toBe('string');
	});

	it('has letterTypes', () => {
		expect(CORRESPONDENCE_PROMPTS.letterTypes).toBeDefined();
		expect(typeof CORRESPONDENCE_PROMPTS.letterTypes).toBe('object');
	});

	it('letterGeneration is same as exported constant', () => {
		expect(CORRESPONDENCE_PROMPTS.letterGeneration).toBe(LETTER_GENERATION_PROMPT);
	});
});
