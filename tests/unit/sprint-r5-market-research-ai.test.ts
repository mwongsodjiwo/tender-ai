// Unit tests for Sprint R5 — Market research AI prompt construction and content

import { describe, it, expect } from 'vitest';
import { MARKET_RESEARCH_PROMPTS } from '../../src/lib/server/ai/market-research-prompts';

// =============================================================================
// DESKRESEARCH SYSTEM PROMPT
// =============================================================================

describe('Deskresearch AI system prompt', () => {
	const prompt = MARKET_RESEARCH_PROMPTS.deskresearch;

	it('is defined and non-empty', () => {
		expect(prompt).toBeDefined();
		expect(prompt.length).toBeGreaterThan(0);
	});

	it('is in Dutch', () => {
		expect(prompt).toContain('inkoopadviseur');
		expect(prompt).toContain('marktverkenning');
	});

	it('contains key analysis sections', () => {
		expect(prompt).toContain('Marktbeeld');
		expect(prompt).toContain('Opdrachtgevers');
		expect(prompt).toContain('Waardebereik');
		expect(prompt).toContain('CPV-codes');
		expect(prompt).toContain('Aanbevelingen');
	});

	it('instructs Markdown output', () => {
		expect(prompt).toContain('Markdown');
	});

	it('sets word limit', () => {
		expect(prompt).toContain('500 woorden');
	});
});

// =============================================================================
// RFI GENERATION SYSTEM PROMPT
// =============================================================================

describe('RFI generation AI system prompt', () => {
	const prompt = MARKET_RESEARCH_PROMPTS.rfi;

	it('is defined and non-empty', () => {
		expect(prompt).toBeDefined();
		expect(prompt.length).toBeGreaterThan(0);
	});

	it('is in Dutch', () => {
		expect(prompt).toContain('inkoopadviseur');
		expect(prompt).toContain('RFI-vragenlijst');
		expect(prompt).toContain('Nederlands');
	});

	it('defines RFI question categories', () => {
		expect(prompt).toContain('Ervaring en expertise');
		expect(prompt).toContain('oplossingen');
		expect(prompt).toContain('prijsopbouw');
		expect(prompt).toContain('risico');
		expect(prompt).toContain('Duurzaamheid');
	});

	it('requires placeholder markers for missing info', () => {
		expect(prompt).toContain('[NOG IN TE VULLEN');
	});

	it('instructs JSON output for questions', () => {
		expect(prompt).toContain('json');
		expect(prompt).toContain('questions');
	});

	it('instructs Markdown format', () => {
		expect(prompt).toContain('Markdown');
	});
});

// =============================================================================
// MARKET REPORT SYSTEM PROMPT
// =============================================================================

describe('Market report AI system prompt', () => {
	const prompt = MARKET_RESEARCH_PROMPTS.report;

	it('is defined and non-empty', () => {
		expect(prompt).toBeDefined();
		expect(prompt.length).toBeGreaterThan(0);
	});

	it('is in Dutch', () => {
		expect(prompt).toContain('inkoopadviseur');
		expect(prompt).toContain('marktverkenningsrapport');
		expect(prompt).toContain('Nederlands');
	});

	it('defines report structure', () => {
		expect(prompt).toContain('Managementsamenvatting');
		expect(prompt).toContain('Aanleiding en doel');
		expect(prompt).toContain('Methodiek');
		expect(prompt).toContain('Bevindingen deskresearch');
		expect(prompt).toContain('Bevindingen RFI');
		expect(prompt).toContain('Bevindingen marktconsultatie');
		expect(prompt).toContain('Bevindingen gesprekken');
		expect(prompt).toContain('Conclusies en aanbevelingen');
		expect(prompt).toContain('Bijlagen');
	});

	it('requires placeholder markers for missing info', () => {
		expect(prompt).toContain('[NOG IN TE VULLEN');
	});

	it('instructs Markdown output', () => {
		expect(prompt).toContain('Markdown');
	});

	it('instructs formal Dutch', () => {
		expect(prompt).toContain('overheidscommunicatie');
	});
});

// =============================================================================
// PROMPTS COLLECTION
// =============================================================================

describe('MARKET_RESEARCH_PROMPTS collection', () => {
	it('has all three prompts', () => {
		expect(MARKET_RESEARCH_PROMPTS.deskresearch).toBeDefined();
		expect(MARKET_RESEARCH_PROMPTS.rfi).toBeDefined();
		expect(MARKET_RESEARCH_PROMPTS.report).toBeDefined();
	});

	it('all prompts are strings', () => {
		expect(typeof MARKET_RESEARCH_PROMPTS.deskresearch).toBe('string');
		expect(typeof MARKET_RESEARCH_PROMPTS.rfi).toBe('string');
		expect(typeof MARKET_RESEARCH_PROMPTS.report).toBe('string');
	});

	it('all prompts have substantial content (> 100 chars)', () => {
		expect(MARKET_RESEARCH_PROMPTS.deskresearch.length).toBeGreaterThan(100);
		expect(MARKET_RESEARCH_PROMPTS.rfi.length).toBeGreaterThan(100);
		expect(MARKET_RESEARCH_PROMPTS.report.length).toBeGreaterThan(100);
	});

	it('prompts are distinct from each other', () => {
		expect(MARKET_RESEARCH_PROMPTS.deskresearch).not.toBe(MARKET_RESEARCH_PROMPTS.rfi);
		expect(MARKET_RESEARCH_PROMPTS.rfi).not.toBe(MARKET_RESEARCH_PROMPTS.report);
		expect(MARKET_RESEARCH_PROMPTS.deskresearch).not.toBe(MARKET_RESEARCH_PROMPTS.report);
	});
});
