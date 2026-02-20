// Admin retention overview — load expired records and handle actions
// Fase 22: Retentie signalering admin UI

import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getGovernanceTables } from '$utils/governance';
import { ARCHIVE_STATUS_LABELS } from '$types/enums';

interface ExpiredRow {
	id: string;
	table_name: string;
	retention_until: string;
	archive_status: string;
	data_classification: string;
	project_name: string | null;
}

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent();

	if (!parentData.isSuperadmin) {
		throw error(403, 'Alleen beheerders hebben toegang');
	}

	const tables = getGovernanceTables();
	const expiredRecords: ExpiredRow[] = [];

	for (const table of tables) {
		const { data, error: queryError } = await supabase
			.from(table)
			.select('id, retention_until, archive_status, data_classification')
			.in('archive_status', ['retention_expired', 'archived'])
			.not('retention_until', 'is', null)
			.lt('retention_until', new Date().toISOString())
			.is('anonymized_at', null)
			.limit(100);

		if (queryError || !data || data.length === 0) continue;

		for (const row of data) {
			expiredRecords.push({
				id: row.id,
				table_name: table,
				retention_until: row.retention_until,
				archive_status: row.archive_status,
				data_classification: row.data_classification ?? 'operational',
				project_name: null
			});
		}
	}

	// Count by status for summary
	const statusCounts = {
		archived: expiredRecords.filter(r => r.archive_status === 'archived').length,
		retention_expired: expiredRecords.filter(r => r.archive_status === 'retention_expired').length
	};

	return {
		expiredRecords,
		statusCounts,
		statusLabels: ARCHIVE_STATUS_LABELS
	};
};

export const actions: Actions = {
	anonymize: async ({ request, locals }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const tableName = formData.get('table_name') as string;
		const recordId = formData.get('record_id') as string;
		const strategy = formData.get('strategy') as string || 'replace';

		if (!tableName || !recordId) {
			return fail(400, { message: 'Tabel en record ID zijn verplicht' });
		}

		const { data, error: rpcError } = await supabase.rpc(
			'anonymize_records',
			{
				p_table_name: tableName,
				p_record_ids: [recordId],
				p_strategy: strategy
			}
		);

		if (rpcError) {
			return fail(500, { message: `Anonimisatie mislukt: ${rpcError.message}` });
		}

		return { success: true, action: 'anonymize', count: data };
	},

	extend: async ({ request, locals }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const tableName = formData.get('table_name') as string;
		const recordId = formData.get('record_id') as string;
		const years = parseInt(formData.get('years') as string || '1', 10);

		if (!tableName || !recordId) {
			return fail(400, { message: 'Tabel en record ID zijn verplicht' });
		}

		const { error: updateError } = await supabase
			.from(tableName)
			.update({
				retention_until: new Date(
					Date.now() + years * 365.25 * 24 * 60 * 60 * 1000
				).toISOString(),
				archive_status: 'archived',
				updated_at: new Date().toISOString()
			})
			.eq('id', recordId);

		if (updateError) {
			return fail(500, { message: `Verlenging mislukt: ${updateError.message}` });
		}

		return { success: true, action: 'extend' };
	},

	destroy: async ({ request, locals }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const tableName = formData.get('table_name') as string;
		const recordId = formData.get('record_id') as string;

		if (!tableName || !recordId) {
			return fail(400, { message: 'Tabel en record ID zijn verplicht' });
		}

		const { error: updateError } = await supabase
			.from(tableName)
			.update({
				archive_status: 'destroyed',
				updated_at: new Date().toISOString()
			})
			.eq('id', recordId);

		if (updateError) {
			return fail(500, { message: `Vernietiging mislukt: ${updateError.message}` });
		}

		return { success: true, action: 'destroy' };
	}
};
