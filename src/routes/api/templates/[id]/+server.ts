// GET /api/templates/:id — Download template file
// PATCH /api/templates/:id — Update template metadata
// DELETE /api/templates/:id — Soft delete template

import type { RequestHandler } from './$types';
import { updateTemplateSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';
import { logError } from '$server/logger';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: template, error: dbError } = await supabase
		.from('document_templates')
		.select('*')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError || !template) {
		return apiError(404, 'NOT_FOUND', 'Template niet gevonden');
	}

	const { data: fileData, error: downloadError } = await supabase.storage
		.from('document-templates')
		.download(template.file_path);

	if (downloadError || !fileData) {
		logError('Template download failed', downloadError);
		return apiError(500, 'INTERNAL_ERROR', 'Download mislukt');
	}

	const fileName = template.name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.docx';
	const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

	return new Response(fileData, {
		headers: {
			'Content-Type': DOCX_MIME,
			'Content-Disposition': `attachment; filename="${fileName}"`,
			'Cache-Control': 'no-cache'
		}
	});
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateTemplateSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const existing = await supabase
		.from('document_templates')
		.select('organization_id, document_type_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (existing.error || !existing.data) {
		return apiError(404, 'NOT_FOUND', 'Template niet gevonden');
	}

	if (parsed.data.is_default === true) {
		await clearDefault(supabase, existing.data.organization_id, existing.data.document_type_id);
	}

	const { data, error: dbError } = await supabase
		.from('document_templates')
		.update({ ...parsed.data, updated_at: new Date().toISOString() })
		.eq('id', params.id)
		.is('deleted_at', null)
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: data.organization_id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'document_template',
		entityId: params.id,
		changes: parsed.data
	});

	return apiSuccess(data);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('document_templates')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.id)
		.is('deleted_at', null)
		.select('id, organization_id, name')
		.single();

	if (dbError || !data) {
		return apiError(404, 'NOT_FOUND', 'Template niet gevonden');
	}

	await logAudit(supabase, {
		organizationId: data.organization_id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'delete',
		entityType: 'document_template',
		entityId: params.id,
		changes: { name: data.name }
	});

	return apiSuccess({ deleted: true });
};

async function clearDefault(
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
