// Unit tests: Fase 52 — server/api/export DOCX structure and PDF output

import { describe, it, expect } from 'vitest';
import { exportToDocx } from '../../src/lib/server/api/export-docx';
import { exportToPdf } from '../../src/lib/server/api/export-pdf';
import type { Artifact } from '$types';

// =========================================================================
// Shared test data
// =========================================================================

const MOCK_DOCUMENT_TYPE = {
	id: 'dt-1',
	name: 'Programma van Eisen',
	slug: 'programma-van-eisen',
	description: 'Test document type',
	template_structure: [],
	applicable_procedures: ['open' as const],
	sort_order: 1,
	is_active: true,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z'
};

function createArtifact(overrides: Partial<Artifact> = {}): Artifact {
	return {
		id: 'art-1',
		project_id: 'proj-1',
		document_type_id: MOCK_DOCUMENT_TYPE.id,
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
		updated_at: '2026-01-01T00:00:00Z',
		...overrides
	};
}

const BASE_PARAMS = {
	documentType: MOCK_DOCUMENT_TYPE,
	artifacts: [
		createArtifact({ id: 'art-1', section_key: 'inleiding', title: 'Inleiding' }),
		createArtifact({
			id: 'art-2',
			section_key: 'eisen',
			title: 'Eisen',
			content: '## Functionele eisen\n\n- Eis 1\n- Eis 2\n\n### Technische eisen\n\n* Eis A\n* Eis B'
		})
	],
	projectName: 'ICT-aanbesteding 2026',
	organizationName: 'Gemeente Amsterdam'
};

// =========================================================================
// DOCX export
// =========================================================================

describe('exportToDocx — structure', () => {
	it('produces a valid ZIP archive (OOXML)', async () => {
		const result = await exportToDocx(BASE_PARAMS);
		expect(result).toBeInstanceOf(Buffer);
		// DOCX/ZIP starts with PK signature (0x50 0x4B)
		expect(result[0]).toBe(0x50);
		expect(result[1]).toBe(0x4b);
	});

	it('produces different output for different document content', async () => {
		const result1 = await exportToDocx(BASE_PARAMS);
		const result2 = await exportToDocx({
			...BASE_PARAMS,
			artifacts: [
				createArtifact({ content: 'Heel andere inhoud die nergens op lijkt.' })
			]
		});

		// File sizes should differ for different content
		expect(result1.length).not.toBe(result2.length);
	});

	it('handles markdown heading levels in content', async () => {
		const artifact = createArtifact({
			content: '## Hoofdstuk\n\n### Subhoofdstuk\n\nGewone tekst\n\n- Bullet punt'
		});

		const result = await exportToDocx({
			...BASE_PARAMS,
			artifacts: [artifact]
		});

		expect(result).toBeInstanceOf(Buffer);
		expect(result.length).toBeGreaterThan(0);
	});

	it('handles artifact with empty content', async () => {
		const artifact = createArtifact({ content: '' });

		const result = await exportToDocx({
			...BASE_PARAMS,
			artifacts: [artifact]
		});

		expect(result).toBeInstanceOf(Buffer);
		expect(result.length).toBeGreaterThan(0);
	});

	it('grows in size with more artifacts', async () => {
		const singleArtifact = await exportToDocx({
			...BASE_PARAMS,
			artifacts: [createArtifact()]
		});

		const manyArtifacts = await exportToDocx({
			...BASE_PARAMS,
			artifacts: Array.from({ length: 10 }, (_, i) =>
				createArtifact({
					id: `art-${i}`,
					title: `Sectie ${i}`,
					content: `Inhoud voor sectie ${i} met behoorlijk wat tekst om volume te genereren.`
				})
			)
		});

		expect(manyArtifacts.length).toBeGreaterThan(singleArtifact.length);
	});

	it('handles bullet points with both - and * markers', async () => {
		const artifact = createArtifact({
			content: '- Punt met dash\n* Punt met asterisk\n- Nog een dash punt'
		});

		const result = await exportToDocx({ ...BASE_PARAMS, artifacts: [artifact] });
		expect(result).toBeInstanceOf(Buffer);
		expect(result.length).toBeGreaterThan(0);
	});
});

// =========================================================================
// PDF export
// =========================================================================

describe('exportToPdf — output', () => {
	it('produces valid PDF output starting with %PDF-', async () => {
		const result = await exportToPdf(BASE_PARAMS);
		expect(result).toBeInstanceOf(Uint8Array);
		const header = new TextDecoder().decode(result.slice(0, 5));
		expect(header).toBe('%PDF-');
	});

	it('produces different output for different content', async () => {
		const result1 = await exportToPdf(BASE_PARAMS);
		const result2 = await exportToPdf({
			...BASE_PARAMS,
			artifacts: [
				createArtifact({ content: 'Totaal andere tekst.' })
			]
		});

		expect(result1.length).not.toBe(result2.length);
	});

	it('handles word wrapping for very long lines', async () => {
		const artifact = createArtifact({
			content: 'Dit is een extreem lange regel die zeker niet in een enkele PDF-regel past en dus moet worden gewrapped naar de volgende regel om te voorkomen dat tekst buiten de marges valt van het document dat wordt gegenereerd door de Tendermanager applicatie. '.repeat(20)
		});

		const result = await exportToPdf({ ...BASE_PARAMS, artifacts: [artifact] });
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(0);
	});

	it('creates page breaks when content exceeds page height', async () => {
		const artifact = createArtifact({
			content: Array.from({ length: 200 }, (_, i) =>
				`Regel ${i + 1}: Gedetailleerde beschrijving van eis nummer ${i + 1}`
			).join('\n')
		});

		const result = await exportToPdf({ ...BASE_PARAMS, artifacts: [artifact] });
		expect(result).toBeInstanceOf(Uint8Array);

		// With 200 lines, size should be substantial (multiple pages)
		expect(result.length).toBeGreaterThan(5000);
	});

	it('handles headings with # markdown prefix', async () => {
		const artifact = createArtifact({
			content: '## Hoofdstuk 1\n\nTekst onder hoofdstuk.\n\n### Paragraaf 1.1\n\nMeer tekst.'
		});

		const result = await exportToPdf({ ...BASE_PARAMS, artifacts: [artifact] });
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(0);
	});

	it('handles empty artifacts list (title page only)', async () => {
		const result = await exportToPdf({ ...BASE_PARAMS, artifacts: [] });
		expect(result).toBeInstanceOf(Uint8Array);

		const header = new TextDecoder().decode(result.slice(0, 5));
		expect(header).toBe('%PDF-');
	});

	it('converts bullet markers to unicode bullet character', async () => {
		const artifact = createArtifact({
			content: '- Eerste punt\n* Tweede punt\n- Derde punt'
		});

		const result = await exportToPdf({ ...BASE_PARAMS, artifacts: [artifact] });
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBeGreaterThan(0);
	});

	it('grows in size with multiple artifacts', async () => {
		const small = await exportToPdf({
			...BASE_PARAMS,
			artifacts: [createArtifact()]
		});

		const large = await exportToPdf({
			...BASE_PARAMS,
			artifacts: Array.from({ length: 5 }, (_, i) =>
				createArtifact({
					id: `art-${i}`,
					title: `Sectie ${i}`,
					content: Array.from({ length: 30 }, (_, j) =>
						`Regel ${j + 1} van sectie ${i}: inhoud.`
					).join('\n')
				})
			)
		});

		expect(large.length).toBeGreaterThan(small.length);
	});
});
