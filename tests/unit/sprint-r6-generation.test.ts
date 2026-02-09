// Unit tests for Sprint R6 — generateSectionContent prompt construction
// Note: We test the prompt building logic, not the actual AI call (which requires $env)

import { describe, it, expect } from 'vitest';
import {
	LEIDRAAD_SECTION_GENERATION_PROMPT,
	LEIDRAAD_SECTION_DESCRIPTIONS
} from '../../src/lib/server/ai/leidraad-prompts';

describe('generateSectionContent prompt construction', () => {
	// We test the prompt template that generateSectionContent uses internally
	// The actual function calls chat() which requires $env, so we test the building blocks

	describe('section descriptions coverage', () => {
		const expectedSections = [
			'inleiding',
			'opdrachtbeschrijving',
			'procedure',
			'geschiktheidseisen',
			'uitsluitingsgronden',
			'gunningscriteria',
			'inschrijving',
			'overig'
		];

		it('has a description for every expected section', () => {
			for (const key of expectedSections) {
				expect(LEIDRAAD_SECTION_DESCRIPTIONS[key]).toBeDefined();
				expect(typeof LEIDRAAD_SECTION_DESCRIPTIONS[key]).toBe('string');
				expect(LEIDRAAD_SECTION_DESCRIPTIONS[key].length).toBeGreaterThan(10);
			}
		});

		it('has no extra unknown sections', () => {
			const keys = Object.keys(LEIDRAAD_SECTION_DESCRIPTIONS);
			for (const key of keys) {
				expect(expectedSections).toContain(key);
			}
		});

		it('has exactly 8 sections', () => {
			expect(Object.keys(LEIDRAAD_SECTION_DESCRIPTIONS)).toHaveLength(8);
		});
	});

	describe('system prompt suitability for generation', () => {
		const prompt = LEIDRAAD_SECTION_GENERATION_PROMPT;

		it('instructs generating (not just editing)', () => {
			expect(prompt).toContain('genereert');
		});

		it('references section description as input', () => {
			expect(prompt).toContain('sectiebeschrijving');
		});

		it('references project profile as input', () => {
			expect(prompt).toContain('projectprofiel');
		});

		it('references market research as optional input', () => {
			expect(prompt).toContain('marktverkenning');
		});

		it('references knowledge base context as optional input', () => {
			expect(prompt).toContain('kennisbank');
		});

		it('specifies temperature-appropriate determinism (formal output)', () => {
			// The prompt emphasizes formal, legal output which pairs with low temperature
			expect(prompt).toContain('formeel Nederlands');
			expect(prompt).toContain('juridisch correct');
		});

		it('instructs to not add a section title', () => {
			expect(prompt).toContain('Begin NIET met een titel');
		});

		it('instructs full section content output', () => {
			expect(prompt).toContain('VOLLEDIGE sectie-inhoud');
		});
	});

	describe('prompt construction for specific sections', () => {
		it('inleiding description contains background and definitions', () => {
			const desc = LEIDRAAD_SECTION_DESCRIPTIONS.inleiding;
			expect(desc).toContain('achtergrond');
			expect(desc).toContain('definities');
		});

		it('opdrachtbeschrijving describes scope and CPV codes', () => {
			const desc = LEIDRAAD_SECTION_DESCRIPTIONS.opdrachtbeschrijving;
			expect(desc).toContain('scope');
			expect(desc).toContain('CPV');
		});

		it('procedure describes timeline and Nota van Inlichtingen', () => {
			const desc = LEIDRAAD_SECTION_DESCRIPTIONS.procedure;
			expect(desc).toContain('planning');
			expect(desc).toContain('Nota van Inlichtingen');
		});

		it('geschiktheidseisen describes financial and technical requirements', () => {
			const desc = LEIDRAAD_SECTION_DESCRIPTIONS.geschiktheidseisen;
			expect(desc).toContain('financiële');
			expect(desc).toContain('technische');
		});

		it('uitsluitingsgronden references mandatory and optional grounds', () => {
			const desc = LEIDRAAD_SECTION_DESCRIPTIONS.uitsluitingsgronden;
			expect(desc).toContain('verplichte');
			expect(desc).toContain('facultatieve');
		});

		it('gunningscriteria describes weighting', () => {
			const desc = LEIDRAAD_SECTION_DESCRIPTIONS.gunningscriteria;
			expect(desc).toContain('wegingsfactoren');
		});

		it('inschrijving describes submission requirements', () => {
			const desc = LEIDRAAD_SECTION_DESCRIPTIONS.inschrijving;
			expect(desc).toContain('indieningsvereisten');
		});

		it('overig describes complaints and legal protection', () => {
			const desc = LEIDRAAD_SECTION_DESCRIPTIONS.overig;
			expect(desc).toContain('Alcatel');
		});
	});
});
