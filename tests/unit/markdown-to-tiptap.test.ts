import { describe, it, expect } from 'vitest';
import { markdownToTiptapHtml } from '$utils/markdown-to-tiptap';

describe('Markdown to TipTap HTML', () => {
	it('converteert bullets naar bulletList', async () => {
		const markdown = '- Item een\n- Item twee\n- Item drie';
		const result = await markdownToTiptapHtml(markdown);

		expect(result).toContain('<ul>');
		expect(result).toContain('<li>');
		expect(result).toContain('Item een');
		expect(result).toContain('Item twee');
		expect(result).toContain('Item drie');
		expect(result).toContain('</ul>');
	});

	it('converteert headers naar heading nodes', async () => {
		const markdown = '# Heading 1\n\n## Heading 2\n\n### Heading 3';
		const result = await markdownToTiptapHtml(markdown);

		expect(result).toContain('<h1>Heading 1</h1>');
		expect(result).toContain('<h2>Heading 2</h2>');
		expect(result).toContain('<h3>Heading 3</h3>');
	});

	it('converteert bold en italic', async () => {
		const markdown = 'Dit is **vetgedrukt** en dit is *cursief* tekst.';
		const result = await markdownToTiptapHtml(markdown);

		expect(result).toContain('<strong>vetgedrukt</strong>');
		expect(result).toContain('<em>cursief</em>');
	});

	it('converteert geneste lijsten', async () => {
		const markdown = '- Hoofdpunt\n  - Subpunt A\n  - Subpunt B\n- Tweede hoofdpunt';
		const result = await markdownToTiptapHtml(markdown);

		expect(result).toContain('<ul>');
		expect(result).toContain('Hoofdpunt');
		expect(result).toContain('Subpunt A');
		expect(result).toContain('Subpunt B');
		expect(result).toContain('Tweede hoofdpunt');

		// Nested list should create a nested ul
		const ulCount = (result.match(/<ul>/g) ?? []).length;
		expect(ulCount).toBeGreaterThanOrEqual(2);
	});

	it('behoudt paragrafen', async () => {
		const markdown = 'Eerste paragraaf.\n\nTweede paragraaf.';
		const result = await markdownToTiptapHtml(markdown);

		expect(result).toContain('<p>Eerste paragraaf.</p>');
		expect(result).toContain('<p>Tweede paragraaf.</p>');
	});

	it('handelt lege input af', async () => {
		expect(await markdownToTiptapHtml('')).toBe('');
		expect(await markdownToTiptapHtml('   ')).toBe('');
		expect(await markdownToTiptapHtml('\n\n')).toBe('');
	});

	it('converteert mixed content (tekst + bullets + headers)', async () => {
		const markdown = [
			'# Inleiding',
			'',
			'Dit is een inleidende paragraaf.',
			'',
			'## Onderdelen',
			'',
			'- Eerste punt',
			'- Tweede punt met **nadruk**',
			'- Derde punt',
			'',
			'### Conclusie',
			'',
			'Een afsluitende tekst.'
		].join('\n');

		const result = await markdownToTiptapHtml(markdown);

		expect(result).toContain('<h1>Inleiding</h1>');
		expect(result).toContain('<p>Dit is een inleidende paragraaf.</p>');
		expect(result).toContain('<h2>Onderdelen</h2>');
		expect(result).toContain('<ul>');
		expect(result).toContain('<li>Eerste punt</li>');
		expect(result).toContain('<strong>nadruk</strong>');
		expect(result).toContain('<h3>Conclusie</h3>');
		expect(result).toContain('<p>Een afsluitende tekst.</p>');
	});

	it('converteert genummerde lijsten', async () => {
		const markdown = '1. Eerste stap\n2. Tweede stap\n3. Derde stap';
		const result = await markdownToTiptapHtml(markdown);

		expect(result).toContain('<ol>');
		expect(result).toContain('<li>');
		expect(result).toContain('Eerste stap');
		expect(result).toContain('Tweede stap');
		expect(result).toContain('Derde stap');
		expect(result).toContain('</ol>');
	});

	it('converteert bold en italic gecombineerd', async () => {
		const markdown = '***Vet en cursief***';
		const result = await markdownToTiptapHtml(markdown);

		expect(result).toContain('<strong>');
		expect(result).toContain('<em>');
		expect(result).toContain('Vet en cursief');
	});
});
