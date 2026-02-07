// Admin organization detail — load organization + members with profiles

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createServiceClient } from '$server/db/client';

export const load: PageServerLoad = async ({ params }) => {
	const serviceClient = createServiceClient();

	const { data: organization, error: orgError } = await serviceClient
		.from('organizations')
		.select('*')
		.eq('id', params.id)
		.is('deleted_at', null)
		.single();

	if (orgError || !organization) {
		throw error(404, { message: 'Organisatie niet gevonden' });
	}

	const { data: members } = await serviceClient
		.from('organization_members')
		.select('*, profile:profiles(*)')
		.eq('organization_id', params.id)
		.order('created_at');

	return {
		organization,
		members: members ?? []
	};
};
