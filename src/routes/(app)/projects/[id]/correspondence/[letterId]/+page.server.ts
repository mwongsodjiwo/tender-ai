// Individual letter page — loads letter data + address data for editing

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { supabase } = locals;

	const [projectResult, letterResult, evaluationsResult, profileResult] = await Promise.all([
		supabase
			.from('projects')
			.select('id, name, status, organization_id')
			.eq('id', params.id)
			.single(),
		supabase
			.from('correspondence')
			.select('*')
			.eq('id', params.letterId)
			.eq('project_id', params.id)
			.is('deleted_at', null)
			.single(),
		supabase
			.from('evaluations')
			.select('id, tenderer_name, total_score, ranking')
			.eq('project_id', params.id)
			.order('ranking'),
		supabase
			.from('artifacts')
			.select('content')
			.eq('project_id', params.id)
			.eq('section_key', 'project_profile')
			.maybeSingle()
	]);

	if (!letterResult.data) {
		throw error(404, 'Brief niet gevonden');
	}

	const project = projectResult.data ?? {
		id: params.id, name: '', status: 'draft', organization_id: ''
	};

	// Fetch organization address data for sender block
	const addressData = await loadAddressData(supabase, project.organization_id, params.id);

	return {
		project,
		letter: letterResult.data,
		evaluations: evaluationsResult.data ?? [],
		projectProfile: profileResult.data?.content ?? null,
		addressData
	};
};

interface AddressData {
	sender: { name: string; street: string; postalCode: string; city: string };
	recipient: { name: string; street: string; postalCode: string; city: string };
}

async function loadAddressData(
	supabase: App.Locals['supabase'],
	organizationId: string,
	projectId: string
): Promise<AddressData> {
	const empty = { name: '', street: '', postalCode: '', city: '' };
	const result: AddressData = { sender: { ...empty }, recipient: { ...empty } };

	if (!organizationId) return result;

	// Fetch organization for sender
	const { data: org } = await supabase
		.from('organizations')
		.select('name, straat, postcode, plaats')
		.eq('id', organizationId)
		.single();

	if (org) {
		result.sender = {
			name: org.name ?? '',
			street: org.straat ?? '',
			postalCode: org.postcode ?? '',
			city: org.plaats ?? ''
		};
	}

	// Fetch first linked supplier for recipient
	const { data: projectSuppliers } = await supabase
		.from('project_suppliers')
		.select('supplier_id')
		.eq('project_id', projectId)
		.limit(1);

	if (projectSuppliers?.length) {
		const { data: supplier } = await supabase
			.from('suppliers')
			.select('company_name, street, postal_code, city')
			.eq('id', projectSuppliers[0].supplier_id)
			.single();

		if (supplier) {
			result.recipient = {
				name: supplier.company_name ?? '',
				street: supplier.street ?? '',
				postalCode: supplier.postal_code ?? '',
				city: supplier.city ?? ''
			};
		}
	}

	return result;
}
