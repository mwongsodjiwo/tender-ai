// GET /api/projects/:id/documents — List document types with artifact counts
// POST /api/projects/:id/documents — Assemble a complete document from artifacts

import type { RequestHandler } from './$types';
import { assembleDocumentSchema } from '$server/api/validation';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Get all document types that have artifacts for this project
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('document_type_id, document_type:document_types(id, name, slug, description, sort_order)')
		.eq('project_id', params.id)
		.order('sort_order');

	// Group by document type
	const docTypeMap = new Map<string, { document_type: Record<string, unknown>; artifact_count: number }>();
	for (const artifact of artifacts ?? []) {
		const dtId = artifact.document_type_id;
		if (!docTypeMap.has(dtId)) {
			const dt = artifact.document_type;
			const docType = Array.isArray(dt) ? dt[0] : dt;
			docTypeMap.set(dtId, {
				document_type: docType as Record<string, unknown>,
				artifact_count: 0
			});
		}
		const entry = docTypeMap.get(dtId);
		if (entry) entry.artifact_count++;
	}

	return apiSuccess(Array.from(docTypeMap.values()));
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = assembleDocumentSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { document_type_id } = parsed.data;

	// Get document type
	const { data: documentType, error: dtError } = await supabase
		.from('document_types')
		.select('*')
		.eq('id', document_type_id)
		.single();

	if (dtError || !documentType) {
		return apiError(404, 'NOT_FOUND', 'Documenttype niet gevonden');
	}

	// Get artifacts for this document type in this project
	const { data: artifacts } = await supabase
		.from('artifacts')
		.select('*')
		.eq('project_id', params.id)
		.eq('document_type_id', document_type_id)
		.order('sort_order');

	// Assemble into single document
	const assembledContent = (artifacts ?? [])
		.map((a) => `# ${a.title}\n\n${a.content}`)
		.join('\n\n---\n\n');

	return apiSuccess({
		document_type: documentType,
		artifacts: artifacts ?? [],
		assembled_content: assembledContent
	});
};
