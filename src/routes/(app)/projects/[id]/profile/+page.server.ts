// Project profile page — load profile data, documents, org NUTS codes, and org settings

import type { PageServerLoad } from './$types';
import type { ProjectProfile, Document, Organization, OrganizationSettings, ProjectDocumentRole } from '$types';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
	const { supabase } = locals;
	const parentData = await parent();
	const organizationId = parentData.project.organization_id;

	const [profileResult, documentsResult, orgResult, settingsResult, rolesResult] = await Promise.all([
		supabase
			.from('project_profiles')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.maybeSingle(),
		supabase
			.from('documents')
			.select('*')
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.order('created_at', { ascending: false }),
		supabase
			.from('organizations')
			.select('id, name, handelsnaam, kvk_nummer, rechtsvorm, straat, postcode, plaats, nuts_codes, sbi_codes, aanbestedende_dienst_type, organization_type')
			.eq('id', organizationId)
			.single(),
		supabase
			.from('organization_settings')
			.select('threshold_works, threshold_services_central, threshold_services_decentral, threshold_social_services')
			.eq('organization_id', organizationId)
			.maybeSingle(),
		supabase
			.from('project_document_roles')
			.select('*')
			.eq('project_id', params.id)
			.order('role_key')
	]);

	return {
		profile: (profileResult.data as ProjectProfile | null) ?? null,
		documents: (documentsResult.data as Document[] | null) ?? [],
		organization: (orgResult.data as Partial<Organization> | null) ?? null,
		organizationNutsCodes: (orgResult.data?.nuts_codes as string[] | null) ?? [],
		authorityType: (orgResult.data?.aanbestedende_dienst_type as string | null) ?? 'decentraal',
		orgThresholds: (settingsResult.data as Pick<OrganizationSettings, 'threshold_works' | 'threshold_services_central' | 'threshold_services_decentral' | 'threshold_social_services'> | null) ?? null,
		documentRoles: (rolesResult.data as ProjectDocumentRole[] | null) ?? []
	};
};
