/**
 * Helper to create a minimal .docx template buffer for testing.
 * Uses PizZip to create a valid .docx with placeholder tags.
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const MINIMAL_DOCX_CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const MINIMAL_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const MINIMAL_WORD_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

/**
 * Create a minimal valid .docx buffer with the given body XML content.
 */
export function createTestDocx(bodyContent: string): Buffer {
	const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml">
  <w:body>
    ${bodyContent}
  </w:body>
</w:document>`;

	const zip = new PizZip();
	zip.file('[Content_Types].xml', MINIMAL_DOCX_CONTENT_TYPES);
	zip.file('_rels/.rels', MINIMAL_RELS);
	zip.file('word/_rels/document.xml.rels', MINIMAL_WORD_RELS);
	zip.file('word/document.xml', documentXml);

	return zip.generate({ type: 'nodebuffer' }) as Buffer;
}

/** Create a paragraph with text content. */
function paragraph(text: string): string {
	return `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

/** Create a test template with standard placeholders. */
export function createSimpleTemplate(): Buffer {
	const body = [
		paragraph('Organisatie: {org_name}'),
		paragraph('KVK: {org_kvk_nummer}'),
		paragraph('Project: {project_name}'),
		paragraph('Datum: {datum_vandaag}'),
		paragraph('Scope: {scope_description}')
	].join('\n');

	return createTestDocx(body);
}

/** Create a test template with loop placeholders. */
export function createListTemplate(): Buffer {
	const body = [
		paragraph('Leveranciers:'),
		paragraph('{#suppliers}'),
		paragraph('- {name} ({adres})'),
		paragraph('{/suppliers}'),
		paragraph('Vragen:'),
		paragraph('{#questions}'),
		paragraph('{number}. {question} — {answer}'),
		paragraph('{/questions}')
	].join('\n');

	return createTestDocx(body);
}

/** Create a template with an unknown placeholder. */
export function createTemplateWithMissing(): Buffer {
	const body = [
		paragraph('Known: {org_name}'),
		paragraph('Unknown: {unknown_field}'),
		paragraph('Also unknown: {another_missing}')
	].join('\n');

	return createTestDocx(body);
}
