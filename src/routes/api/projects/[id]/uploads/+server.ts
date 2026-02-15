// GET /api/projects/:id/uploads — List uploaded documents for a project
// POST /api/projects/:id/uploads — Upload a document to project

import type { RequestHandler } from './$types';
import { uploadDocumentSchema, uploadFileValidation } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { createServiceClient } from '$server/db/client';
import { extractText, isTextExtractable } from '$server/ai/parser';
import { processDocumentChunks } from '$server/ai/rag';
import { validateFileSignature } from '$server/ai/file-validator';
import { sanitizeDocumentText } from '$server/ai/sanitizer';
import { apiError, apiSuccess } from '$server/api/response';

const STORAGE_BUCKET = 'documents';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const category = url.searchParams.get('category') ?? undefined;

	let query = supabase
		.from('documents')
		.select('*')
		.eq('project_id', params.id)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (category) {
		query = query.eq('category', category);
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data ?? []);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file) {
		return apiError(400, 'VALIDATION_ERROR', 'Geen bestand meegegeven');
	}

	// Validate file
	const fileValidation = uploadFileValidation.safeParse({
		size: file.size,
		type: file.type
	});

	if (!fileValidation.success) {
		return apiError(400, 'VALIDATION_ERROR', fileValidation.error.errors[0].message);
	}

	// Validate file signature (magic bytes) matches claimed MIME type
	const signatureCheck = await validateFileSignature(file, file.type);
	if (!signatureCheck.valid) {
		return apiError(400, 'VALIDATION_ERROR', signatureCheck.reason ?? 'Ongeldig bestand');
	}

	// Parse metadata from form
	const metaValidation = uploadDocumentSchema.safeParse({
		organization_id: formData.get('organization_id'),
		project_id: formData.get('project_id') || params.id,
		category: formData.get('category') || 'reference',
		name: formData.get('name') || file.name
	});

	if (!metaValidation.success) {
		return apiError(400, 'VALIDATION_ERROR', metaValidation.error.errors[0].message);
	}

	const meta = metaValidation.data;
	const serviceClient = createServiceClient();

	// Upload file to Supabase Storage
	const fileExt = file.name.split('.').pop() ?? 'bin';
	const filePath = `${meta.organization_id}/${params.id}/${crypto.randomUUID()}.${fileExt}`;

	const { error: uploadError } = await serviceClient.storage
		.from(STORAGE_BUCKET)
		.upload(filePath, file, {
			contentType: file.type,
			upsert: false
		});

	if (uploadError) {
		return apiError(500, 'INTERNAL_ERROR', 'Fout bij uploaden van bestand');
	}

	// Extract text content from PDF, Word, TXT, CSV
	let contentText: string | null = null;
	let injectionDetected = false;
	if (isTextExtractable(file.type)) {
		const rawText = await extractText(file);
		if (rawText) {
			const sanitized = sanitizeDocumentText(rawText);
			contentText = sanitized.text;
			injectionDetected = !sanitized.clean;
			if (injectionDetected) {
				console.warn(
					`Prompt injection detected in upload "${file.name}":`,
					sanitized.detections.map((d) => d.label)
				);
			}
		}
	}

	// Save metadata to documents table
	const { data: document, error: dbError } = await serviceClient
		.from('documents')
		.insert({
			organization_id: meta.organization_id,
			project_id: params.id,
			name: meta.name ?? file.name,
			file_path: filePath,
			file_size: file.size,
			mime_type: file.type,
			category: meta.category,
			content_text: contentText,
			uploaded_by: user.id,
			metadata: {
				original_filename: file.name,
				extension: fileExt,
				text_extracted: contentText !== null,
				text_length: contentText?.length ?? 0,
				injection_detected: injectionDetected
			}
		})
		.select()
		.single();

	if (dbError) {
		// Clean up uploaded file on DB error
		await serviceClient.storage.from(STORAGE_BUCKET).remove([filePath]);
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(serviceClient, {
		organizationId: meta.organization_id,
		projectId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'upload',
		entityType: 'document',
		entityId: document.id,
		changes: {
			name: document.name,
			category: meta.category,
			file_size: file.size,
			mime_type: file.type,
			text_extracted: contentText !== null
		}
	});

	// Trigger chunking + embedding in background (non-blocking)
	if (contentText && contentText.length > 0) {
		processDocumentChunks(serviceClient, document.id, contentText)
			.then((chunkCount) => {
				console.log(`Document ${document.id}: ${chunkCount} chunks created with embeddings`);
			})
			.catch((err) => {
				console.error(`Document ${document.id}: chunking failed:`, err instanceof Error ? err.message : err);
			});
	}

	return apiSuccess(document, 201);
};
