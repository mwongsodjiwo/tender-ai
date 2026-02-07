// Health check endpoint

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const { supabase } = locals;

	const { error } = await supabase.from('document_types').select('id').limit(1);

	const status = error ? 'unhealthy' : 'healthy';
	const statusCode = error ? 503 : 200;

	return json(
		{
			status,
			timestamp: new Date().toISOString(),
			database: error ? 'disconnected' : 'connected'
		},
		{ status: statusCode }
	);
};
