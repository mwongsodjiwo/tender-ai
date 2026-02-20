// POST /api/templates — Upload document template
// GET /api/templates?organization_id=...&document_type_id=... — List templates

import type { RequestHandler } from './$types';
import { uploadTemplateSchema, listTemplatesSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';
import { logError } from '$server/logger';
import { extractTemplateTags } from '$server/templates/renderer';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const metadata = formData.get('metadata') as string | null;

	if (!file) {
		return apiError(400, 'VALIDATION_ERROR', 'Bestand is verplicht');
	}

	const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
	if (file.type !== DOCX_MIME) {
		return apiError(400, 'VALIDATION_ERROR', 'Alleen .docx bestanden zijn toegestaan');
	}

	const MAX_SIZE = 50 * 1024 * 1024;
	if (file.size > MAX_SIZE) {
		return apiError(400, 'VALIDATION_ERROR', 'Bestand mag maximaal 50 MB zijn');
	}

	let parsed;
	try {
		const body = metadata ? JSON.parse(metadata) : {};
		parsed = uploadTemplateSchema.safeParse(body);
	} catch {
		return apiError(400, 'VALIDATION_ERROR', 'Ongeldige metadata');
	}

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { organization_id, document_type_id, name, description, is_default, category_type } = parsed.data;

	const filePath = `${organization_id}/${document_type_id}/${Date.now()}-${file.name}`;
	const fileBuffer = Buffer.from(await file.arrayBuffer());

	const { error: uploadError } = await supabase.storage
		.from('document-templates')
		.upload(filePath, fileBuffer, { contentType: DOCX_MIME });

	if (uploadError) {
		logError('Template upload failed', uploadError);
		return apiError(500, 'INTERNAL_ERROR', 'Upload mislukt');
	}

	let placeholders: string[] = [];
	try {
		placeholders = extractTemplateTags(fileBuffer);
	} catch {
		// Non-critical: continue without placeholders
	}

	if (is_default) {
		await clearDefaultFlag(supabase, organization_id, document_type_id);
	}

	const { data, error: dbError } = await supabase
		.from('document_templates')
		.insert({
			organization_id,
			document_type_id,
			category_type: category_type ?? null,
			name,
			description: description ?? null,
			file_path: filePath,
			file_size: file.size,
			is_default: is_default ?? false,
			placeholders,
			created_by: user.id
		})
		.select()
		.single();

	if (dbError) {
		logError('Template insert failed', dbError);
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: organization_id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'document_template',
		entityId: data.id,
		changes: { name, document_type_id }
	});

	return apiSuccess(data, 201);
};

export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const params = {
		organization_id: url.searchParams.get('organization_id'),
		document_type_id: url.searchParams.get('document_type_id') ?? undefined
	};

	const parsed = listTemplatesSchema.safeParse(params);
	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	let query = supabase
		.from('document_templates')
		.select('*, document_types(name, slug)')
		.eq('organization_id', parsed.data.organization_id)
		.is('deleted_at', null)
		.order('is_default', { ascending: false })
		.order('name');

	if (parsed.data.document_type_id) {
		query = query.eq('document_type_id', parsed.data.document_type_id);
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data ?? []);
};

async function clearDefaultFlag(
	supabase: Parameters<RequestHandler>[0]['locals']['supabase'],
	organizationId: string,
	documentTypeId: string
): Promise<void> {
	await supabase
		.from('document_templates')
		.update({ is_default: false, updated_at: new Date().toISOString() })
		.eq('organization_id', organizationId)
		.eq('document_type_id', documentTypeId)
		.eq('is_default', true);
}
