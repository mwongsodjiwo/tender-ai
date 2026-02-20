// Templates settings page — load templates, document types, and org context

import type { PageServerLoad } from './$types';
import type { Organization, DocumentType, DocumentTemplate } from '$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { organizations, profile, isSuperadmin } = await parent();
	const { supabase } = locals;

	const organization: Organization | null = organizations[0] ?? null;

	if (!organization) {
		return {
			organization: null,
			templates: [],
			documentTypes: [],
			canEdit: false,
			loadError: null
		};
	}

	const [templatesResult, docTypesResult, membersResult] = await Promise.all([
		supabase
			.from('document_templates')
			.select('*, document_types(name, slug)')
			.eq('organization_id', organization.id)
			.is('deleted_at', null)
			.order('is_default', { ascending: false })
			.order('name'),
		supabase
			.from('document_types')
			.select('id, name, slug')
			.eq('is_active', true)
			.order('sort_order'),
		supabase
			.from('organization_members')
			.select('role')
			.eq('organization_id', organization.id)
			.eq('profile_id', profile?.id ?? '')
			.single()
	]);

	const EDITABLE_ROLES = ['owner', 'admin'];
	const memberRole = membersResult.data?.role ?? null;
	const canEdit = (memberRole !== null && EDITABLE_ROLES.includes(memberRole))
		|| (isSuperadmin ?? false);

	return {
		organization,
		templates: (templatesResult.data ?? []) as DocumentTemplate[],
		documentTypes: (docTypesResult.data ?? []) as Pick<DocumentType, 'id' | 'name' | 'slug'>[],
		canEdit,
		loadError: templatesResult.error?.message ?? null
	};
};
