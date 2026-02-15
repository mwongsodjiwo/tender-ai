// POST /api/projects/:id/export — Export document as Word or PDF

import type { RequestHandler } from './$types';
import { exportDocumentSchema } from '$server/api/validation';
import { exportToDocx, exportToPdf } from '$server/api/export';
import { logAudit } from '$server/db/audit';
import { apiError } from '$server/api/response';

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

	const { document_type_id, format } = parsed.data;

	// Get project
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('name, organization_id, organizations(name)')
		.eq('id', params.id)
		.single();

	if (projectError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	// Get document type
	const { data: documentType, error: dtError } = await supabase
		.from('document_types')
		.select('*')
		.eq('id', document_type_id)
		.single();

	if (dtError || !documentType) {
		return apiError(404, 'NOT_FOUND', 'Documenttype niet gevonden');
	}

	// Get artifacts
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('*')
		.eq('project_id', params.id)
		.eq('document_type_id', document_type_id)
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
	let fileExtension: string;

	try {
		if (format === 'docx') {
			fileBuffer = await exportToDocx(exportParams);
			contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
			fileExtension = 'docx';
		} else {
			fileBuffer = await exportToPdf(exportParams);
			contentType = 'application/pdf';
			fileExtension = 'pdf';
		}
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Export mislukt';
		return apiError(500, 'INTERNAL_ERROR', errorMessage);
	}

	const fileName = `${documentType.slug}-${project.name.toLowerCase().replace(/\s+/g, '-')}.${fileExtension}`;

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
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
};
