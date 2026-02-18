// GET /api/kvk/search — Search KVK register (proxy to KVK Zoeken API)

import type { RequestHandler } from './$types';
import { kvkSearchQuerySchema } from '$server/api/validation';
import { searchKvk, KvkApiError } from '$server/api/kvk';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const parsed = kvkSearchQuerySchema.safeParse({
		naam: url.searchParams.get('naam') ?? undefined,
		kvkNummer: url.searchParams.get('kvkNummer') ?? undefined,
		plaats: url.searchParams.get('plaats') ?? undefined,
		type: url.searchParams.get('type') ?? undefined,
		resultatenPerPagina: url.searchParams.get('resultatenPerPagina') ?? undefined,
		pagina: url.searchParams.get('pagina') ?? undefined
	});

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	if (!parsed.data.naam && !parsed.data.kvkNummer) {
		return apiError(
			400,
			'VALIDATION_ERROR',
			'Geef ten minste een naam of KVK-nummer op'
		);
	}

	try {
		const resultaten = await searchKvk(parsed.data);
		return apiSuccess({ resultaten });
	} catch (error) {
		if (error instanceof KvkApiError) {
			return apiError(502, 'EXTERNAL_API_ERROR', error.message);
		}
		return apiError(500, 'INTERNAL_ERROR', 'KVK zoeken mislukt');
	}
};
