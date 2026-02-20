// Retention check cron job — Fase 22
// Detects records with expired retention periods and notifies org admins.
// Runs daily via scheduled API route or Supabase Edge Function.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getGovernanceTables, getDataClassification } from '$utils/governance';
import { groupByTable, resolveOrganizationIds } from './retention-helpers';

/** Result of a single retention check run */
export interface RetentionCheckResult {
	expiredCount: number;
	notificationsCreated: number;
	checkedAt: string;
	errors: string[];
}

/** A record flagged as retention-expired */
export interface ExpiredRecord {
	id: string;
	tableName: string;
	projectId: string | null;
	organizationId: string;
	retentionUntil: string;
	classification: string;
}

/**
 * Finds all records where retention has expired and marks them.
 * Updates archive_status from 'archived' to 'retention_expired'.
 */
export async function findExpiredRecords(
	supabase: SupabaseClient
): Promise<ExpiredRecord[]> {
	const tables = getGovernanceTables();
	const expired: ExpiredRecord[] = [];

	for (const table of tables) {
		const { data, error } = await supabase
			.from(table)
			.select('id, retention_until, archive_status')
			.eq('archive_status', 'archived')
			.lt('retention_until', new Date().toISOString())
			.is('anonymized_at', null);

		if (error || !data || data.length === 0) continue;

		for (const row of data) {
			expired.push({
				id: row.id,
				tableName: table,
				projectId: null,
				organizationId: '',
				retentionUntil: row.retention_until,
				classification: getDataClassification(table)
			});
		}
	}

	return expired;
}

/**
 * Marks expired records as 'retention_expired' in the database.
 */
export async function markExpiredRecords(
	supabase: SupabaseClient,
	records: ExpiredRecord[]
): Promise<number> {
	let updatedCount = 0;
	const grouped = groupByTable(records);

	for (const [table, ids] of Object.entries(grouped)) {
		const { count } = await supabase
			.from(table)
			.update({
				archive_status: 'retention_expired',
				updated_at: new Date().toISOString()
			})
			.in('id', ids)
			.eq('archive_status', 'archived');

		updatedCount += count ?? 0;
	}

	return updatedCount;
}

/**
 * Sends notifications to org admins about expired retention.
 */
export async function notifyOrgAdmins(
	supabase: SupabaseClient,
	expiredCount: number,
	organizationIds: string[]
): Promise<number> {
	if (expiredCount === 0 || organizationIds.length === 0) return 0;

	let created = 0;
	const uniqueOrgIds = [...new Set(organizationIds)];

	for (const orgId of uniqueOrgIds) {
		const { data: members } = await supabase
			.from('organization_members')
			.select('profile_id')
			.eq('organization_id', orgId)
			.in('role', ['owner', 'admin']);

		if (!members || members.length === 0) continue;

		const notifications = members.map(
			(m: { profile_id: string }) => ({
				user_id: m.profile_id,
				organization_id: orgId,
				notification_type: 'retention_expired',
				title: 'Bewaartermijn verlopen',
				body: 'Er zijn records waarvan de bewaartermijn is verlopen. Controleer het retentie-overzicht.',
				metadata: { expired_count: expiredCount }
			})
		);

		const { data: inserted } = await supabase
			.from('notifications')
			.insert(notifications)
			.select('id');

		created += inserted?.length ?? 0;
	}

	return created;
}

/**
 * Main retention check entry point.
 */
export async function runRetentionCheck(
	supabase: SupabaseClient
): Promise<RetentionCheckResult> {
	const errors: string[] = [];
	const checkedAt = new Date().toISOString();

	const expired = await findExpiredRecords(supabase);

	if (expired.length === 0) {
		return { expiredCount: 0, notificationsCreated: 0, checkedAt, errors };
	}

	const expiredCount = await markExpiredRecords(supabase, expired);
	const orgIds = await resolveOrganizationIds(supabase, expired);
	const notificationsCreated = await notifyOrgAdmins(
		supabase, expiredCount, orgIds
	);

	return { expiredCount, notificationsCreated, checkedAt, errors };
}
