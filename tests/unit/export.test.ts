// Unit tests: Sprint 2 document export engine

import { describe, it, expect } from 'vitest';
import { exportToDocx, exportToPdf } from '../../src/lib/server/api/export';

const MOCK_DOCUMENT_TYPE = {
	id: '550e8400-e29b-41d4-a716-446655440000',
	name: 'Programma van Eisen',
	slug: 'programma-van-eisen',
	description: 'Test document type',
	template_structure: [],
	applicable_procedures: ['open'],
	sort_order: 1,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z'
};

const MOCK_ARTIFACTS = [
	{
		id: 'art-1',
		project_id: 'proj-1',
		document_type_id: MOCK_DOCUMENT_TYPE.id,
		section_key: 'introduction',
		title: 'Inleiding',
		content: '## Achtergrond\n\nDit document beschrijft de eisen.\n\n### Doel\n\n- Eis 1\n- Eis 2\n\nDe aanbestedende dienst zoekt een leverancier.',
		version: 1,
		status: 'generated' as const,
		sort_order: 0,
		metadata: {},
		created_by: 'user-1',
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z'
	},
	{
		id: 'art-2',
		project_id: 'proj-1',
		document_type_id: MOCK_DOCUMENT_TYPE.id,
		section_key: 'requirements',
		title: 'Eisen',
		content: 'De volgende eisen zijn van toepassing:\n\n- Functionele eis A\n- Functionele eis B',
		version: 1,
		status: 'generated' as const,
		sort_order: 1,
		metadata: {},
		created_by: 'user-1',
		created_at: '2026-01-01T00:00:00Z',
		updated_at: '2026-01-01T00:00:00Z'
	}
];

const BASE_PARAMS = {
	documentType: MOCK_DOCUMENT_TYPE,
	artifacts: MOCK_ARTIFACTS,
	projectName: 'ICT-aanbesteding 2026',
	organizationName: 'Gemeente Amsterdam'
};

describe('exportToDocx', () => {
	it('should generate a valid docx buffer', async () => {
		const result = await exportToDocx(BASE_PARAMS);
		expect(result).toBeInstanceOf(Buffer);
		expect(result.length).toBeGreaterThan(0);
	});

	it('should handle empty artifacts', async () => {
		const result = await exportToDocx({ ...BASE_PARAMS, artifacts: [] });
		expect(result).toBeInstanceOf(Buffer);
		expect(result.length).toBeGreaterThan(0);
	});

	it('should handle single artifact', async () => {
		const result = await exportToDocx({ ...BASE_PARAMS, artifacts: [MOCK_ARTIFACTS[0]] });
		expect(result).toBeInstanceOf(Buffer);
		expect(result.length).toBeGreaterThan(0);
	});

	it('should produce a valid OOXML file (starts with PK zip header)', async () => {
		const result = await exportToDocx(BASE_PARAMS);
		// DOCX files are ZIP archives, starting with PK (0x50, 0x4B)
		expect(result[0]).toBe(0x50);
		expect(result[1]).toBe(0x4b);
	});
});

describe('exportToPdf', () => {
	it('should generate a valid PDF', async () => {
		const result = await exportToPdf(BASE_PARAMS);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(0);
	});

	it('should produce output starting with PDF header', async () => {
		const result = await exportToPdf(BASE_PARAMS);
		const header = new TextDecoder().decode(result.slice(0, 5));
		expect(header).toBe('%PDF-');
	});

	it('should handle empty artifacts', async () => {
		const result = await exportToPdf({ ...BASE_PARAMS, artifacts: [] });
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(0);
	});

	it('should handle long content with word wrapping', async () => {
		const longArtifact = {
			...MOCK_ARTIFACTS[0],
			content: 'Dit is een zeer lange tekst die over meerdere regels moet worden gewrapped om te passen binnen de marges van het PDF-document. '.repeat(50)
		};
		const result = await exportToPdf({ ...BASE_PARAMS, artifacts: [longArtifact] });
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(0);
	});

	it('should handle content with many line breaks (page breaks)', async () => {
		const manyLinesArtifact = {
			...MOCK_ARTIFACTS[0],
			content: Array.from({ length: 100 }, (_, i) => `Regel ${i + 1}: Eis nummer ${i + 1}`).join('\n')
		};
		const result = await exportToPdf({ ...BASE_PARAMS, artifacts: [manyLinesArtifact] });
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(0);
	});
});
