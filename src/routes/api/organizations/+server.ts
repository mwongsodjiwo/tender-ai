// GET /api/organizations — List user's organizations
// POST /api/organizations — Create a new organization

import type { RequestHandler } from './$types';
import { createOrganizationSchema } from '$server/api/validation';
import { requireSuperadmin } from '$server/api/guards';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('organizations')
		.select('*')
		.is('deleted_at', null)
		.order('name');

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	const guardResponse = await requireSuperadmin(supabase, user);
	if (guardResponse) return guardResponse;

	const body = await request.json();
	const parsed = createOrganizationSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const {
		name, slug, description,
		kvk_nummer, handelsnaam, rechtsvorm,
		straat, postcode, plaats, sbi_codes, nuts_codes
	} = parsed.data;

	const { data: org, error: orgError } = await supabase
		.from('organizations')
		.insert({
			name, slug, description,
			kvk_nummer, handelsnaam, rechtsvorm,
			straat, postcode, plaats, sbi_codes, nuts_codes
		})
		.select()
		.single();

	if (orgError) {
		if (orgError.code === '23505') {
			return apiError(409, 'DUPLICATE', 'Deze slug is al in gebruik');
		}
		return apiError(500, 'DB_ERROR', orgError.message);
	}

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	// Add creator as owner
	const { error: memberError } = await supabase.from('organization_members').insert({
		organization_id: org.id,
		profile_id: user.id,
		role: 'owner'
	});

	if (memberError) {
		return apiError(500, 'DB_ERROR', memberError.message);
	}

	await logAudit(supabase, {
		organizationId: org.id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'organization',
		entityId: org.id,
		changes: { name, slug }
	});

	return apiSuccess(org, 201);
};
