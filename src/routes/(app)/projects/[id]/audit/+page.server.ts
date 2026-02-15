// Audit log sub-page — load audit entries server-side

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const PER_PAGE = 25;

export const load: PageServerLoad = async ({ params, locals, url, parent }) => {
	const { supabase } = locals;
	await parent(); // Auth guard vanuit layout

	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));

	const { data: entries, error: auditError, count } = await supabase
		.from('audit_logs')
		.select('id, actor_email, action, entity_type, entity_id, changes, created_at', { count: 'exact' })
		.eq('project_id', params.id)
		.order('created_at', { ascending: false })
		.range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

	if (auditError) {
		throw error(500, 'Kon audit log niet laden');
	}

	return {
		auditEntries: entries ?? [],
		auditTotal: count ?? 0,
		auditPage: page,
		auditPerPage: PER_PAGE
	};
};
