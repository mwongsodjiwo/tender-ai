// Unit tests: Fase 52 — server/ai/briefing prompt templates and response parsing

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chat client before importing briefing module
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

import { chat } from '$server/ai/client';
import { conductBriefing, generateArtifacts } from '../../src/lib/server/ai/briefing';

const mockChat = vi.mocked(chat);

beforeEach(() => {
	vi.clearAllMocks();
});

// =========================================================================
// conductBriefing
// =========================================================================

describe('conductBriefing — completion detection', () => {
	it('detects [BRIEFING_COMPLEET] tag and marks isComplete=true', async () => {
		mockChat.mockResolvedValue({
			content: 'Samenvatting van het project.\n\n[BRIEFING_COMPLEET]',
			tokenCount: 250
		});

		const result = await conductBriefing([
			{ role: 'user', content: 'We willen ICT inkopen voor EUR 500.000' }
		]);

		expect(result.isComplete).toBe(true);
	});

	it('returns isComplete=false when tag is absent', async () => {
		mockChat.mockResolvedValue({
			content: 'Dank u. Kunt u de planning beschrijven?',
			tokenCount: 80
		});

		const result = await conductBriefing([
			{ role: 'user', content: 'We willen ICT inkopen' }
		]);

		expect(result.isComplete).toBe(false);
	});

	it('strips [BRIEFING_COMPLEET] tag from content', async () => {
		mockChat.mockResolvedValue({
			content: 'Projectsamenvatting hier.\n\n[BRIEFING_COMPLEET]',
			tokenCount: 150
		});

		const result = await conductBriefing([
			{ role: 'user', content: 'Bevestiging' }
		]);

		expect(result.content).not.toContain('[BRIEFING_COMPLEET]');
		expect(result.content).toContain('Projectsamenvatting hier.');
	});

	it('extracts briefing data only when complete', async () => {
		mockChat.mockResolvedValue({
			content: 'Vraag over procedure.',
			tokenCount: 50
		});

		const incomplete = await conductBriefing([
			{ role: 'user', content: 'Test' }
		]);
		expect(incomplete.briefingData).toEqual({});

		mockChat.mockResolvedValue({
			content: 'Samenvatting\n\n[BRIEFING_COMPLEET]',
			tokenCount: 100
		});

		const complete = await conductBriefing([
			{ role: 'user', content: 'ICT project' },
			{ role: 'assistant', content: 'Welke procedure?' },
			{ role: 'user', content: 'Openbaar' }
		]);

		expect(complete.briefingData).toHaveProperty('summary');
		expect(complete.briefingData).toHaveProperty('user_responses');
		expect(complete.briefingData).toHaveProperty('completed_at');
	});
});

describe('conductBriefing — prompt templates', () => {
	it('uses briefing system prompt with 7 conversation blocks', async () => {
		mockChat.mockResolvedValue({ content: 'Welkom!', tokenCount: 50 });

		await conductBriefing([{ role: 'user', content: 'Start briefing' }]);

		const callArgs = mockChat.mock.calls[0][0];
		const systemPrompt = callArgs.systemPrompt as string;

		// Verify all 7 blocks are referenced
		expect(systemPrompt).toContain('Blok 1');
		expect(systemPrompt).toContain('Blok 2');
		expect(systemPrompt).toContain('Blok 3');
		expect(systemPrompt).toContain('Blok 4');
		expect(systemPrompt).toContain('Blok 5');
		expect(systemPrompt).toContain('Blok 6');
		expect(systemPrompt).toContain('Blok 7');
	});

	it('includes mandatory block labels', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		await conductBriefing([{ role: 'user', content: 'Test' }]);

		const systemPrompt = mockChat.mock.calls[0][0].systemPrompt as string;
		expect(systemPrompt).toContain('VERPLICHT');
		expect(systemPrompt).toContain('AANBEVOLEN');
		expect(systemPrompt).toContain('OPTIONEEL');
	});

	it('uses temperature 0.6 for conversational tone', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		await conductBriefing([{ role: 'user', content: 'Test' }]);

		expect(mockChat.mock.calls[0][0].temperature).toBe(0.6);
	});

	it('includes legal references in system prompt', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		await conductBriefing([{ role: 'user', content: 'Test' }]);

		const systemPrompt = mockChat.mock.calls[0][0].systemPrompt as string;
		expect(systemPrompt).toContain('Aw 2012');
		expect(systemPrompt).toContain('art. 2.1');
		expect(systemPrompt).toContain('aanbestedingsrecht');
	});
});

describe('conductBriefing — response parsing', () => {
	it('returns token count from chat', async () => {
		mockChat.mockResolvedValue({ content: 'Antwoord', tokenCount: 500 });

		const result = await conductBriefing([
			{ role: 'user', content: 'Vraag' }
		]);

		expect(result.tokenCount).toBe(500);
	});

	it('extracts all user messages into briefing data', async () => {
		mockChat.mockResolvedValue({
			content: 'Samenvatting\n\n[BRIEFING_COMPLEET]',
			tokenCount: 100
		});

		const result = await conductBriefing([
			{ role: 'user', content: 'We kopen ICT in' },
			{ role: 'assistant', content: 'Welke procedure?' },
			{ role: 'user', content: 'Openbare procedure' },
			{ role: 'assistant', content: 'Budget?' },
			{ role: 'user', content: 'EUR 500.000' }
		]);

		const userResponses = result.briefingData.user_responses as string;
		expect(userResponses).toContain('We kopen ICT in');
		expect(userResponses).toContain('Openbare procedure');
		expect(userResponses).toContain('EUR 500.000');
	});

	it('includes ISO timestamp in completed briefing data', async () => {
		mockChat.mockResolvedValue({
			content: 'Done\n\n[BRIEFING_COMPLEET]',
			tokenCount: 50
		});

		const result = await conductBriefing([
			{ role: 'user', content: 'Bevestiging' }
		]);

		const timestamp = result.briefingData.completed_at as string;
		expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
	});
});

// =========================================================================
// generateArtifacts
// =========================================================================

describe('generateArtifacts', () => {
	it('generates one section per template entry', async () => {
		mockChat.mockResolvedValue({ content: 'Generated content', tokenCount: 100 });

		const documentType = {
			id: 'dt-1',
			name: 'Leidraad',
			slug: 'leidraad',
			description: null,
			template_structure: [
				{ key: 'inleiding', title: 'Inleiding', description: 'Introductie' },
				{ key: 'procedure', title: 'Procedure', description: 'Procedure details' },
				{ key: 'eisen', title: 'Eisen', description: 'Geschiktheidseisen' }
			],
			applicable_procedures: ['open' as const],
			sort_order: 1,
			is_active: true,
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z'
		};

		const sections = await generateArtifacts({
			briefingData: { summary: 'ICT project' },
			documentType,
			projectName: 'Test Project'
		});

		expect(sections).toHaveLength(3);
		expect(sections[0].sectionKey).toBe('inleiding');
		expect(sections[1].sectionKey).toBe('procedure');
		expect(sections[2].sectionKey).toBe('eisen');
	});

	it('calls chat sequentially (one call per section)', async () => {
		const callOrder: number[] = [];
		let callCount = 0;

		mockChat.mockImplementation(async () => {
			callCount++;
			callOrder.push(callCount);
			return { content: `Section ${callCount}`, tokenCount: 50 };
		});

		const documentType = {
			id: 'dt-1',
			name: 'Leidraad',
			slug: 'leidraad',
			description: null,
			template_structure: [
				{ key: 'a', title: 'A', description: 'First' },
				{ key: 'b', title: 'B', description: 'Second' }
			],
			applicable_procedures: ['open' as const],
			sort_order: 1,
			is_active: true,
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z'
		};

		await generateArtifacts({
			briefingData: {},
			documentType,
			projectName: 'Test'
		});

		expect(mockChat).toHaveBeenCalledTimes(2);
		expect(callOrder).toEqual([1, 2]);
	});

	it('includes briefing summary and section description in prompt', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		const documentType = {
			id: 'dt-1',
			name: 'Leidraad',
			slug: 'leidraad',
			description: null,
			template_structure: [
				{ key: 'inleiding', title: 'Inleiding', description: 'Beschrijf de achtergrond' }
			],
			applicable_procedures: ['open' as const],
			sort_order: 1,
			is_active: true,
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z'
		};

		await generateArtifacts({
			briefingData: { summary: 'Project voor kantoorinrichting' },
			documentType,
			projectName: 'Kantoor 2026'
		});

		const userPrompt = mockChat.mock.calls[0][0].messages[0].content;
		expect(userPrompt).toContain('Inleiding');
		expect(userPrompt).toContain('Beschrijf de achtergrond');
		expect(userPrompt).toContain('Kantoor 2026');
	});

	it('uses temperature 0.4 and generation system prompt', async () => {
		mockChat.mockResolvedValue({ content: 'ok', tokenCount: 10 });

		const documentType = {
			id: 'dt-1',
			name: 'Leidraad',
			slug: 'leidraad',
			description: null,
			template_structure: [
				{ key: 'a', title: 'A', description: 'Desc' }
			],
			applicable_procedures: ['open' as const],
			sort_order: 1,
			is_active: true,
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z'
		};

		await generateArtifacts({
			briefingData: {},
			documentType,
			projectName: 'Test'
		});

		const callArgs = mockChat.mock.calls[0][0];
		expect(callArgs.temperature).toBe(0.4);
		expect(callArgs.systemPrompt).toContain('senior aanbestedingsjurist');
	});

	it('returns empty array for document type with no sections', async () => {
		const documentType = {
			id: 'dt-1',
			name: 'Leeg',
			slug: 'leeg',
			description: null,
			template_structure: [],
			applicable_procedures: ['open' as const],
			sort_order: 1,
			is_active: true,
			created_at: '2026-01-01T00:00:00Z',
			updated_at: '2026-01-01T00:00:00Z'
		};

		const sections = await generateArtifacts({
			briefingData: {},
			documentType,
			projectName: 'Test'
		});

		expect(sections).toEqual([]);
		expect(mockChat).not.toHaveBeenCalled();
	});
});
