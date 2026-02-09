// AI service for market research (marktverkenning) — Sprint R5

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProjectProfile } from '$types';
import { chat } from './client.js';
import {
	DESKRESEARCH_SUMMARY_PROMPT,
	RFI_GENERATION_PROMPT,
	MARKET_REPORT_PROMPT,
	MARKET_RESEARCH_PROMPTS
} from './market-research-prompts.js';

// Re-export for convenience
export { MARKET_RESEARCH_PROMPTS };

// =============================================================================
// DESKRESEARCH
// =============================================================================

export interface DeskresearchResultItem {
	id: string;
	title: string;
	contracting_authority: string | null;
	cpv_codes: string[];
	estimated_value: number | null;
	currency: string | null;
	publication_date: string | null;
	snippet: string;
	relevance: number;
}

export async function deskresearch(
	supabase: SupabaseClient,
	projectProfile: ProjectProfile
): Promise<{ results: DeskresearchResultItem[]; total: number; ai_summary: string }> {
	const cpvCodes = projectProfile.cpv_codes ?? [];
	const scopeTerms = projectProfile.scope_description ?? projectProfile.project_goal ?? '';

	// Search knowledge_base.tenders by CPV codes and/or scope terms
	let tenderQuery = supabase
		.schema('knowledge_base')
		.from('tenders')
		.select('id, title, description, contracting_authority, cpv_codes, estimated_value, currency, publication_date')
		.limit(20);

	if (cpvCodes.length > 0) {
		tenderQuery = tenderQuery.overlaps('cpv_codes', cpvCodes);
	}

	const { data: tenders, error: tenderError } = await tenderQuery;

	if (tenderError) {
		throw new Error(`Deskresearch query failed: ${tenderError.message}`);
	}

	// If CPV search yields few results and we have scope terms, also search by text
	let textTenders: typeof tenders = [];
	if ((tenders ?? []).length < 5 && scopeTerms.length > 3) {
		const searchTerm = scopeTerms.split(/\s+/).slice(0, 5).join(' ');
		const { data: textResults } = await supabase
			.schema('knowledge_base')
			.from('tenders')
			.select('id, title, description, contracting_authority, cpv_codes, estimated_value, currency, publication_date')
			.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
			.limit(10);
		textTenders = textResults ?? [];
	}

	// Deduplicate and combine
	const seenIds = new Set((tenders ?? []).map((t) => t.id));
	const allTenders = [
		...(tenders ?? []).map((t) => ({ ...t, relevance: 1.0 })),
		...(textTenders ?? [])
			.filter((t) => !seenIds.has(t.id))
			.map((t) => ({ ...t, relevance: 0.7 }))
	];

	const results: DeskresearchResultItem[] = allTenders.map((t) => ({
		id: t.id,
		title: t.title ?? 'Onbekende titel',
		contracting_authority: t.contracting_authority,
		cpv_codes: t.cpv_codes ?? [],
		estimated_value: t.estimated_value,
		currency: t.currency,
		publication_date: t.publication_date,
		snippet: (t.description ?? t.title ?? '').substring(0, 200),
		relevance: t.relevance
	}));

	// Generate AI summary of results
	let ai_summary = '';
	if (results.length > 0) {
		const summaryInput = results.slice(0, 15).map((r) =>
			`- ${r.title} (${r.contracting_authority ?? 'onbekend'}, waarde: ${r.estimated_value ? `EUR ${r.estimated_value.toLocaleString('nl-NL')}` : 'onbekend'}, CPV: ${r.cpv_codes.join(', ') || 'n.v.t.'})`
		).join('\n');

		const { content } = await chat({
			messages: [{ role: 'user', content: `Analyseer deze vergelijkbare aanbestedingen en geef een samenvatting:\n\n${summaryInput}` }],
			systemPrompt: DESKRESEARCH_SUMMARY_PROMPT,
			temperature: 0.4,
			maxTokens: 2048
		});
		ai_summary = content;
	}

	return { results, total: results.length, ai_summary };
}

// =============================================================================
// RFI GENERATION
// =============================================================================

export async function generateRfi(
	projectProfile: ProjectProfile,
	additionalContext?: string
): Promise<{ content: string; questions: string[] }> {
	const profileContext = [
		`**Projectdoel:** ${projectProfile.project_goal || '[NOG IN TE VULLEN]'}`,
		`**Scope:** ${projectProfile.scope_description || '[NOG IN TE VULLEN]'}`,
		`**Opdrachtgever:** ${projectProfile.contracting_authority || '[NOG IN TE VULLEN]'}`,
		`**Geschatte waarde:** ${projectProfile.estimated_value ? `EUR ${projectProfile.estimated_value.toLocaleString('nl-NL')}` : '[NOG IN TE VULLEN]'}`,
		`**CPV-codes:** ${(projectProfile.cpv_codes ?? []).join(', ') || '[NOG IN TE VULLEN]'}`,
		`**Planning:** ${projectProfile.timeline_start ?? '?'} tot ${projectProfile.timeline_end ?? '?'}`
	].join('\n');

	const userMessage = additionalContext
		? `Projectprofiel:\n${profileContext}\n\nAanvullende context:\n${additionalContext}`
		: `Projectprofiel:\n${profileContext}`;

	const { content } = await chat({
		messages: [{ role: 'user', content: userMessage }],
		systemPrompt: RFI_GENERATION_PROMPT,
		temperature: 0.5,
		maxTokens: 4096
	});

	// Extract questions from JSON block at the end
	let questions: string[] = [];
	const jsonMatch = content.match(/```json\s*\n?\{[\s\S]*?"questions"\s*:\s*\[([\s\S]*?)\]\s*\}[\s\S]*?```/);
	if (jsonMatch) {
		try {
			const parsed = JSON.parse(`{"questions":[${jsonMatch[1]}]}`);
			questions = parsed.questions;
		} catch {
			// If parsing fails, extract questions by looking for numbered lines
			questions = content
				.split('\n')
				.filter((line) => /^\d+\.\s/.test(line.trim()))
				.map((line) => line.trim().replace(/^\d+\.\s*/, ''));
		}
	}

	return { content, questions };
}

// =============================================================================
// MARKET REPORT GENERATION
// =============================================================================

export async function generateMarketReport(
	supabase: SupabaseClient,
	projectId: string,
	projectProfile: ProjectProfile,
	additionalContext?: string
): Promise<{ content: string }> {
	// Gather all available market research data from phase_activities metadata
	const { data: activities } = await supabase
		.from('phase_activities')
		.select('activity_type, title, metadata')
		.eq('project_id', projectId)
		.eq('phase', 'exploring')
		.is('deleted_at', null);

	const activityData = (activities ?? []) as { activity_type: string; title: string; metadata: Record<string, unknown> }[];

	// Build context from saved market research content
	const sections: string[] = [];

	const profileContext = [
		`**Projectdoel:** ${projectProfile.project_goal || '[NOG IN TE VULLEN]'}`,
		`**Scope:** ${projectProfile.scope_description || '[NOG IN TE VULLEN]'}`,
		`**Opdrachtgever:** ${projectProfile.contracting_authority || '[NOG IN TE VULLEN]'}`,
		`**Geschatte waarde:** ${projectProfile.estimated_value ? `EUR ${projectProfile.estimated_value.toLocaleString('nl-NL')}` : '[NOG IN TE VULLEN]'}`,
		`**CPV-codes:** ${(projectProfile.cpv_codes ?? []).join(', ') || '[NOG IN TE VULLEN]'}`
	].join('\n');
	sections.push(`## Projectprofiel\n${profileContext}`);

	for (const activity of activityData) {
		const content = (activity.metadata?.content as string) ?? '';
		if (content) {
			sections.push(`## ${activity.title}\n${content.substring(0, 3000)}`);
		}
	}

	if (additionalContext) {
		sections.push(`## Aanvullende context\n${additionalContext}`);
	}

	const userMessage = sections.join('\n\n---\n\n');

	const { content } = await chat({
		messages: [{ role: 'user', content: userMessage }],
		systemPrompt: MARKET_REPORT_PROMPT,
		temperature: 0.5,
		maxTokens: 4096
	});

	return { content };
}
