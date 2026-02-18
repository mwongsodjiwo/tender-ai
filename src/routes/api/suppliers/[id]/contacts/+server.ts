// POST /api/suppliers/:id/contacts — Add contact to supplier

import type { RequestHandler } from './$types';
import { createSupplierContactSchema } from '$server/api/validation';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = createSupplierContactSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	// Verify supplier exists and user has access
	const { data: supplier, error: supplierError } = await supabase
		.from('suppliers')
		.select('id, organization_id')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (supplierError || !supplier) {
		return apiError(404, 'NOT_FOUND', 'Leverancier niet gevonden');
	}

	const { data, error: dbError } = await supabase
		.from('supplier_contacts')
		.insert({ supplier_id: params.id, ...parsed.data })
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await logAudit(supabase, {
		organizationId: supplier.organization_id,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action: 'create',
		entityType: 'supplier_contact',
		entityId: data.id,
		changes: { name: parsed.data.name, supplier_id: params.id }
	});

	return apiSuccess(data, 201);
};
