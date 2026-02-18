// GET /api/suppliers/:id — Supplier detail with contacts
// PATCH /api/suppliers/:id — Update supplier
// DELETE /api/suppliers/:id — Soft delete supplier

import type { RequestHandler } from './$types';
import { updateSupplierSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data: supplier, error: dbError } = await supabase
		.from('suppliers')
		.select('*')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (dbError) {
		return apiError(404, 'NOT_FOUND', 'Leverancier niet gevonden');
	}

	const { data: contacts } = await supabase
		.from('supplier_contacts')
		.select('*')
		.eq('supplier_id', params.id)
		.order('is_primary', { ascending: false });

	return apiSuccess({ ...supplier, contacts: contacts ?? [] });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateSupplierSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const { data, error: dbError } = await supabase
		.from('suppliers')
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
		entityType: 'supplier',
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
		.from('suppliers')
		.update({ deleted_at: new Date().toISOString() })
		.eq('id', params.id)
		.is('deleted_at', null)
		.select('id, organization_id')
		.single();

	if (dbError) {
		return apiError(404, 'NOT_FOUND', 'Leverancier niet gevonden');
	}

	await logAudit(supabase, {
		organizationId: data.organization_id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'delete',
		entityType: 'supplier',
		entityId: params.id
	});

	return apiSuccess({ deleted: true });
};
