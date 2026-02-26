import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { PlaceholderHighlight } from './PlaceholderHighlight';
import type { Extensions } from '@tiptap/core';

interface EditorConfigOptions {
	placeholder?: string;
	enablePlaceholderHighlights?: boolean;
}

/** Create the standard set of TipTap extensions for the editor */
export function createEditorExtensions(options: EditorConfigOptions = {}): Extensions {
	const extensions: Extensions = [
		StarterKit.configure({
			heading: { levels: [1, 2, 3] },
			bulletList: { keepMarks: true },
			orderedList: { keepMarks: true }
		}),
		Placeholder.configure({
			placeholder: options.placeholder ?? 'Begin hier met schrijven...',
			emptyEditorClass: 'is-editor-empty'
		}),
		Table.configure({
			resizable: true,
			HTMLAttributes: { class: 'tiptap-table' }
		}),
		TableRow,
		TableCell,
		TableHeader,
		TextStyle,
		FontFamily.configure({ types: ['textStyle'] })
	];
	if (options.enablePlaceholderHighlights) {
		extensions.push(PlaceholderHighlight);
	}
	return extensions;
}

/** Convert plain text to HTML paragraphs for TipTap editor consumption */
export function convertPlainTextToHtml(text: string): string {
	const htmlPrefixes = ['<p', '<h', '<ul', '<ol', '<table', '<blockquote', '<div'];
	if (text.startsWith('<') && htmlPrefixes.some((prefix) => text.startsWith(prefix))) {
		return text;
	}
	return text
		.split('\n\n')
		.map((block) => {
			const lines = block.split('\n').join('<br>');
			return `<p>${lines}</p>`;
		})
		.join('');
}
