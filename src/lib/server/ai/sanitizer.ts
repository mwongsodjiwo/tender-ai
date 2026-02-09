// Prompt injection sanitizer — detects and neutralizes injection patterns in document text
// Protects the RAG pipeline from adversarial content in uploaded documents

// Known injection patterns (case-insensitive)
const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
	{ pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|context)/i, label: 'ignore-instructions' },
	{ pattern: /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/i, label: 'disregard-instructions' },
	{ pattern: /forget\s+(everything|all|your)\s*(you|instructions?|rules?|prompts?)?/i, label: 'forget-instructions' },
	{ pattern: /you\s+are\s+now\s+(a|an|the|my)\s+/i, label: 'role-override' },
	{ pattern: /act\s+as\s+(a|an|the|my|if)\s+/i, label: 'role-override' },
	{ pattern: /pretend\s+(you\s+are|to\s+be)\s+/i, label: 'role-override' },
	{ pattern: /new\s+instructions?:\s*/i, label: 'new-instructions' },
	{ pattern: /system\s*prompt\s*:/i, label: 'system-prompt' },
	{ pattern: /\[SYSTEM\]/i, label: 'system-tag' },
	{ pattern: /\[INST\]/i, label: 'inst-tag' },
	{ pattern: /<<\s*SYS\s*>>/i, label: 'llama-sys-tag' },
	{ pattern: /<\|im_start\|>/i, label: 'chatml-tag' },
	{ pattern: /\bHuman:\s/i, label: 'anthropic-format' },
	{ pattern: /\bAssistant:\s/i, label: 'anthropic-format' },
	{ pattern: /do\s+not\s+follow\s+(your|the|any)\s+(rules?|instructions?|guidelines?)/i, label: 'rule-override' },
	{ pattern: /override\s+(your|the|all|any)\s+(rules?|instructions?|safety|guidelines?)/i, label: 'rule-override' },
	{ pattern: /bypass\s+(your|the|all|any)\s+(rules?|restrictions?|filters?|safety)/i, label: 'bypass-safety' },
	{ pattern: /jailbreak/i, label: 'jailbreak' },
	{ pattern: /DAN\s*mode/i, label: 'dan-mode' },
	{ pattern: /output\s+(your|the)\s+(system|initial)\s+prompt/i, label: 'prompt-leak' },
	{ pattern: /reveal\s+(your|the)\s+(system|initial)\s+(prompt|instructions?)/i, label: 'prompt-leak' },
	{ pattern: /what\s+(are|is)\s+your\s+(system|initial)\s+(prompt|instructions?)/i, label: 'prompt-leak' }
];

// Marker used to replace detected injections
const REDACTION_MARKER = '[INHOUD VERWIJDERD — VEILIGHEIDSFILTER]';

interface SanitizeResult {
	text: string;
	clean: boolean;
	detections: Detection[];
}

interface Detection {
	label: string;
	match: string;
	position: number;
}

export function sanitizeDocumentText(text: string): SanitizeResult {
	if (!text || text.length === 0) {
		return { text: '', clean: true, detections: [] };
	}

	const detections: Detection[] = [];
	let sanitized = text;

	for (const { pattern, label } of INJECTION_PATTERNS) {
		// Reset regex state for global matching
		const globalPattern = new RegExp(pattern.source, 'gi');
		let match: RegExpExecArray | null;

		while ((match = globalPattern.exec(text)) !== null) {
			detections.push({
				label,
				match: match[0].substring(0, 80),
				position: match.index
			});
		}

		// Replace all occurrences in sanitized text
		sanitized = sanitized.replace(globalPattern, REDACTION_MARKER);
	}

	return {
		text: sanitized,
		clean: detections.length === 0,
		detections
	};
}

export function wrapContextForPrompt(contextText: string, sourceLabel: string): string {
	return `<context source="${escapeXmlAttr(sourceLabel)}">\n${contextText}\n</context>`;
}

function escapeXmlAttr(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
