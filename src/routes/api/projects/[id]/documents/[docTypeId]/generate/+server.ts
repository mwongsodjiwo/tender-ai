// POST /api/projects/:id/documents/:docTypeId/generate — Generate section content with AI

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateLeidraadSectionSchema } from '$server/api/validation';
import { generateSectionContent } from '$server/ai/generation';
import { searchContext, formatContextForPrompt } from '$server/ai/context';
import { logAudit } from '$server/db/audit';
import type { TemplateSection } from '$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = generateLeidraadSectionSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { section_key, instructions } = parsed.data;

	// Load document type with template_structure
	const { data: documentType, error: dtError } = await supabase
		.from('document_types')
		.select('id, name, slug, template_structure')
		.eq('id', params.docTypeId)
		.single();

	if (dtError || !documentType) {
		return json({ message: 'Documenttype niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	// Load project profile (required for generation)
	const { data: projectProfile } = await supabase
		.from('project_profiles')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.maybeSingle();

	if (!projectProfile) {
		return json(
			{ message: 'Projectprofiel ontbreekt. Vul eerst het projectprofiel in.', code: 'PROFILE_REQUIRED', status: 400 },
			{ status: 400 }
		);
	}

	// Load project for org_id
	const { data: project } = await supabase
		.from('projects')
		.select('organization_id, procedure_type, estimated_value, scoring_methodology')
		.eq('id', params.id)
		.single();

	// Load market research data from phase_activities (exploring phase)
	let marketResearchContext = '';
	const { data: marketActivities } = await supabase
		.from('phase_activities')
		.select('activity_type, title, description, metadata')
		.eq('project_id', params.id)
		.eq('phase', 'exploring')
		.is('deleted_at', null);

	if (marketActivities && marketActivities.length > 0) {
		marketResearchContext = marketActivities
			.filter((a) => a.description || (a.metadata && Object.keys(a.metadata).length > 0))
			.map((a) => `### ${a.title}\n${a.description ?? ''}\n${a.metadata?.content ? String(a.metadata.content) : ''}`)
			.join('\n\n');
	}

	// Determine which sections to generate
	const templateSections: TemplateSection[] = documentType.template_structure ?? [];
	const sectionsToGenerate = section_key
		? templateSections.filter((s) => s.key === section_key)
		: templateSections;

	if (sectionsToGenerate.length === 0) {
		return json(
			{ message: 'Geen secties gevonden om te genereren', code: 'NOT_FOUND', status: 404 },
			{ status: 404 }
		);
	}

	// Build project profile object for AI prompt
	const profileForAI = {
		contracting_authority: projectProfile.contracting_authority,
		department: projectProfile.department,
		project_goal: projectProfile.project_goal,
		scope_description: projectProfile.scope_description,
		estimated_value: projectProfile.estimated_value,
		cpv_codes: projectProfile.cpv_codes,
		nuts_codes: projectProfile.nuts_codes,
		timeline_start: projectProfile.timeline_start,
		timeline_end: projectProfile.timeline_end,
		procedure_type: project?.procedure_type,
		scoring_methodology: project?.scoring_methodology
	};

	const generatedSections: {
		section_key: string;
		title: string;
		content: string;
		artifact_id: string;
	}[] = [];

	for (const section of sectionsToGenerate) {
		// Load knowledge base context via searchContext
		let knowledgeBaseContext = '';
		try {
			const contextResults = await searchContext({
				supabase,
				query: `${section.title} ${section.description} aanbestedingsleidraad`,
				projectId: params.id,
				organizationId: project?.organization_id,
				limit: 3
			});
			knowledgeBaseContext = formatContextForPrompt(contextResults);
		} catch {
			// Context search failure should not block generation
		}

		// Generate content with AI
		const result = await generateSectionContent({
			sectionKey: section.key,
			sectionTitle: section.title,
			sectionDescription: section.description,
			projectProfile: profileForAI,
			marketResearchContext: marketResearchContext || undefined,
			knowledgeBaseContext: knowledgeBaseContext || undefined,
			instructions
		});

		// Upsert artifact (create if not exists, update if it does)
		const { data: existingArtifact } = await supabase
			.from('artifacts')
			.select('id, version, content, created_by')
			.eq('project_id', params.id)
			.eq('document_type_id', params.docTypeId)
			.eq('section_key', section.key)
			.maybeSingle();

		let artifactId: string;

		if (existingArtifact) {
			// Save current version before overwriting
			if (existingArtifact.content) {
				await supabase.from('artifact_versions').insert({
					artifact_id: existingArtifact.id,
					version: existingArtifact.version,
					title: section.title,
					content: existingArtifact.content,
					created_by: existingArtifact.created_by
				});
			}

			// Update existing artifact
			await supabase
				.from('artifacts')
				.update({
					content: result.content,
					status: 'generated',
					version: existingArtifact.version + 1
				})
				.eq('id', existingArtifact.id);

			artifactId = existingArtifact.id;
		} else {
			// Create new artifact
			const sectionIndex = templateSections.findIndex((s) => s.key === section.key);
			const { data: newArtifact } = await supabase
				.from('artifacts')
				.insert({
					project_id: params.id,
					document_type_id: params.docTypeId,
					section_key: section.key,
					title: section.title,
					content: result.content,
					status: 'generated',
					sort_order: sectionIndex >= 0 ? sectionIndex : 0,
					metadata: {},
					created_by: user.id
				})
				.select('id')
				.single();

			artifactId = newArtifact?.id ?? '';
		}

		generatedSections.push({
			section_key: section.key,
			title: section.title,
			content: result.content,
			artifact_id: artifactId
		});

		// Audit log per section
		await logAudit(supabase, {
			organizationId: project?.organization_id,
			projectId: params.id,
			actorId: user.id,
			actorEmail: user.email ?? undefined,
			action: 'generate',
			entityType: 'artifact',
			entityId: artifactId,
			changes: {
				section_key: section.key,
				source: 'leidraad_generation',
				token_count: result.tokenCount
			}
		});
	}

	return json({
		data: {
			generated_sections: generatedSections,
			total: generatedSections.length
		}
	});
};
