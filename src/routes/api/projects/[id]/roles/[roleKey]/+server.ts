// PATCH /api/projects/:projectId/roles/:roleKey — Update a document role

import type { RequestHandler } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { updateDocumentRoleSchema } from '$server/api/validation';
import { resolveMemberPersonData } from '$server/db/resolve-member';
import { logAudit } from '$server/db/audit';
import { apiError, apiSuccess } from '$server/api/response';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}

	const body = await request.json();
	const parsed = updateDocumentRoleSchema.safeParse(body);

	if (!parsed.success) {
		return apiError(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
	}

	const payload = await enrichWithMemberData(
		supabase, parsed.data
	);

	const { data, error: dbError } = await supabase
		.from('project_document_roles')
		.update(payload)
		.eq('project_id', params.id)
		.eq('role_key', params.roleKey)
		.select()
		.single();

	if (dbError) {
		return apiError(500, 'DB_ERROR', dbError.message);
	}

	if (!data) {
		return apiError(404, 'NOT_FOUND', 'Documentrol niet gevonden');
	}

	await auditRoleUpdate(supabase, params.id, user, data.id, {
		...parsed.data,
		project_member_id: data.project_member_id
	});

	return apiSuccess(data);
};

/** Auto-fills person_* from member profile when project_member_id is set */
async function enrichWithMemberData(
	supabase: SupabaseClient,
	input: Record<string, unknown>
): Promise<Record<string, unknown>> {
	const memberId = input.project_member_id as string | undefined | null;
	if (!memberId) {
		return input;
	}

	const personData = await resolveMemberPersonData(supabase, memberId);
	if (!personData) {
		return input;
	}

	return { ...input, ...personData };
}

async function auditRoleUpdate(
	supabase: SupabaseClient,
	projectId: string,
	user: { id: string; email?: string },
	entityId: string,
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
		action: 'update',
		entityType: 'document_role',
		entityId,
		changes
	});
}
