// Unit tests: Fase 52 — server/ai/generation prompt building and section assembly

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chat client before importing generation module
vi.mock('$server/ai/client', () => ({
	chat: vi.fn()
}));

vi.mock('$server/ai/config', () => ({
	AI_CONFIG: {
		apiKey: 'test-key',
		model: 'gpt-4o',
		maxTokens: 4096,
		defaultTemperature: 0.7
	}
}));

vi.mock('$server/ai/leidraad-prompts', () => ({
	LEIDRAAD_SECTION_GENERATION_PROMPT: 'mock-leidraad-system-prompt',
	LEIDRAAD_SECTION_DESCRIPTIONS: {
		inleiding: 'Beschrijf achtergrond en definities',
		procedure: 'Beschrijf planning en termijnen'
	}
}));

vi.mock('$server/ai/correspondence-prompts', () => ({
	LETTER_GENERATION_PROMPT: 'mock-letter-system-prompt',
	LETTER_TYPE_DESCRIPTIONS: {
		gunningsbeslissing: {
			label: 'Gunningsbeslissing',
			description: 'Brief met de voorlopige gunningsbeslissing'
		},
		afwijzing: {
			label: 'Afwijzingsbrief',
			description: 'Brief voor afgewezen inschrijvers'
		}
	}
}));

import { chat } from '$server/ai/client';
import { regenerateSection, chatAboutSection } from '../../src/lib/server/ai/generation-core';
import { generateSectionContent, generateLetter } from '../../src/lib/server/ai/generation-sections';

const mockChat = vi.mocked(chat);

// Shared test data
const MOCK_ARTIFACT = {
	id: 'art-1',
	project_id: 'proj-1',
	document_type_id: 'dt-1',
	section_key: 'inleiding',
	title: 'Inleiding',
	content: 'De aanbestedende dienst zoekt een leverancier.',
	version: 1,
	status: 'generated' as const,
	parent_artifact_id: null,
	sort_order: 0,
	metadata: {},
	data_classification: 'operational' as const,
	retention_until: null,
	anonymized_at: null,
	archive_status: 'active' as const,
	created_by: 'user-1',
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z'
};

const MOCK_DOCUMENT_TYPE = {
	id: 'dt-1',
	name: 'Aanbestedingsleidraad',
	slug: 'aanbestedingsleidraad',
	description: 'Test doc type',
	template_structure: [
		{ key: 'inleiding', title: 'Inleiding', description: 'Introductie van het project' }
	],
	applicable_procedures: ['open' as const],
	sort_order: 1,
	is_active: true,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z'
};

beforeEach(() => {
	vi.clearAllMocks();
});

// =========================================================================
// regenerateSection
// =========================================================================

describe('regenerateSection', () => {
	it('builds prompt with briefing data and current content', async () => {
		mockChat.mockResolvedValue({ content: 'Regenerated content', tokenCount: 150 });

		const briefingData = { summary: 'ICT-inkoop voor gemeente' };
		await regenerateSection({
			artifact: MOCK_ARTIFACT,
			documentType: MOCK_DOCUMENT_TYPE,
			briefingData
		});

		const callArgs = mockChat.mock.calls[0][0];
		const userPrompt = callArgs.messages[0].content;

		expect(userPrompt).toContain('Inleiding');
		expect(userPrompt).toContain('Introductie van het project');
		expect(userPrompt).toContain('ICT-inkoop voor gemeente');
		expect(userPrompt).toContain('De aanbestedende dienst zoekt een leverancier.');
	});

	it('includes user instructions when provided', async () => {
		mockChat.mockResolvedValue({ content: 'Updated section', tokenCount: 100 });

		await regenerateSection({
			artifact: MOCK_ARTIFACT,
			documentType: MOCK_DOCUMENT_TYPE,
			briefingData: { summary: 'Test' },
			instructions: 'Voeg meer detail toe over de planning'
		});

		const userPrompt = mockChat.mock.calls[0][0].messages[0].content;
		expect(userPrompt).toContain('Voeg meer detail toe over de planning');
	});

	it('includes RAG context snippets when provided', async () => {
		mockChat.mockResolvedValue({ content: 'Context-enriched content', tokenCount: 200 });

		await regenerateSection({
			artifact: MOCK_ARTIFACT,
			documentType: MOCK_DOCUMENT_TYPE,
			briefingData: {},
			contextSnippets: ['Fragment uit referentiedocument A', 'Fragment uit referentiedocument B']
		});

		const userPrompt = mockChat.mock.calls[0][0].messages[0].content;
		expect(userPrompt).toContain('Fragment uit referentiedocument A');
		expect(userPrompt).toContain('Fragment uit referentiedocument B');
		expect(userPrompt).toContain('---');
	});

	it('returns content and token count from chat', async () => {
		mockChat.mockResolvedValue({ content: 'New content here', tokenCount: 350 });

		const result = await regenerateSection({
			artifact: MOCK_ARTIFACT,
			documentType: MOCK_DOCUMENT_TYPE,
			briefingData: {}
		});

		expect(result.content).toBe('New content here');
		expect(result.tokenCount).toBe(350);
	});

	it('uses temperature 0.4 and REGENERATION system prompt', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		await regenerateSection({
			artifact: MOCK_ARTIFACT,
			documentType: MOCK_DOCUMENT_TYPE,
			briefingData: {}
		});

		const callArgs = mockChat.mock.calls[0][0];
		expect(callArgs.temperature).toBe(0.4);
		expect(callArgs.systemPrompt).toContain('senior aanbestedingsjurist');
	});

	it('falls back to "Geen beschrijving beschikbaar" for unknown section keys', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		const artifactUnknown = { ...MOCK_ARTIFACT, section_key: 'onbekend' };
		await regenerateSection({
			artifact: artifactUnknown,
			documentType: MOCK_DOCUMENT_TYPE,
			briefingData: {}
		});

		const userPrompt = mockChat.mock.calls[0][0].messages[0].content;
		expect(userPrompt).toContain('Geen beschrijving beschikbaar');
	});
});

// =========================================================================
// chatAboutSection
// =========================================================================

describe('chatAboutSection', () => {
	it('detects [SECTIE_UPDATE] tag and extracts updated content', async () => {
		const responseWithUpdate =
			'Ik heb de eisen aangescherpt.\n\n[SECTIE_UPDATE]\nDe aanbestedende dienst stelt de volgende eisen...';
		mockChat.mockResolvedValue({ content: responseWithUpdate, tokenCount: 200 });

		const result = await chatAboutSection({
			artifact: MOCK_ARTIFACT,
			messages: [{ role: 'user', content: 'Scherp de eisen aan' }]
		});

		expect(result.hasUpdate).toBe(true);
		expect(result.updatedContent).toBe('De aanbestedende dienst stelt de volgende eisen...');
	});

	it('returns hasUpdate=false when no tag is present', async () => {
		mockChat.mockResolvedValue({
			content: 'De huidige formulering is juridisch correct.',
			tokenCount: 80
		});

		const result = await chatAboutSection({
			artifact: MOCK_ARTIFACT,
			messages: [{ role: 'user', content: 'Is dit juridisch correct?' }]
		});

		expect(result.hasUpdate).toBe(false);
		expect(result.updatedContent).toBeNull();
	});

	it('strips [SECTIE_UPDATE] tag from returned content', async () => {
		mockChat.mockResolvedValue({
			content: 'Uitleg hier.\n\n[SECTIE_UPDATE]\nNieuwe inhoud',
			tokenCount: 100
		});

		const result = await chatAboutSection({
			artifact: MOCK_ARTIFACT,
			messages: [{ role: 'user', content: 'Pas aan' }]
		});

		expect(result.content).not.toContain('[SECTIE_UPDATE]');
		expect(result.content).toContain('Uitleg hier.');
	});

	it('includes artifact content in system prompt context', async () => {
		mockChat.mockResolvedValue({ content: 'Antwoord', tokenCount: 50 });

		await chatAboutSection({
			artifact: MOCK_ARTIFACT,
			messages: [{ role: 'user', content: 'Vraag' }]
		});

		const callArgs = mockChat.mock.calls[0][0];
		expect(callArgs.systemPrompt).toContain(MOCK_ARTIFACT.title);
		expect(callArgs.systemPrompt).toContain(MOCK_ARTIFACT.content);
	});
});

// =========================================================================
// generateSectionContent
// =========================================================================

describe('generateSectionContent', () => {
	it('builds prompt with section title and project profile', async () => {
		mockChat.mockResolvedValue({ content: 'Generated section', tokenCount: 300 });

		const profile = { projectNaam: 'ICT Werkplek', budget: '500000' };
		await generateSectionContent({
			sectionKey: 'inleiding',
			sectionTitle: 'Inleiding',
			projectProfile: profile
		});

		const userPrompt = mockChat.mock.calls[0][0].messages[0].content;
		expect(userPrompt).toContain('Inleiding');
		expect(userPrompt).toContain('ICT Werkplek');
		expect(userPrompt).toContain('500000');
	});

	it('uses enriched description from leidraad-prompts when available', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		await generateSectionContent({
			sectionKey: 'inleiding',
			sectionTitle: 'Inleiding',
			projectProfile: {}
		});

		const userPrompt = mockChat.mock.calls[0][0].messages[0].content;
		expect(userPrompt).toContain('Beschrijf achtergrond en definities');
	});

	it('falls back to sectionDescription when provided', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		await generateSectionContent({
			sectionKey: 'custom',
			sectionTitle: 'Custom',
			sectionDescription: 'Aangepaste beschrijving hier',
			projectProfile: {}
		});

		const userPrompt = mockChat.mock.calls[0][0].messages[0].content;
		expect(userPrompt).toContain('Aangepaste beschrijving hier');
	});

	it('includes market research and knowledge base context', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		await generateSectionContent({
			sectionKey: 'inleiding',
			sectionTitle: 'Inleiding',
			projectProfile: {},
			marketResearchContext: 'Marktonderzoek resultaat X',
			knowledgeBaseContext: 'Kennisbank fragment Y'
		});

		const userPrompt = mockChat.mock.calls[0][0].messages[0].content;
		expect(userPrompt).toContain('Marktonderzoek resultaat X');
		expect(userPrompt).toContain('Kennisbank fragment Y');
	});

	it('uses leidraad system prompt and temperature 0.4', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		await generateSectionContent({
			sectionKey: 'inleiding',
			sectionTitle: 'Inleiding',
			projectProfile: {}
		});

		const callArgs = mockChat.mock.calls[0][0];
		expect(callArgs.systemPrompt).toBe('mock-leidraad-system-prompt');
		expect(callArgs.temperature).toBe(0.4);
	});
});

// =========================================================================
// generateLetter
// =========================================================================

describe('generateLetter', () => {
	it('parses Onderwerp from letter output', async () => {
		mockChat.mockResolvedValue({
			content: 'Onderwerp: Voorlopige gunningsbeslissing ICT-opdracht\n\nGeachte heer/mevrouw,\n\nHierbij informeren wij u...',
			tokenCount: 400
		});

		const result = await generateLetter({
			letterType: 'gunningsbeslissing',
			phase: 'contracting',
			projectProfile: { naam: 'ICT' }
		});

		expect(result.subject).toBe('Voorlopige gunningsbeslissing ICT-opdracht');
		expect(result.body).toContain('Geachte heer/mevrouw');
		expect(result.body).not.toContain('Onderwerp:');
	});

	it('handles output without Onderwerp prefix', async () => {
		mockChat.mockResolvedValue({
			content: 'Geachte heer/mevrouw,\n\nHierbij de brief.',
			tokenCount: 100
		});

		const result = await generateLetter({
			letterType: 'afwijzing',
			phase: 'contracting',
			projectProfile: {}
		});

		expect(result.subject).toBe('');
		expect(result.body).toContain('Geachte heer/mevrouw');
	});

	it('includes evaluation data in prompt', async () => {
		mockChat.mockResolvedValue({
			content: 'Onderwerp: Afwijzing\n\nU bent niet geselecteerd.',
			tokenCount: 200
		});

		await generateLetter({
			letterType: 'afwijzing',
			phase: 'contracting',
			projectProfile: {},
			evaluationData: {
				tendererName: 'Leverancier BV',
				scores: { prijs: 70, kwaliteit: 60 },
				totalScore: 130,
				ranking: 3
			}
		});

		const userPrompt = mockChat.mock.calls[0][0].messages[0].content;
		expect(userPrompt).toContain('Leverancier BV');
		expect(userPrompt).toContain('130');
		expect(userPrompt).toContain('Ranking: 3');
	});

	it('uses letter type description from correspondence-prompts', async () => {
		mockChat.mockResolvedValue({ content: 'Onderwerp: Test\n\nBody', tokenCount: 50 });

		await generateLetter({
			letterType: 'gunningsbeslissing',
			phase: 'contracting',
			projectProfile: {}
		});

		const userPrompt = mockChat.mock.calls[0][0].messages[0].content;
		expect(userPrompt).toContain('Gunningsbeslissing');
		expect(userPrompt).toContain('Brief met de voorlopige gunningsbeslissing');
	});

	it('uses temperature 0.3 for letter generation', async () => {
		mockChat.mockResolvedValue({ content: 'Onderwerp: X\n\nY', tokenCount: 10 });

		await generateLetter({
			letterType: 'gunningsbeslissing',
			phase: 'contracting',
			projectProfile: {}
		});

		expect(mockChat.mock.calls[0][0].temperature).toBe(0.3);
	});
});
