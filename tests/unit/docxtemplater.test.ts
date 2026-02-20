import { describe, it, expect } from 'vitest';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { renderTemplate, extractTemplateTags } from '$server/templates/renderer';
import {
	getAllPlaceholders,
	getPlaceholder,
	getPlaceholderKeys,
	getPlaceholdersBySource,
	validatePlaceholders
} from '$server/templates/placeholder-registry';
import { formatDutchDate } from '$server/templates/data-collector';
import {
	createSimpleTemplate,
	createListTemplate,
	createTemplateWithMissing,
	createTestDocx
} from './fixtures/create-test-template';

// =============================================================================
// RENDERER TESTS
// =============================================================================

describe('docxtemplater Integration', () => {
	it('rendert template met data', () => {
		const template = createSimpleTemplate();
		const data = {
			org_name: 'Gemeente Amsterdam',
			org_kvk_nummer: '12345678',
			project_name: 'Schoonmaakdiensten',
			datum_vandaag: '18 februari 2026',
			scope_description: 'Facilitaire schoonmaak voor gemeentepanden'
		};

		const result = renderTemplate(template, data);

		expect(result).toBeInstanceOf(Buffer);
		expect(result.length).toBeGreaterThan(0);

		// Verify content was actually rendered
		const zip = new PizZip(result);
		const doc = new Docxtemplater(zip, {
			paragraphLoop: true,
			linebreaks: true
		});
		const fullText = doc.getFullText();
		expect(fullText).toContain('Gemeente Amsterdam');
		expect(fullText).toContain('12345678');
		expect(fullText).toContain('Schoonmaakdiensten');
	});

	it('vervangt alle placeholders', () => {
		const template = createSimpleTemplate();
		const data = {
			org_name: 'Provincie Utrecht',
			org_kvk_nummer: '87654321',
			project_name: 'ICT Diensten',
			datum_vandaag: '1 maart 2026',
			scope_description: 'Beheer en onderhoud ICT-infrastructuur'
		};

		const result = renderTemplate(template, data);
		const zip = new PizZip(result);
		const doc = new Docxtemplater(zip, {
			paragraphLoop: true,
			linebreaks: true
		});
		const fullText = doc.getFullText();

		// No unresolved placeholders should remain
		expect(fullText).not.toContain('{org_name}');
		expect(fullText).not.toContain('{org_kvk_nummer}');
		expect(fullText).not.toContain('{project_name}');
		expect(fullText).not.toContain('{datum_vandaag}');
		expect(fullText).not.toContain('{scope_description}');

		// All values present
		expect(fullText).toContain('Provincie Utrecht');
		expect(fullText).toContain('ICT Diensten');
	});

	it('handelt ontbrekende data af (lege string)', () => {
		const template = createSimpleTemplate();
		const data = {
			org_name: 'Test Org'
			// Other fields intentionally missing
		};

		// Should NOT throw
		const result = renderTemplate(template, data);

		expect(result).toBeInstanceOf(Buffer);
		expect(result.length).toBeGreaterThan(0);

		const zip = new PizZip(result);
		const doc = new Docxtemplater(zip, {
			paragraphLoop: true,
			linebreaks: true
		});
		const fullText = doc.getFullText();

		// Known value is present
		expect(fullText).toContain('Test Org');
		// Missing placeholders are empty, not error text
		expect(fullText).not.toContain('{project_name}');
		expect(fullText).not.toContain('undefined');
		expect(fullText).not.toContain('null');
	});

	it('rendert lijsten (leveranciers, vragen)', () => {
		const template = createListTemplate();
		const data = {
			suppliers: [
				{ name: 'Bedrijf A', adres: 'Straat 1, Amsterdam' },
				{ name: 'Bedrijf B', adres: 'Laan 2, Utrecht' }
			],
			questions: [
				{ number: 1, question: 'Wat is de levertijd?', answer: '30 dagen' },
				{ number: 2, question: 'Is er garantie?', answer: 'Ja, 2 jaar' }
			]
		};

		const result = renderTemplate(template, data);
		const zip = new PizZip(result);
		const doc = new Docxtemplater(zip, {
			paragraphLoop: true,
			linebreaks: true
		});
		const fullText = doc.getFullText();

		expect(fullText).toContain('Bedrijf A');
		expect(fullText).toContain('Bedrijf B');
		expect(fullText).toContain('Straat 1, Amsterdam');
		expect(fullText).toContain('Wat is de levertijd?');
		expect(fullText).toContain('30 dagen');
		expect(fullText).toContain('Is er garantie?');
		expect(fullText).toContain('Ja, 2 jaar');
	});

	it('behoudt opmaak — output is valid docx', () => {
		const template = createSimpleTemplate();
		const data = { org_name: 'Test' };

		const result = renderTemplate(template, data);

		// Verify it's a valid zip (docx is a zip archive)
		const zip = new PizZip(result);
		expect(zip.file('[Content_Types].xml')).toBeTruthy();
		expect(zip.file('word/document.xml')).toBeTruthy();
	});

	it('handles empty lists gracefully', () => {
		const template = createListTemplate();
		const data = {
			suppliers: [],
			questions: []
		};

		const result = renderTemplate(template, data);
		expect(result).toBeInstanceOf(Buffer);
		expect(result.length).toBeGreaterThan(0);
	});

	it('handles completely empty data', () => {
		const template = createSimpleTemplate();
		const result = renderTemplate(template, {});
		expect(result).toBeInstanceOf(Buffer);
	});
});

// =============================================================================
// PLACEHOLDER REGISTRY TESTS
// =============================================================================

describe('Placeholder Registry', () => {
	it('returns all registered placeholders', () => {
		const all = getAllPlaceholders();
		expect(all.length).toBeGreaterThan(15);

		// Check essential placeholders are present
		const keys = all.map((p) => p.key);
		expect(keys).toContain('org_name');
		expect(keys).toContain('project_name');
		expect(keys).toContain('datum_vandaag');
		expect(keys).toContain('supplier_name');
		expect(keys).toContain('scope_description');
	});

	it('gets a placeholder by key', () => {
		const placeholder = getPlaceholder('org_name');
		expect(placeholder).toBeDefined();
		expect(placeholder?.source).toBe('organization');
		expect(placeholder?.label).toBe('Organisatienaam');
	});

	it('returns undefined for unknown keys', () => {
		const placeholder = getPlaceholder('nonexistent_key');
		expect(placeholder).toBeUndefined();
	});

	it('returns all keys as a Set', () => {
		const keys = getPlaceholderKeys();
		expect(keys).toBeInstanceOf(Set);
		expect(keys.has('org_name')).toBe(true);
		expect(keys.has('fake_key')).toBe(false);
	});

	it('filters by source', () => {
		const orgPlaceholders = getPlaceholdersBySource('organization');
		expect(orgPlaceholders.length).toBeGreaterThan(0);
		expect(orgPlaceholders.every((p) => p.source === 'organization')).toBe(true);

		const aiPlaceholders = getPlaceholdersBySource('ai');
		expect(aiPlaceholders.length).toBeGreaterThan(0);
		expect(aiPlaceholders.every((p) => p.source === 'ai')).toBe(true);
	});

	it('validates recognized and unrecognized placeholders', () => {
		const result = validatePlaceholders([
			'org_name',
			'project_name',
			'unknown_field',
			'another_missing'
		]);

		expect(result.recognized).toContain('org_name');
		expect(result.recognized).toContain('project_name');
		expect(result.unrecognized).toContain('unknown_field');
		expect(result.unrecognized).toContain('another_missing');
	});
});

// =============================================================================
// DATA COLLECTOR TESTS (unit-testable parts)
// =============================================================================

describe('Data Collector — formatDutchDate', () => {
	it('formats a date in Dutch', () => {
		const date = new Date(2026, 1, 18); // February 18, 2026
		const result = formatDutchDate(date);
		expect(result).toBe('18 februari 2026');
	});

	it('formats January correctly', () => {
		const date = new Date(2026, 0, 1);
		const result = formatDutchDate(date);
		expect(result).toBe('1 januari 2026');
	});

	it('formats December correctly', () => {
		const date = new Date(2025, 11, 31);
		const result = formatDutchDate(date);
		expect(result).toBe('31 december 2025');
	});
});
