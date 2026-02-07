// POST /api/projects/:id/export — Export document as Word or PDF

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exportDocumentSchema } from '$server/api/validation';
import { exportToDocx, exportToPdf } from '$server/api/export';
import { logAudit } from '$server/db/audit';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const body = await request.json();
	const parsed = exportDocumentSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ message: parsed.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	const { document_type_id, format } = parsed.data;

	// Get project
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('name, organization_id, organizations(name)')
		.eq('id', params.id)
		.single();

	if (projectError || !project) {
		return json({ message: 'Project niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	// Get document type
	const { data: documentType, error: dtError } = await supabase
		.from('document_types')
		.select('*')
		.eq('id', document_type_id)
		.single();

	if (dtError || !documentType) {
		return json({ message: 'Documenttype niet gevonden', code: 'NOT_FOUND', status: 404 }, { status: 404 });
	}

	// Get artifacts
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('*')
		.eq('project_id', params.id)
		.eq('document_type_id', document_type_id)
		.order('sort_order');

	if (!artifacts || artifacts.length === 0) {
		return json(
			{ message: 'Geen secties gevonden voor dit documenttype', code: 'NO_CONTENT', status: 400 },
			{ status: 400 }
		);
	}

	const orgData = project.organizations as { name: string } | null;
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
		return json({ message: errorMessage, code: 'EXPORT_ERROR', status: 500 }, { status: 500 });
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

	return new Response(fileBuffer, {
		headers: {
			'Content-Type': contentType,
			'Content-Disposition': `attachment; filename="${fileName}"`,
			'Cache-Control': 'no-cache'
		}
	});
};
