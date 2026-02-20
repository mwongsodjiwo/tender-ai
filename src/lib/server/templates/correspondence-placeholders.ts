/**
 * Correspondence-specific placeholder definitions and letter type mappings.
 * Defines placeholders unique to the 11 letter types from tender2-plan section 10.3.
 */

import type { PlaceholderDefinition } from './placeholder-registry.js';

export const CORRESPONDENCE_PLACEHOLDERS: PlaceholderDefinition[] = [
	{ key: 'participation_type', label: 'Type deelname (RFI/consultatie)', source: 'correspondence', required: false },
	{ key: 'consultation_date', label: 'Datum marktconsultatie', source: 'correspondence', required: false },
	{ key: 'consultation_time', label: 'Tijd marktconsultatie', source: 'correspondence', required: false },
	{ key: 'consultation_location', label: 'Locatie marktconsultatie', source: 'correspondence', required: false },
	{ key: 'consultation_format', label: 'Format marktconsultatie', source: 'correspondence', required: false },
	{ key: 'consultation_topics', label: 'Onderwerpen marktconsultatie', source: 'correspondence', required: false },
	{ key: 'nvi_publication_date', label: 'NvI publicatiedatum', source: 'correspondence', required: false },
	{ key: 'questions_count', label: 'Aantal vragen in NvI', source: 'correspondence', required: false },
	{ key: 'rectifications_count', label: 'Aantal rectificaties', source: 'correspondence', required: false },
	{ key: 'opening_date', label: 'Datum opening inschrijvingen', source: 'correspondence', required: false },
	{ key: 'opening_time', label: 'Tijd opening inschrijvingen', source: 'correspondence', required: false },
	{ key: 'committee_members', label: 'Commissieleden', source: 'correspondence', required: false },
	{ key: 'tenderers_list', label: 'Lijst inschrijvers', source: 'correspondence', required: false },
	{ key: 'completeness_check', label: 'Volledigheidscheck', source: 'correspondence', required: false },
	{ key: 'scores_per_tenderer', label: 'Scores per inschrijver', source: 'correspondence', required: false },
	{ key: 'ranking', label: 'Rangorde inschrijvers', source: 'correspondence', required: false },
	{ key: 'scoring_methodology', label: 'Beoordelingsmethodiek', source: 'correspondence', required: false },
	{ key: 'winning_scores', label: 'Scores winnaar', source: 'correspondence', required: false },
	{ key: 'award_motivation', label: 'Motivatie gunning', source: 'correspondence', required: false },
	{ key: 'alcatel_period', label: 'Alcatel-termijn', source: 'correspondence', required: false },
	{ key: 'complaint_procedure', label: 'Klachtenprocedure', source: 'correspondence', required: false },
	{ key: 'supplier_scores', label: 'Scores afgewezen inschrijver', source: 'correspondence', required: false },
	{ key: 'winner_scores_anonymized', label: 'Scores winnaar (geanonimiseerd)', source: 'correspondence', required: false },
	{ key: 'rejection_motivation', label: 'Motivatie afwijzing', source: 'correspondence', required: false },
	{ key: 'contract_details', label: 'Contractgegevens', source: 'correspondence', required: false },
	{ key: 'signing_schedule', label: 'Ondertekeningsplanning', source: 'correspondence', required: false },
	{ key: 'signing_date', label: 'Datum ondertekening', source: 'correspondence', required: false },
	{ key: 'signing_location', label: 'Locatie ondertekening', source: 'correspondence', required: false },
	{ key: 'signatories', label: 'Ondertekenaars', source: 'correspondence', required: false },
	{ key: 'attachments', label: 'Bijlagen', source: 'correspondence', required: false }
];

/** Placeholder key sets per letter type (slug suffix after 'correspondence-'). */
export const LETTER_TYPE_PLACEHOLDER_KEYS: Record<string, string[]> = {
	'invitation-rfi': [
		'org_name', 'org_adres', 'org_kvk_nummer',
		'contactpersoon_naam', 'contactpersoon_email', 'contactpersoon_tel',
		'project_name', 'project_reference', 'scope_description',
		'cpv_code', 'cpv_description', 'nuts_code', 'nuts_label',
		'deadline_inschrijving', 'supplier_name', 'supplier_adres', 'datum_vandaag'
	],
	'invitation-consultation': [
		'org_name', 'org_adres', 'org_kvk_nummer',
		'contactpersoon_naam', 'contactpersoon_email', 'contactpersoon_tel',
		'project_name', 'project_reference', 'scope_description',
		'cpv_code', 'cpv_description', 'nuts_code', 'nuts_label',
		'datum_vandaag', 'supplier_name', 'supplier_adres',
		'consultation_date', 'consultation_time', 'consultation_location',
		'consultation_format', 'consultation_topics'
	],
	'thank-you': [
		'org_name', 'supplier_name', 'participation_type',
		'project_reference', 'datum_vandaag', 'contactpersoon_naam'
	],
	'nvi': [
		'org_name', 'project_name', 'project_reference', 'datum_vandaag',
		'contactpersoon_naam', 'contactpersoon_email',
		'nvi_publication_date', 'questions_count', 'rectifications_count'
	],
	'pv-opening': [
		'org_name', 'project_name', 'project_reference', 'datum_vandaag',
		'opening_date', 'opening_time', 'committee_members',
		'tenderers_list', 'completeness_check'
	],
	'pv-evaluation': [
		'org_name', 'project_name', 'project_reference', 'datum_vandaag',
		'committee_members', 'scores_per_tenderer', 'ranking',
		'award_criteria', 'scoring_methodology'
	],
	'provisional-award': [
		'org_name', 'project_name', 'project_reference', 'datum_vandaag',
		'supplier_name', 'supplier_adres', 'winning_scores',
		'award_motivation', 'alcatel_period', 'complaint_procedure',
		'contactpersoon_naam', 'contactpersoon_email'
	],
	'rejection': [
		'org_name', 'project_name', 'project_reference', 'datum_vandaag',
		'supplier_name', 'supplier_adres', 'supplier_scores',
		'winner_scores_anonymized', 'rejection_motivation', 'alcatel_period',
		'contactpersoon_naam', 'contactpersoon_email'
	],
	'final-award': [
		'org_name', 'project_name', 'project_reference', 'datum_vandaag',
		'supplier_name', 'supplier_adres', 'contract_details',
		'signing_schedule', 'contactpersoon_naam', 'contactpersoon_email'
	],
	'invitation-signing': [
		'org_name', 'project_name', 'project_reference', 'datum_vandaag',
		'supplier_name', 'supplier_adres', 'contract_details',
		'signing_date', 'signing_location', 'signatories', 'attachments',
		'contactpersoon_naam', 'contactpersoon_email'
	],
	'cover-letter': [
		'org_name', 'project_name', 'project_reference', 'datum_vandaag',
		'supplier_name', 'supplier_adres',
		'contactpersoon_naam', 'contactpersoon_email'
	]
};
