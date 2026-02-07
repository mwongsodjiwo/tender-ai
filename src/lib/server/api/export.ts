// Document export engine — generates Word (docx) and PDF files

import {
	Document as DocxDocument,
	Packer,
	Paragraph,
	TextRun,
	HeadingLevel,
	AlignmentType,
	PageBreak,
	Footer,
	Header
} from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Artifact, DocumentType } from '$types';

interface ExportParams {
	documentType: DocumentType;
	artifacts: Artifact[];
	projectName: string;
	organizationName: string;
}

// =============================================================================
// WORD EXPORT
// =============================================================================

export async function exportToDocx(params: ExportParams): Promise<Buffer> {
	const { documentType, artifacts, projectName, organizationName } = params;

	const children: Paragraph[] = [];

	// Title page
	children.push(
		new Paragraph({
			alignment: AlignmentType.CENTER,
			spacing: { before: 4000 },
			children: [
				new TextRun({ text: documentType.name, bold: true, size: 48, font: 'Arial' })
			]
		}),
		new Paragraph({
			alignment: AlignmentType.CENTER,
			spacing: { before: 400 },
			children: [new TextRun({ text: projectName, size: 32, font: 'Arial' })]
		}),
		new Paragraph({
			alignment: AlignmentType.CENTER,
			spacing: { before: 400 },
			children: [
				new TextRun({ text: organizationName, size: 24, font: 'Arial', color: '666666' })
			]
		}),
		new Paragraph({
			alignment: AlignmentType.CENTER,
			spacing: { before: 400 },
			children: [
				new TextRun({
					text: new Date().toLocaleDateString('nl-NL', {
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					}),
					size: 20,
					font: 'Arial',
					color: '999999'
				})
			]
		}),
		new Paragraph({ children: [new PageBreak()] })
	);

	// Add each artifact as a section
	for (const artifact of artifacts) {
		// Section heading
		children.push(
			new Paragraph({
				heading: HeadingLevel.HEADING_1,
				spacing: { before: 400, after: 200 },
				children: [new TextRun({ text: artifact.title, bold: true, font: 'Arial' })]
			})
		);

		// Section content — split by lines, handle markdown-like formatting
		const lines = artifact.content.split('\n');
		for (const line of lines) {
			if (line.startsWith('## ')) {
				children.push(
					new Paragraph({
						heading: HeadingLevel.HEADING_2,
						spacing: { before: 300, after: 100 },
						children: [new TextRun({ text: line.replace('## ', ''), bold: true, font: 'Arial' })]
					})
				);
			} else if (line.startsWith('### ')) {
				children.push(
					new Paragraph({
						heading: HeadingLevel.HEADING_3,
						spacing: { before: 200, after: 100 },
						children: [new TextRun({ text: line.replace('### ', ''), bold: true, font: 'Arial' })]
					})
				);
			} else if (line.startsWith('- ') || line.startsWith('* ')) {
				children.push(
					new Paragraph({
						bullet: { level: 0 },
						children: [new TextRun({ text: line.replace(/^[-*]\s/, ''), font: 'Arial', size: 22 })]
					})
				);
			} else if (line.trim() === '') {
				children.push(new Paragraph({ children: [] }));
			} else {
				children.push(
					new Paragraph({
						spacing: { after: 100 },
						children: [new TextRun({ text: line, font: 'Arial', size: 22 })]
					})
				);
			}
		}
	}

	const doc = new DocxDocument({
		sections: [
			{
				headers: {
					default: new Header({
						children: [
							new Paragraph({
								alignment: AlignmentType.RIGHT,
								children: [
									new TextRun({
										text: `${documentType.name} — ${projectName}`,
										size: 16,
										color: '999999',
										font: 'Arial'
									})
								]
							})
						]
					})
				},
				footers: {
					default: new Footer({
						children: [
							new Paragraph({
								alignment: AlignmentType.CENTER,
								children: [
									new TextRun({
										text: `${organizationName} | Gegenereerd door Tendermanager`,
										size: 16,
										color: '999999',
										font: 'Arial'
									})
								]
							})
						]
					})
				},
				children
			}
		]
	});

	return Buffer.from(await Packer.toBuffer(doc));
}

// =============================================================================
// PDF EXPORT
// =============================================================================

const PDF_MARGIN = 50;
const PDF_LINE_HEIGHT = 16;
const PDF_FONT_SIZE = 11;
const PDF_HEADING_SIZE = 16;
const PDF_TITLE_SIZE = 24;

export async function exportToPdf(params: ExportParams): Promise<Uint8Array> {
	const { documentType, artifacts, projectName, organizationName } = params;

	const pdfDoc = await PDFDocument.create();
	const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	// Title page
	const titlePage = pdfDoc.addPage();
	const { width, height } = titlePage.getSize();

	titlePage.drawText(documentType.name, {
		x: PDF_MARGIN,
		y: height / 2 + 60,
		size: PDF_TITLE_SIZE,
		font: boldFont,
		color: rgb(0.1, 0.1, 0.1)
	});

	titlePage.drawText(projectName, {
		x: PDF_MARGIN,
		y: height / 2 + 20,
		size: 16,
		font,
		color: rgb(0.3, 0.3, 0.3)
	});

	titlePage.drawText(organizationName, {
		x: PDF_MARGIN,
		y: height / 2 - 10,
		size: 12,
		font,
		color: rgb(0.5, 0.5, 0.5)
	});

	const dateStr = new Date().toLocaleDateString('nl-NL', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
	titlePage.drawText(dateStr, {
		x: PDF_MARGIN,
		y: height / 2 - 40,
		size: 10,
		font,
		color: rgb(0.6, 0.6, 0.6)
	});

	// Content pages
	for (const artifact of artifacts) {
		let page = pdfDoc.addPage();
		let yPosition = height - PDF_MARGIN;

		// Section title
		page.drawText(artifact.title, {
			x: PDF_MARGIN,
			y: yPosition,
			size: PDF_HEADING_SIZE,
			font: boldFont,
			color: rgb(0.1, 0.1, 0.1)
		});
		yPosition -= PDF_HEADING_SIZE + 12;

		// Content lines
		const lines = artifact.content.split('\n');
		for (const line of lines) {
			if (yPosition < PDF_MARGIN + 30) {
				page = pdfDoc.addPage();
				yPosition = height - PDF_MARGIN;
			}

			const cleanLine = line.replace(/^#+\s/, '').replace(/^[-*]\s/, '  \u2022 ');
			const isHeading = line.startsWith('#');
			const currentFont = isHeading ? boldFont : font;
			const currentSize = isHeading ? 13 : PDF_FONT_SIZE;

			if (cleanLine.trim()) {
				// Word wrap for long lines
				const maxWidth = width - PDF_MARGIN * 2;
				const words = cleanLine.split(' ');
				let currentLine = '';

				for (const word of words) {
					const testLine = currentLine ? `${currentLine} ${word}` : word;
					const textWidth = currentFont.widthOfTextAtSize(testLine, currentSize);

					if (textWidth > maxWidth && currentLine) {
						page.drawText(currentLine, {
							x: PDF_MARGIN,
							y: yPosition,
							size: currentSize,
							font: currentFont,
							color: rgb(0.15, 0.15, 0.15)
						});
						yPosition -= PDF_LINE_HEIGHT;
						currentLine = word;

						if (yPosition < PDF_MARGIN + 30) {
							page = pdfDoc.addPage();
							yPosition = height - PDF_MARGIN;
						}
					} else {
						currentLine = testLine;
					}
				}

				if (currentLine) {
					page.drawText(currentLine, {
						x: PDF_MARGIN,
						y: yPosition,
						size: currentSize,
						font: currentFont,
						color: rgb(0.15, 0.15, 0.15)
					});
					yPosition -= PDF_LINE_HEIGHT;
				}
			} else {
				yPosition -= PDF_LINE_HEIGHT / 2;
			}
		}
	}

	return pdfDoc.save();
}
