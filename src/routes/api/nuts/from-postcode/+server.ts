// GET /api/nuts/from-postcode — Resolve Dutch postcode to NUTS hierarchy

import type { RequestHandler } from './$types';
import { apiError, apiSuccess } from '$server/api/response';
import { getNutsFromPostcode } from '$lib/utils/postcode-to-nuts';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const postcode = url.searchParams.get('postcode');
	if (!postcode || postcode.length < 4) {
		return apiError(
			400,
			'VALIDATION_ERROR',
			'Postcode is verplicht (minimaal 4 tekens)'
		);
	}

	const hierarchy = await getNutsFromPostcode(supabase, postcode);

	if (!hierarchy) {
		return apiSuccess({ hierarchy: null, codes: [] });
	}

	const codes = [
		hierarchy.nuts0,
		hierarchy.nuts1,
		hierarchy.nuts2,
		hierarchy.nuts3
	]
		.filter(Boolean)
		.map((n) => n!.code);

	return apiSuccess({ hierarchy, codes });
};
