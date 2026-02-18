// GET /api/kvk/[kvkNummer] — Fetch KVK basisprofiel (proxy to KVK API)

import type { RequestHandler } from './$types';
import { kvkNummerParamSchema } from '$server/api/validation';
import { getKvkProfile, KvkApiError } from '$server/api/kvk';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ locals, params }) => {
	const { user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const parsed = kvkNummerParamSchema.safeParse({
		kvkNummer: params.kvkNummer
	});

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	try {
		const profiel = await getKvkProfile(parsed.data.kvkNummer);
		return apiSuccess(profiel);
	} catch (error) {
		if (error instanceof KvkApiError) {
			if (error.statusCode === 404) {
				return apiError(404, 'NOT_FOUND', 'KVK-nummer niet gevonden');
			}
			return apiError(502, 'EXTERNAL_API_ERROR', error.message);
		}
		return apiError(500, 'INTERNAL_ERROR', 'KVK profiel ophalen mislukt');
	}
};
