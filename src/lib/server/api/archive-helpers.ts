// Shared helpers for archive/unarchive API endpoints — Fase 39

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { logAudit } from '$server/db/audit';
import { apiError } from '$server/api/response';
import type { ArchiveStatus } from '$types';

interface ProjectResult {
	id: string;
	organization_id: string;
}

export function requireAuth(user: User | null): Response | null {
	if (!user) {
		return apiError(401, 'UNAUTHORIZED', 'Niet ingelogd');
	}
	return null;
}

export async function getProject(
	supabase: SupabaseClient,
	projectId: string
): Promise<{ project: ProjectResult | null; error: Response | null }> {
	const { data, error } = await supabase
		.from('projects')
		.select('id, organization_id')
		.eq('id', projectId)
		.is('deleted_at', null)
		.single();

	if (error || !data) {
		return { project: null, error: apiError(404, 'NOT_FOUND', 'Project niet gevonden') };
	}
	return { project: data, error: null };
}

export async function updateArtifactsArchiveStatus(
	supabase: SupabaseClient,
	projectId: string,
	docTypeId: string,
	status: ArchiveStatus
) {
	return supabase
		.from('artifacts')
		.update({ archive_status: status })
		.eq('project_id', projectId)
		.eq('document_type_id', docTypeId)
		.is('deleted_at', null)
		.select('id');
}

export async function updateCorrespondenceArchiveStatus(
	supabase: SupabaseClient,
	letterId: string,
	projectId: string,
	status: ArchiveStatus
) {
	return supabase
		.from('correspondence')
		.update({ archive_status: status })
		.eq('id', letterId)
		.eq('project_id', projectId)
		.is('deleted_at', null)
		.select()
		.single();
}

export async function logArchiveAudit(
	supabase: SupabaseClient,
	opts: {
		project: ProjectResult;
		user: User;
		action: 'archive' | 'unarchive';
		entityType: string;
		entityId: string;
		newStatus: ArchiveStatus;
		affectedCount?: number;
	}
): Promise<void> {
	const changes: Record<string, unknown> = {
		archive_status: opts.newStatus
	};
	if (opts.affectedCount !== undefined) {
		changes.affected_count = opts.affectedCount;
	}
	await logAudit(supabase, {
		organizationId: opts.project.organization_id,
		projectId: opts.project.id,
		actorId: opts.user.id,
		actorEmail: opts.user.email ?? undefined,
		action: opts.action,
		entityType: opts.entityType,
		entityId: opts.entityId,
		changes
	});
}
