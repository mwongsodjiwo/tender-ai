// Admin layout guard — only superadmins may access

import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { isSuperadmin } = await parent();

	if (!isSuperadmin) {
		throw error(403, {
			message: 'Alleen beheerders hebben toegang tot dit gedeelte'
		});
	}

	return {};
};
