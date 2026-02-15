// Audit logging helper

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditAction } from '$types';
import { logError } from '$server/logger';

interface AuditParams {
	organizationId?: string;
	projectId?: string;
	actorId?: string;
	actorEmail?: string;
	action: AuditAction;
	entityType: string;
	entityId?: string;
	changes?: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
}

export async function logAudit(
	supabase: SupabaseClient,
	params: AuditParams
): Promise<void> {
	const { error } = await supabase.from('audit_log').insert({
		organization_id: params.organizationId ?? null,
		project_id: params.projectId ?? null,
		actor_id: params.actorId ?? null,
		actor_email: params.actorEmail ?? null,
		action: params.action,
		entity_type: params.entityType,
		entity_id: params.entityId ?? null,
		changes: params.changes ?? {},
		ip_address: params.ipAddress ?? null,
		user_agent: params.userAgent ?? null
	});

	if (error) {
		logError('Failed to write audit log', error);
	}
}
