// GET /api/projects/:id/uploads — List uploaded documents for a project
// POST /api/projects/:id/uploads — Upload a document to project

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadDocumentSchema, uploadFileValidation } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { createServiceClient } from '$server/db/client';
import { extractText, isTextExtractable } from '$server/ai/parser';
import { processDocumentChunks } from '$server/ai/rag';

const STORAGE_BUCKET = 'documents';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
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
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
	}

	return json({ data: data ?? [] });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { user } = locals;

	if (!user) {
		return json({ message: 'Niet ingelogd', code: 'UNAUTHORIZED', status: 401 }, { status: 401 });
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file) {
		return json(
			{ message: 'Geen bestand meegegeven', code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	// Validate file
	const fileValidation = uploadFileValidation.safeParse({
		size: file.size,
		type: file.type
	});

	if (!fileValidation.success) {
		return json(
			{ message: fileValidation.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
	}

	// Parse metadata from form
	const metaValidation = uploadDocumentSchema.safeParse({
		organization_id: formData.get('organization_id'),
		project_id: formData.get('project_id') || params.id,
		category: formData.get('category') || 'reference',
		name: formData.get('name') || file.name
	});

	if (!metaValidation.success) {
		return json(
			{ message: metaValidation.error.errors[0].message, code: 'VALIDATION_ERROR', status: 400 },
			{ status: 400 }
		);
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
		return json(
			{ message: 'Fout bij uploaden van bestand', code: 'UPLOAD_ERROR', status: 500 },
			{ status: 500 }
		);
	}

	// Extract text content from PDF, Word, TXT, CSV
	let contentText: string | null = null;
	if (isTextExtractable(file.type)) {
		contentText = await extractText(file);
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
				text_length: contentText?.length ?? 0
			}
		})
		.select()
		.single();

	if (dbError) {
		// Clean up uploaded file on DB error
		await serviceClient.storage.from(STORAGE_BUCKET).remove([filePath]);
		return json({ message: dbError.message, code: 'DB_ERROR', status: 500 }, { status: 500 });
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

	return json({ data: document }, { status: 201 });
};
