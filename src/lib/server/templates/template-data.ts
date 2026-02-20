/**
 * TemplateData type definition and defaults.
 * Used by data-collector and renderer modules.
 */

export interface TemplateData {
	// Organization fields
	org_name: string;
	org_kvk_nummer: string;
	org_adres: string;
	org_postcode: string;
	org_plaats: string;
	// Project fields
	project_name: string;
	project_reference: string;
	cpv_code: string;
	cpv_description: string;
	nuts_code: string;
	nuts_label: string;
	deadline_inschrijving: string;
	// Contact fields (from document roles)
	contactpersoon_naam: string;
	contactpersoon_email: string;
	contactpersoon_tel: string;
	contactpersoon_functie: string;
	inkoper_naam: string;
	inkoper_email: string;
	inkoper_tel: string;
	inkoper_functie: string;
	projectleider_naam: string;
	projectleider_email: string;
	projectleider_tel: string;
	projectleider_functie: string;
	budgethouder_naam: string;
	budgethouder_email: string;
	budgethouder_tel: string;
	budgethouder_functie: string;
	juridisch_adviseur_naam: string;
	juridisch_adviseur_email: string;
	juridisch_adviseur_tel: string;
	juridisch_adviseur_functie: string;
	// Supplier fields (for correspondence)
	supplier_name: string;
	supplier_adres: string;
	// AI-generated fields
	scope_description: string;
	requirements: string;
	award_criteria: string;
	// System fields
	datum_vandaag: string;
	// Lists
	suppliers: Array<{ name: string; adres: string }>;
	questions: Array<{ number: number; question: string; answer: string }>;
}

export const EMPTY_TEMPLATE_DATA: TemplateData = {
	org_name: '',
	org_kvk_nummer: '',
	org_adres: '',
	org_postcode: '',
	org_plaats: '',
	project_name: '',
	project_reference: '',
	cpv_code: '',
	cpv_description: '',
	nuts_code: '',
	nuts_label: '',
	deadline_inschrijving: '',
	contactpersoon_naam: '',
	contactpersoon_email: '',
	contactpersoon_tel: '',
	contactpersoon_functie: '',
	inkoper_naam: '',
	inkoper_email: '',
	inkoper_tel: '',
	inkoper_functie: '',
	projectleider_naam: '',
	projectleider_email: '',
	projectleider_tel: '',
	projectleider_functie: '',
	budgethouder_naam: '',
	budgethouder_email: '',
	budgethouder_tel: '',
	budgethouder_functie: '',
	juridisch_adviseur_naam: '',
	juridisch_adviseur_email: '',
	juridisch_adviseur_tel: '',
	juridisch_adviseur_functie: '',
	supplier_name: '',
	supplier_adres: '',
	scope_description: '',
	requirements: '',
	award_criteria: '',
	datum_vandaag: '',
	suppliers: [],
	questions: []
};

const DUTCH_MONTHS = [
	'januari', 'februari', 'maart', 'april', 'mei', 'juni',
	'juli', 'augustus', 'september', 'oktober', 'november', 'december'
];

/** Format a date as Dutch format: "18 februari 2026" */
export function formatDutchDate(date: Date): string {
	const day = date.getDate();
	const month = DUTCH_MONTHS[date.getMonth()];
	const year = date.getFullYear();
	return `${day} ${month} ${year}`;
}
