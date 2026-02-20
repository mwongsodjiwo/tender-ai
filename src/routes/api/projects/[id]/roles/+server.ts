// GET /api/projects/:projectId/roles — List document roles
// POST /api/projects/:projectId/roles — Assign/create a document role

import type { RequestHandler } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createDocumentRoleSchema } from '$server/api/validation';
import { resolveMemberPersonData } from '$server/db/resolve-member';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const { data, error: dbError } = await supabase
		.from('project_document_roles')
		.select('*')
		.eq('project_id', params.id)
		.order('role_key');

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	return apiSuccess(data);
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = createDocumentRoleSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const payload = await enrichWithMemberData(
		supabase, parsed.data
	);

	const { data, error: dbError } = await supabase
		.from('project_document_roles')
		.upsert(
			{ project_id: params.id, ...payload },
			{ onConflict: 'project_id,role_key' }
		)
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	await auditRoleChange(supabase, params.id, user, data.id, 'create', {
		role_key: parsed.data.role_key,
		person_name: data.person_name,
		project_member_id: data.project_member_id
	});

	return apiSuccess(data, 201);
};

/** Auto-fills person_* from member profile when project_member_id is set */
async function enrichWithMemberData(
	supabase: SupabaseClient,
	input: Record<string, unknown>
): Promise<Record<string, unknown>> {
	const memberId = input.project_member_id as string | undefined;
	if (!memberId) {
		return input;
	}

	const personData = await resolveMemberPersonData(supabase, memberId);
	if (!personData) {
		return input;
	}

	return { ...input, ...personData };
}

async function auditRoleChange(
	supabase: SupabaseClient,
	projectId: string,
	user: { id: string; email?: string },
	entityId: string,
	action: 'create' | 'update',
	changes: Record<string, unknown>
): Promise<void> {
	const { data: project } = await supabase
		.from('projects')
		.select('organization_id')
		.eq('id', projectId)
		.single();

	await logAudit(supabase, {
		organizationId: project?.organization_id,
		projectId,
		actorId: user.id,
		actorEmail: user.email ?? undefined,
		action,
		entityType: 'document_role',
		entityId,
		changes
	});
}
