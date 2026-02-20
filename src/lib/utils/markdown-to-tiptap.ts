import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

/**
 * Converts markdown text to TipTap-compatible HTML.
 * Used when AI-generated markdown needs to be stored
 * as HTML for the TipTap editor.
 */
export async function markdownToTiptapHtml(
	markdown: string
): Promise<string> {
	if (!markdown || markdown.trim().length === 0) {
		return '';
	}

	const result = await unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypeStringify)
		.process(markdown);

	return String(result);
}
