import type { RequestHandler } from './$types';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
	'image/png',
	'image/jpeg',
	'image/svg+xml',
	'image/webp'
]);
const BUCKET = 'organization-logos';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const formData = await request.formData();
	const file = formData.get('logo') as File | null;

	if (!file || !(file instanceof File)) {
		return apiError(400, 'VALIDATION_ERROR', 'Geen bestand gevonden.');
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		return apiError(400, 'VALIDATION_ERROR', 'Alleen PNG, JPG, SVG of WebP bestanden zijn toegestaan.');
	}

	if (file.size > MAX_SIZE) {
		return apiError(400, 'VALIDATION_ERROR', 'Bestand mag maximaal 2 MB zijn.');
	}

	const extension = file.name.split('.').pop() ?? 'png';
	const filePath = `${params.id}/logo.${extension}`;

	const { error: uploadError } = await supabase.storage
		.from(BUCKET)
		.upload(filePath, file, {
			upsert: true,
			contentType: file.type
		});

	if (uploadError) {
		return apiError(500, 'DB_ERROR', `Upload mislukt: ${uploadError.message}`);
	}

	const { data: urlData } = supabase.storage
		.from(BUCKET)
		.getPublicUrl(filePath);

	const logoUrl = urlData.publicUrl;

	const { error: dbError } = await supabase
		.from('organizations')
		.update({ logo_url: logoUrl })
		.eq('id', params.id);

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: params.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'update',
		entityType: 'organization',
		entityId: params.id,
		changes: { logo_url: logoUrl }
	});

	return apiSuccess({ logo_url: logoUrl });
};
