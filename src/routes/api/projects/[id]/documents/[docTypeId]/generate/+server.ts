// POST /api/projects/:id/documents/:docTypeId/generate — Generate section content with AI

import type { RequestHandler } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { generateLeidraadSectionSchema } from '$server/api/validation';
import { generateSectionContent } from '$server/ai/generation';
import { searchContext, formatContextForPrompt } from '$server/ai/context';
import { logAudit } from '$server/db/audit';
import type { TemplateSection } from '$types';
import { apiError, apiSuccess } from '$server/api/response';

interface GenerationContext {
	supabase: SupabaseClient;
	projectId: string;
	docTypeId: string;
	userId: string;
	userEmail: string | undefined;
	organizationId: string | undefined;
	profileForAI: Record<string, unknown>;
	marketResearchContext: string;
	templateSections: TemplateSection[];
	instructions?: string;
}

async function loadDocumentType(supabase: SupabaseClient, docTypeId: string) {
	return supabase
		.from('document_types')
		.select('id, name, slug, template_structure')
		.eq('id', docTypeId)
		.single();
}

async function loadProjectProfile(supabase: SupabaseClient, projectId: string) {
	return supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', projectId)
		.is('deleted_at', null)
		.maybeSingle();
}

async function loadProjectDetails(supabase: SupabaseClient, projectId: string) {
	return supabase
		.from('projects')
		.select('organization_id, procedure_type, estimated_value, scoring_methodology')
		.eq('id', projectId)
		.single();
}

async function loadMarketResearch(supabase: SupabaseClient, projectId: string): Promise<string> {
	const { data: activities } = await supabase
		.from('phase_activities')
		.select('activity_type, title, description, metadata')
		.eq('project_id', projectId)
		.eq('phase', 'exploring')
		.is('deleted_at', null);
	if (!activities?.length) return '';
	return activities
		.filter((a) => a.description || (a.metadata && Object.keys(a.metadata).length > 0))
		.map((a) => `### ${a.title}\n${a.description ?? ''}\n${a.metadata?.content ? String(a.metadata.content) : ''}`)
		.join('\n\n');
}

function buildProfileForAI(
	profile: Record<string, unknown>,
	project: { procedure_type: string; scoring_methodology: string } | null
) {
	return {
		contracting_authority: profile.contracting_authority,
		department: profile.department,
		project_goal: profile.project_goal,
		scope_description: profile.scope_description,
		estimated_value: profile.estimated_value,
		cpv_codes: profile.cpv_codes,
		nuts_codes: profile.nuts_codes,
		timeline_start: profile.timeline_start,
		timeline_end: profile.timeline_end,
		procedure_type: project?.procedure_type,
		scoring_methodology: project?.scoring_methodology
	};
}

async function loadKnowledgeContext(
	supabase: SupabaseClient,
	section: TemplateSection,
	projectId: string,
	organizationId: string | undefined
): Promise<string> {
	try {
		const results = await searchContext({
			supabase,
			query: `${section.title} ${section.description} aanbestedingsleidraad`,
			projectId,
			organizationId,
			limit: 3
		});
		return formatContextForPrompt(results);
	} catch {
		return '';
	}
}

async function updateExistingArtifact(
	supabase: SupabaseClient,
	existing: { id: string; version: number; content: string | null; created_by: string },
	section: TemplateSection,
	content: string
): Promise<string> {
	if (existing.content) {
		await supabase.from('artifact_versions').insert({
			artifact_id: existing.id,
			version: existing.version,
			title: section.title,
			content: existing.content,
			created_by: existing.created_by
		});
	}
	await supabase
		.from('artifacts')
		.update({ content, status: 'generated', version: existing.version + 1 })
		.eq('id', existing.id);
	return existing.id;
}

async function createNewArtifact(
	supabase: SupabaseClient,
	section: TemplateSection,
	content: string,
	projectId: string,
	docTypeId: string,
	userId: string,
	templateSections: TemplateSection[]
): Promise<string> {
	const sectionIndex = templateSections.findIndex((s) => s.key === section.key);
	const { data } = await supabase
		.from('artifacts')
		.insert({
			project_id: projectId,
			document_type_id: docTypeId,
			section_key: section.key,
			title: section.title,
			content,
			status: 'generated',
			sort_order: sectionIndex >= 0 ? sectionIndex : 0,
			metadata: {},
			created_by: userId
		})
		.select('id')
		.single();
	return data?.id ?? '';
}

async function upsertArtifact(
	supabase: SupabaseClient,
	section: TemplateSection,
	content: string,
	ctx: GenerationContext
): Promise<string> {
	const { data: existing } = await supabase
		.from('artifacts')
		.select('id, version, content, created_by')
		.eq('project_id', ctx.projectId)
		.eq('document_type_id', ctx.docTypeId)
		.eq('section_key', section.key)
		.maybeSingle();
	if (existing) {
		return updateExistingArtifact(supabase, existing, section, content);
	}
	return createNewArtifact(supabase, section, content, ctx.projectId, ctx.docTypeId, ctx.userId, ctx.templateSections);
}

async function processSection(ctx: GenerationContext, section: TemplateSection) {
	const kbContext = await loadKnowledgeContext(ctx.supabase, section, ctx.projectId, ctx.organizationId);
	const result = await generateSectionContent({
		sectionKey: section.key,
		sectionTitle: section.title,
		sectionDescription: section.description,
		projectProfile: ctx.profileForAI,
		marketResearchContext: ctx.marketResearchContext || undefined,
		knowledgeBaseContext: kbContext || undefined,
		instructions: ctx.instructions
	});
	const artifactId = await upsertArtifact(ctx.supabase, section, result.content, ctx);
	await logAudit(ctx.supabase, {
		organizationId: ctx.organizationId, projectId: ctx.projectId,
		actorId: ctx.userId, actorEmail: ctx.userEmail,
		action: 'generate', entityType: 'artifact', entityId: artifactId,
		changes: { section_key: section.key, source: 'leidraad_generation', token_count: result.tokenCount }
	});
	return { section_key: section.key, title: section.title, content: result.content, artifact_id: artifactId };
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;
	if (!user) return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');

	const parsed = generateLeidraadSectionSchema.safeParse(await request.json());
	if (!parsed.success) return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);

	const { data: docType, error: dtErr } = await loadDocumentType(supabase, params.docTypeId);
	if (dtErr || !docType) return apiError(404, 'NOT_FOUND', 'Documenttype niet gevonden');

	const { data: profile } = await loadProjectProfile(supabase, params.id);
	if (!profile) return apiError(400, 'VALIDATION_ERROR', 'Projectprofiel ontbreekt. Vul eerst het projectprofiel in.');

	const { data: project } = await loadProjectDetails(supabase, params.id);
	const templateSections: TemplateSection[] = docType.template_structure ?? [];
	const sections = parsed.data.section_key ? templateSections.filter((s) => s.key === parsed.data.section_key) : templateSections;
	if (!sections.length) return apiError(404, 'NOT_FOUND', 'Geen secties gevonden om te genereren');

	const ctx: GenerationContext = {
		supabase, projectId: params.id, docTypeId: params.docTypeId, userId: user.id,
		userEmail: user.email ?? undefined, organizationId: project?.organization_id,
		profileForAI: buildProfileForAI(profile, project),
		marketResearchContext: await loadMarketResearch(supabase, params.id),
		templateSections, instructions: parsed.data.instructions
	};

	const generated = [];
	for (const section of sections) {
		generated.push(await processSection(ctx, section));
	}
	return apiSuccess({ generated_sections: generated, total: generated.length });
};
