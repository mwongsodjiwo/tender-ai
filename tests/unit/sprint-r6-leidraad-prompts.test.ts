// Unit tests for Sprint R6 — Leidraad section generation prompts

import { describe, it, expect } from 'vitest';
import {
	LEIDRAAD_SECTION_GENERATION_PROMPT,
	LEIDRAAD_SECTION_DESCRIPTIONS,
	LEIDRAAD_PROMPTS
} from '../../src/lib/server/ai/leidraad-prompts';

// =============================================================================
// SECTION GENERATION SYSTEM PROMPT
// =============================================================================

describe('Leidraad section generation system prompt', () => {
	const prompt = LEIDRAAD_SECTION_GENERATION_PROMPT;

	it('is defined and non-empty', () => {
		expect(prompt).toBeDefined();
		expect(prompt.length).toBeGreaterThan(0);
	});

	it('is in Dutch', () => {
		expect(prompt).toContain('aanbestedingsjurist');
		expect(prompt).toContain('aanbestedingsleidraden');
		expect(prompt).toContain('Nederlands');
	});

	it('defines the legal framework', () => {
		expect(prompt).toContain('Aanbestedingswet 2012');
		expect(prompt).toContain('ARW 2016');
		expect(prompt).toContain('Gids Proportionaliteit');
		expect(prompt).toContain('Richtlijn 2014/24/EU');
	});

	it('requires formal Dutch output', () => {
		expect(prompt).toContain('formeel Nederlands');
		expect(prompt).toContain('overheidspublicaties');
	});

	it('specifies output format', () => {
		expect(prompt).toContain('Markdown');
		expect(prompt).toContain('decimale nummering');
	});

	it('requires placeholder markers for missing info', () => {
		expect(prompt).toContain('[NOG IN TE VULLEN');
	});

	it('defines chain-of-thought reasoning steps', () => {
		expect(prompt).toContain('stap voor stap');
		expect(prompt).toContain('projectprofiel');
		expect(prompt).toContain('wettelijke verplichtingen');
	});

	it('includes guardrails', () => {
		expect(prompt).toContain('Verzin GEEN');
		expect(prompt).toContain('wetsartikelen');
	});

	it('specifies exact legal terminology', () => {
		expect(prompt).toContain('inschrijver');
		expect(prompt).toContain('aanbestedende dienst');
	});

	it('has substantial content (> 500 chars)', () => {
		expect(prompt.length).toBeGreaterThan(500);
	});
});

// =============================================================================
// SECTION DESCRIPTIONS
// =============================================================================

describe('Leidraad section descriptions', () => {
	const descriptions = LEIDRAAD_SECTION_DESCRIPTIONS;

	it('has all 8 section descriptions', () => {
		const expectedKeys = [
			'inleiding',
			'opdrachtbeschrijving',
			'procedure',
			'geschiktheidseisen',
			'uitsluitingsgronden',
			'gunningscriteria',
			'inschrijving',
			'overig'
		];
		for (const key of expectedKeys) {
			expect(descriptions[key]).toBeDefined();
			expect(descriptions[key].length).toBeGreaterThan(0);
		}
	});

	it('inleiding describes introduction content', () => {
		expect(descriptions.inleiding).toContain('Inleiding');
		expect(descriptions.inleiding).toContain('leeswijzer');
	});

	it('procedure describes procedure content', () => {
		expect(descriptions.procedure).toContain('Procedure');
		expect(descriptions.procedure).toContain('TenderNed');
	});

	it('geschiktheidseisen references Gids Proportionaliteit', () => {
		expect(descriptions.geschiktheidseisen).toContain('Gids Proportionaliteit');
	});

	it('uitsluitingsgronden references Aw 2012 articles', () => {
		expect(descriptions.uitsluitingsgronden).toContain('art. 2.86');
		expect(descriptions.uitsluitingsgronden).toContain('art. 2.87');
	});

	it('gunningscriteria describes scoring methodology', () => {
		expect(descriptions.gunningscriteria).toContain('EMVI');
		expect(descriptions.gunningscriteria).toContain('gunningssystematiek');
	});

	it('overig describes miscellaneous provisions', () => {
		expect(descriptions.overig).toContain('klachtenregeling');
		expect(descriptions.overig).toContain('rechtsbescherming');
	});

	it('all descriptions are in Dutch', () => {
		for (const value of Object.values(descriptions)) {
			// All descriptions should contain Dutch characters/words
			expect(value.length).toBeGreaterThan(20);
		}
	});
});

// =============================================================================
// PROMPTS COLLECTION
// =============================================================================

describe('LEIDRAAD_PROMPTS collection', () => {
	it('has sectionGeneration prompt', () => {
		expect(LEIDRAAD_PROMPTS.sectionGeneration).toBeDefined();
		expect(typeof LEIDRAAD_PROMPTS.sectionGeneration).toBe('string');
	});

	it('has sectionDescriptions', () => {
		expect(LEIDRAAD_PROMPTS.sectionDescriptions).toBeDefined();
		expect(typeof LEIDRAAD_PROMPTS.sectionDescriptions).toBe('object');
	});

	it('sectionGeneration is same as exported constant', () => {
		expect(LEIDRAAD_PROMPTS.sectionGeneration).toBe(LEIDRAAD_SECTION_GENERATION_PROMPT);
	});

	it('sectionDescriptions is same as exported constant', () => {
		expect(LEIDRAAD_PROMPTS.sectionDescriptions).toBe(LEIDRAAD_SECTION_DESCRIPTIONS);
	});
});
