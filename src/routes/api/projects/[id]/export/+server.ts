// POST /api/projects/:id/export — Export document as Word or PDF

import type { RequestHandler } from './$types';
import { exportDocumentSchema } from '$server/api/validation';
import { exportToDocx, exportToPdf } from '$server/api/export';
import { logAudit } from '$server/db/audit';
import { apiError } from '$server/api/response';
import { selectTemplate } from '$server/templates/template-selector';
import { collectTemplateData } from '$server/templates/data-collector';
import { renderTemplate } from '$server/templates/renderer';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = exportDocumentSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { document_type_id, format, template_id } = parsed.data;

	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('name, organization_id, organizations(name)')
		.eq('id', params.id)
		.single();

	if (projectError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	const { data: documentType, error: dtError } = await supabase
		.from('document_types')
		.select('*')
		.eq('id', document_type_id)
		.single();

	if (dtError || !documentType) {
		return apiError(404, 'NOT_FOUND', 'Documenttype niet gevonden');
	}

	// Try template-based export for .docx format
	if (format === 'docx') {
		const templateResult = await resolveTemplate(
			supabase, template_id, project.organization_id, document_type_id
		);

		if (templateResult) {
			return handleTemplateExport(
				supabase, params.id, project, documentType, templateResult, user
			);
		}
	}

	// Fallback: programmatic export
	return handleProgrammaticExport(
		supabase, params.id, project, documentType, format, user
	);
};

async function resolveTemplate(
	supabase: import('@supabase/supabase-js').SupabaseClient,
	templateId: string | undefined,
	organizationId: string,
	documentTypeId: string
): Promise<import('$types/db/document-templates').DocumentTemplate | null> {
	if (templateId) {
		const { data } = await supabase
			.from('document_templates')
			.select('*')
			.eq('id', templateId)
			.is('deleted_at', null)
			.single();
		return data ?? null;
	}

	const { template } = await selectTemplate(supabase, {
		organizationId,
		documentTypeId
	});
	return template;
}

async function handleTemplateExport(
	supabase: import('@supabase/supabase-js').SupabaseClient,
	projectId: string,
	project: { name: string; organization_id: string; organizations: unknown },
	documentType: { name: string; slug: string },
	template: import('$types/db/document-templates').DocumentTemplate,
	user: { id: string; email?: string }
): Promise<Response> {
	const { data: fileData, error: downloadError } = await supabase
		.storage
		.from('document-templates')
		.download(template.file_path);

	if (downloadError || !fileData) {
		return apiError(500, 'INTERNAL_ERROR', 'Template bestand kon niet worden geladen');
	}

	const templateBuffer = Buffer.from(await fileData.arrayBuffer());
	const data = await collectTemplateData(supabase, projectId, template.document_type_id);
	const outputBuffer = renderTemplate(templateBuffer, data as Record<string, unknown>);

	const fileName = buildFileName(documentType.slug, project.name, 'docx');

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId,
		actorId: user.id,
		actorEmail: user.email,
		action: 'export',
		entityType: 'document',
		changes: { format: 'docx', template_id: template.id, document_type: documentType.name }
	});

	return new Response(new Uint8Array(outputBuffer), {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'Content-Disposition': `attachment; filename="${fileName}"`,
			'Cache-Control': 'no-cache'
		}
	});
}

async function handleProgrammaticExport(
	supabase: import('@supabase/supabase-js').SupabaseClient,
	projectId: string,
	project: { name: string; organization_id: string; organizations: unknown },
	documentType: { name: string; slug: string },
	format: 'docx' | 'pdf',
	user: { id: string; email?: string }
): Promise<Response> {
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('*')
		.eq('project_id', projectId)
		.eq('document_type_id', documentType.slug)
		.order('sort_order');

	if (!artifacts || artifacts.length === 0) {
		return apiError(400, 'VALIDATION_ERROR', 'Geen secties gevonden voor dit documenttype');
	}

	const rawOrg = project.organizations;
	const orgData = (Array.isArray(rawOrg) ? rawOrg[0] : rawOrg) as { name: string } | null;
	const exportParams = {
		documentType,
		artifacts,
		projectName: project.name,
		organizationName: orgData?.name ?? 'Onbekende organisatie'
	};

	let fileBuffer: Buffer | Uint8Array;
	let contentType: string;

	try {
		if (format === 'docx') {
			fileBuffer = await exportToDocx(exportParams);
			contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
		} else {
			fileBuffer = await exportToPdf(exportParams);
			contentType = 'application/pdf';
		}
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Export mislukt';
		return apiError(500, 'INTERNAL_ERROR', errorMessage);
	}

	const fileName = buildFileName(documentType.slug, project.name, format);

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId,
		actorId: user.id,
		actorEmail: user.email,
		action: 'export',
		entityType: 'document',
		changes: { format, document_type: documentType.name }
	});

	return new Response(new Uint8Array(fileBuffer), {
		headers: {
			'Content-Type': contentType,
			'Content-Disposition': `attachment; filename="${fileName}"`,
			'Cache-Control': 'no-cache'
		}
	});
}

function buildFileName(slug: string, projectName: string, ext: string): string {
	return `${slug}-${projectName.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
}
