// Unit tests for file signature validation — magic bytes + text file checks

import { describe, it, expect } from 'vitest';
import { validateFileSignature } from '$server/ai/file-validator';

function createFileFromBytes(bytes: number[], mimeType: string, name = 'test'): File {
	const buffer = new Uint8Array(bytes);
	return new File([buffer], name, { type: mimeType });
}

describe('validateFileSignature', () => {
	// PDF validation
	it('accepts valid PDF file', async () => {
		const pdfHeader = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, ...Array(8).fill(0)]; // %PDF-1.4
		const file = createFileFromBytes(pdfHeader, 'application/pdf', 'test.pdf');
		const result = await validateFileSignature(file, 'application/pdf');
		expect(result.valid).toBe(true);
	});

	it('rejects non-PDF header claiming to be PDF', async () => {
		const zipHeader = [0x50, 0x4b, 0x03, 0x04, ...Array(12).fill(0)];
		const file = createFileFromBytes(zipHeader, 'application/pdf', 'fake.pdf');
		const result = await validateFileSignature(file, 'application/pdf');
		expect(result.valid).toBe(false);
		expect(result.reason).toBeDefined();
	});

	// DOCX validation (ZIP signature)
	it('accepts valid DOCX file', async () => {
		const zipHeader = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, ...Array(8).fill(0)];
		const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
		const file = createFileFromBytes(zipHeader, mime, 'test.docx');
		const result = await validateFileSignature(file, mime);
		expect(result.valid).toBe(true);
	});

	// DOC validation (OLE signature)
	it('accepts valid DOC file', async () => {
		const oleHeader = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, ...Array(8).fill(0)];
		const file = createFileFromBytes(oleHeader, 'application/msword', 'test.doc');
		const result = await validateFileSignature(file, 'application/msword');
		expect(result.valid).toBe(true);
	});

	// Unknown MIME types pass through
	it('accepts unknown MIME type without signature check', async () => {
		const randomBytes = [0x01, 0x02, 0x03, 0x04, ...Array(12).fill(0)];
		const file = createFileFromBytes(randomBytes, 'application/octet-stream', 'data.bin');
		const result = await validateFileSignature(file, 'application/octet-stream');
		expect(result.valid).toBe(true);
	});

	// EXE header rejected as PDF
	it('rejects EXE header as PDF', async () => {
		const exeHeader = [0x4d, 0x5a, 0x90, 0x00, ...Array(12).fill(0)]; // MZ header
		const file = createFileFromBytes(exeHeader, 'application/pdf', 'malware.pdf');
		const result = await validateFileSignature(file, 'application/pdf');
		expect(result.valid).toBe(false);
	});

	// Text file validation
	it('accepts clean text file', async () => {
		const textBytes = Array.from('Hello, this is a clean text file.').map((c) => c.charCodeAt(0));
		const file = createFileFromBytes(textBytes, 'text/plain', 'clean.txt');
		const result = await validateFileSignature(file, 'text/plain');
		expect(result.valid).toBe(true);
	});

	it('rejects binary content disguised as text', async () => {
		// Create content with >5% null bytes
		const binaryBytes = Array(100).fill(0x00).concat(Array(50).fill(0x41)); // 66% null bytes
		const file = createFileFromBytes(binaryBytes, 'text/plain', 'binary.txt');
		const result = await validateFileSignature(file, 'text/plain');
		expect(result.valid).toBe(false);
		expect(result.reason).toContain('binaire data');
	});

	it('accepts CSV file with clean content', async () => {
		const csvBytes = Array.from('name,value\ntest,123').map((c) => c.charCodeAt(0));
		const file = createFileFromBytes(csvBytes, 'text/csv', 'data.csv');
		const result = await validateFileSignature(file, 'text/csv');
		expect(result.valid).toBe(true);
	});

	it('rejects header shorter than signature', async () => {
		const shortFile = createFileFromBytes([0x25, 0x50], 'application/pdf', 'short.pdf');
		const result = await validateFileSignature(shortFile, 'application/pdf');
		expect(result.valid).toBe(false);
	});

	it('provides Dutch error message on invalid file', async () => {
		const exeHeader = [0x4d, 0x5a, 0x90, 0x00, ...Array(12).fill(0)];
		const file = createFileFromBytes(exeHeader, 'application/pdf', 'fake.pdf');
		const result = await validateFileSignature(file, 'application/pdf');
		expect(result.reason).toContain('Bestandsinhoud');
	});
});
