/**
 * Fill template data with document role placeholders.
 * Extracted from data-collector.ts to respect 200-line limit.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TemplateData } from './template-data.js';

const ROLE_FIELD_MAP: Record<string, {
	naam: keyof TemplateData;
	email: keyof TemplateData;
	tel: keyof TemplateData;
	functie: keyof TemplateData;
}> = {
	contactpersoon: {
		naam: 'contactpersoon_naam',
		email: 'contactpersoon_email',
		tel: 'contactpersoon_tel',
		functie: 'contactpersoon_functie'
	},
	inkoper: {
		naam: 'inkoper_naam',
		email: 'inkoper_email',
		tel: 'inkoper_tel',
		functie: 'inkoper_functie'
	},
	projectleider: {
		naam: 'projectleider_naam',
		email: 'projectleider_email',
		tel: 'projectleider_tel',
		functie: 'projectleider_functie'
	},
	budgethouder: {
		naam: 'budgethouder_naam',
		email: 'budgethouder_email',
		tel: 'budgethouder_tel',
		functie: 'budgethouder_functie'
	},
	juridisch_adviseur: {
		naam: 'juridisch_adviseur_naam',
		email: 'juridisch_adviseur_email',
		tel: 'juridisch_adviseur_tel',
		functie: 'juridisch_adviseur_functie'
	}
};

export async function fillDocumentRoles(
	supabase: SupabaseClient,
	projectId: string,
	data: TemplateData
): Promise<void> {
	const { data: roles } = await supabase
		.from('project_document_roles')
		.select('role_key, person_name, person_email, person_phone, person_function')
		.eq('project_id', projectId);

	if (!roles) return;

	for (const role of roles) {
		const fields = ROLE_FIELD_MAP[role.role_key];
		if (!fields) continue;
		(data[fields.naam] as string) = role.person_name ?? '';
		(data[fields.email] as string) = role.person_email ?? '';
		(data[fields.tel] as string) = role.person_phone ?? '';
		(data[fields.functie] as string) = role.person_function ?? '';
	}
}
