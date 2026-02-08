// Document text extraction — parses PDF and Word files into plain text

import type { Buffer } from 'node:buffer';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC_MIME = 'application/msword';
const TEXT_MIME = 'text/plain';
const CSV_MIME = 'text/csv';

const SUPPORTED_TEXT_TYPES = new Set([TEXT_MIME, CSV_MIME]);
const SUPPORTED_PARSE_TYPES = new Set([PDF_MIME, DOCX_MIME, DOC_MIME]);

export function isTextExtractable(mimeType: string): boolean {
	return SUPPORTED_TEXT_TYPES.has(mimeType) || SUPPORTED_PARSE_TYPES.has(mimeType);
}

export async function extractText(file: File): Promise<string | null> {
	if (SUPPORTED_TEXT_TYPES.has(file.type)) {
		return await file.text();
	}

	if (file.type === PDF_MIME) {
		return await extractPdfText(file);
	}

	if (file.type === DOCX_MIME || file.type === DOC_MIME) {
		return await extractWordText(file);
	}

	return null;
}

async function extractPdfText(file: File): Promise<string | null> {
	try {
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// pdf-parse exports { pdf, PDFParse, initPDFJS }
		const { pdf } = await import('pdf-parse');
		const result = await pdf(buffer);

		const text = result?.text?.trim();
		return text && text.length > 0 ? text : null;
	} catch (err) {
		console.error('PDF parsing failed:', err instanceof Error ? err.message : err);
		return null;
	}
}

async function extractWordText(file: File): Promise<string | null> {
	try {
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// mammoth extracts text from .docx files
		const mammoth = await import('mammoth');
		const result = await mammoth.extractRawText({ buffer });

		const text = result?.value?.trim();
		return text && text.length > 0 ? text : null;
	} catch (err) {
		console.error('Word parsing failed:', err instanceof Error ? err.message : err);
		return null;
	}
}
