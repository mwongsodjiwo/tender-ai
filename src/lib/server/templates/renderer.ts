/**
 * Document template renderer using docxtemplater.
 * Renders .docx templates with data placeholders.
 * Missing placeholders resolve to empty strings (no crashes).
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { logError, logInfo } from '$server/logger.js';

export interface RenderOptions {
	/** Replace missing placeholders with empty string (default: true) */
	nullGetter?: boolean;
	/** Strip whitespace around empty tags (default: true) */
	linebreaks?: boolean;
}

const DEFAULT_OPTIONS: Required<RenderOptions> = {
	nullGetter: true,
	linebreaks: true
};

/**
 * Render a .docx template buffer with the given data.
 * Supports simple placeholders ({key}) and loops ({#list}{field}{/list}).
 * Missing placeholders resolve to empty string by default.
 */
export function renderTemplate(
	templateBuffer: Buffer,
	data: Record<string, unknown>,
	options?: RenderOptions
): Buffer {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	const zip = new PizZip(templateBuffer);

	const doc = new Docxtemplater(zip, {
		paragraphLoop: opts.linebreaks,
		linebreaks: opts.linebreaks,
		nullGetter: opts.nullGetter ? createNullGetter() : undefined
	});

	doc.render(data);

	const outputBuffer = doc.getZip().generate({
		type: 'nodebuffer',
		compression: 'DEFLATE'
	});

	logInfo('Template rendered successfully', {
		dataKeys: Object.keys(data).length
	});

	return outputBuffer as Buffer;
}

/**
 * Extract placeholder tag names from a .docx template.
 * Returns all tags found in the template (both simple and loop tags).
 */
export function extractTemplateTags(templateBuffer: Buffer): string[] {
	const zip = new PizZip(templateBuffer);

	const doc = new Docxtemplater(zip, {
		paragraphLoop: true,
		linebreaks: true,
		nullGetter: createNullGetter()
	});

	const tags = doc.getFullText();
	const tagPattern = /\{([^{}#/]+)\}/g;
	const found = new Set<string>();
	let match: RegExpExecArray | null;

	while ((match = tagPattern.exec(tags)) !== null) {
		found.add(match[1].trim());
	}

	return [...found];
}

/**
 * Creates a nullGetter function that returns empty string
 * for missing placeholders instead of throwing errors.
 */
function createNullGetter(): (part: { module: string; value: string }) => string {
	return function nullGetter(part) {
		if (!part.module) {
			logError('Missing placeholder in template', { tag: part.value });
			return '';
		}
		return '';
	};
}
