// POST /api/projects/:id/export/template — Export document using docxtemplater

import type { RequestHandler } from './$types';
import { z } from 'zod';
import { renderTemplate } from '$server/templates/renderer.js';
import { collectTemplateData } from '$server/templates/data-collector.js';
import { logAudit } from '$server/db/audit.js';
import { apiError } from '$server/api/response.js';
import { logError } from '$server/logger.js';

const exportTemplateSchema = z.object({
	document_type_id: z.string().uuid('Ongeldig documenttype-ID'),
	template_buffer_base64: z.string().min(1, 'Template is verplicht')
});

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = exportTemplateSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { document_type_id, template_buffer_base64 } = parsed.data;

	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('name, organization_id')
		.eq('id', params.id)
		.single();

	if (projectError || !project) {
		return apiError(404, 'NOT_FOUND', 'Project niet gevonden');
	}

	const { data: documentType, error: dtError } = await supabase
		.from('document_types')
		.select('slug, name')
		.eq('id', document_type_id)
		.single();

	if (dtError || !documentType) {
		return apiError(404, 'NOT_FOUND', 'Documenttype niet gevonden');
	}

	let templateBuffer: Buffer;
	try {
		templateBuffer = Buffer.from(template_buffer_base64, 'base64');
	} catch {
		return apiError(400, 'VALIDATION_ERROR', 'Ongeldig template formaat');
	}

	const templateData = await collectTemplateData(
		supabase,
		params.id,
		document_type_id
	);

	let outputBuffer: Buffer;
	try {
		outputBuffer = renderTemplate(templateBuffer, templateData);
	} catch (err) {
		logError('Template rendering failed', err);
		const msg = err instanceof Error ? err.message : 'Rendering mislukt';
		return apiError(500, 'INTERNAL_ERROR', msg);
	}

	const slug = documentType.slug ?? 'document';
	const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
	const fileName = `${slug}-${projectSlug}.docx`;

	await logAudit(supabase, {
		organizationId: project.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'export',
		entityType: 'document',
		changes: { format: 'docx', method: 'template', document_type: documentType.name }
	});

	return new Response(new Uint8Array(outputBuffer), {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'Content-Disposition': `attachment; filename="${fileName}"`,
			'Cache-Control': 'no-cache'
		}
	});
};
