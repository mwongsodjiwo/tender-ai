// Retention check helpers — Fase 22
// Helper functions for resolving org IDs and grouping records

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExpiredRecord } from './retention-check';

/** Tables that have a direct project_id column */
const DIRECT_PROJECT_TABLES = [
	'correspondence', 'artifacts', 'evaluations', 'documents',
	'conversations', 'time_entries'
] as const;

/** Groups records by table name, returning table → id[] */
export function groupByTable(
	records: ExpiredRecord[]
): Record<string, string[]> {
	const grouped: Record<string, string[]> = {};
	for (const r of records) {
		if (!grouped[r.tableName]) grouped[r.tableName] = [];
		grouped[r.tableName].push(r.id);
	}
	return grouped;
}

/**
 * Resolves organization IDs for expired records by looking up
 * the project → organization relationship.
 */
export async function resolveOrganizationIds(
	supabase: SupabaseClient,
	records: ExpiredRecord[]
): Promise<string[]> {
	const orgIds: string[] = [];

	for (const table of DIRECT_PROJECT_TABLES) {
		const tableRecords = records.filter(r => r.tableName === table);
		if (tableRecords.length === 0) continue;

		const ids = tableRecords.map(r => r.id);
		const { data } = await supabase
			.from(table)
			.select('project_id')
			.in('id', ids);

		if (!data) continue;

		const projectIds = data
			.map((r: { project_id: string }) => r.project_id)
			.filter(Boolean);

		if (projectIds.length === 0) continue;

		const { data: projects } = await supabase
			.from('projects')
			.select('organization_id')
			.in('id', projectIds);

		if (projects) {
			orgIds.push(
				...projects.map(
					(p: { organization_id: string }) => p.organization_id
				)
			);
		}
	}

	return [...new Set(orgIds)];
}
