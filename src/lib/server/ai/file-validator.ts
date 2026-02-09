// Magic bytes validation — verifies file content matches claimed MIME type
// Prevents renamed executables or mismatched files from entering the pipeline

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46]; // %PDF
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]; // PK (DOCX is a ZIP archive)
const OLE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0]; // OLE compound (legacy .doc)

const MIME_SIGNATURES: Record<string, { bytes: number[]; offset: number }[]> = {
	'application/pdf': [{ bytes: PDF_SIGNATURE, offset: 0 }],
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
		{ bytes: ZIP_SIGNATURE, offset: 0 }
	],
	'application/msword': [{ bytes: OLE_SIGNATURE, offset: 0 }]
};

const MAX_NULL_BYTE_RATIO = 0.05;
const HEADER_READ_SIZE = 16;

interface ValidationResult {
	valid: boolean;
	reason?: string;
}

export async function validateFileSignature(
	file: File,
	claimedMimeType: string
): Promise<ValidationResult> {
	const signatures = MIME_SIGNATURES[claimedMimeType];

	// Text files: check for binary content (excessive null bytes)
	if (claimedMimeType === 'text/plain' || claimedMimeType === 'text/csv') {
		return validateTextFile(file);
	}

	// No signature defined for this type — skip validation
	if (!signatures) {
		return { valid: true };
	}

	const headerBuffer = await readFileHeader(file, HEADER_READ_SIZE);

	for (const sig of signatures) {
		if (matchesSignature(headerBuffer, sig.bytes, sig.offset)) {
			return { valid: true };
		}
	}

	return {
		valid: false,
		reason: `Bestandsinhoud komt niet overeen met type ${claimedMimeType}. Het bestand is mogelijk hernoemd of beschadigd.`
	};
}

async function readFileHeader(file: File, size: number): Promise<Uint8Array> {
	const slice = file.slice(0, size);
	const buffer = await slice.arrayBuffer();
	return new Uint8Array(buffer);
}

function matchesSignature(header: Uint8Array, signature: number[], offset: number): boolean {
	if (header.length < offset + signature.length) return false;

	for (let i = 0; i < signature.length; i++) {
		if (header[offset + i] !== signature[i]) return false;
	}
	return true;
}

async function validateTextFile(file: File): Promise<ValidationResult> {
	const sampleSize = Math.min(file.size, 4096);
	const slice = file.slice(0, sampleSize);
	const buffer = await slice.arrayBuffer();
	const bytes = new Uint8Array(buffer);

	let nullCount = 0;
	for (const byte of bytes) {
		if (byte === 0x00) nullCount++;
	}

	if (bytes.length > 0 && nullCount / bytes.length > MAX_NULL_BYTE_RATIO) {
		return {
			valid: false,
			reason: 'Bestand bevat binaire data en is geen geldig tekstbestand.'
		};
	}

	return { valid: true };
}
