// GET /api/suppliers — List suppliers for organization
// POST /api/suppliers — Create a new supplier

import type { RequestHandler } from './$types';
import { createSupplierSchema, supplierSearchQuerySchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const parsed = supplierSearchQuerySchema.safeParse({
		search: url.searchParams.get('search') ?? undefined,
		tag: url.searchParams.get('tag') ?? undefined,
		limit: url.searchParams.get('limit') ?? undefined,
		offset: url.searchParams.get('offset') ?? undefined
	});

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const orgId = url.searchParams.get('organization_id');
	if (!orgId) {
		return apiError(400, 'VALIDATION_ERROR', 'organization_id is verplicht');
	}

	let query = supabase
		.from('suppliers')
		.select('*')
		.eq('organization_id', orgId)
		.is('deleted_at', null)
		.order('company_name')
		.range(parsed.data.offset, parsed.data.offset + parsed.data.limit - 1);

	if (parsed.data.search) {
		query = query.ilike('company_name', `%${parsed.data.search}%`);
	}

	if (parsed.data.tag) {
		query = query.contains('tags', [parsed.data.tag]);
	}

	const { data, error: dbError } = await query;

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = createSupplierSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { data, error: dbError } = await supabase
		.from('suppliers')
		.insert(parsed.data)
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: parsed.data.organization_id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'supplier',
		entityId: data.id,
		changes: { company_name: parsed.data.company_name }
	});

	return apiSuccess(data, 201);
};
