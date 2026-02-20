/**
 * Placeholder registry for document template engine.
 * Defines all standard placeholders and their sources.
 * See tender2-plan.md section 12.3 for specification.
 */

import {
	CORRESPONDENCE_PLACEHOLDERS,
	LETTER_TYPE_PLACEHOLDER_KEYS
} from './correspondence-placeholders.js';

// Source of placeholder data
export type PlaceholderSource =
	| 'organization'
	| 'project'
	| 'contact'
	| 'supplier'
	| 'ai'
	| 'system'
	| 'correspondence';

export interface PlaceholderDefinition {
	key: string;
	label: string;
	source: PlaceholderSource;
	required: boolean;
}

const ORGANIZATION_PLACEHOLDERS: PlaceholderDefinition[] = [
	{ key: 'org_name', label: 'Organisatienaam', source: 'organization', required: true },
	{ key: 'org_kvk_nummer', label: 'KVK-nummer', source: 'organization', required: false },
	{ key: 'org_adres', label: 'Volledig adres', source: 'organization', required: false },
	{ key: 'org_postcode', label: 'Postcode', source: 'organization', required: false },
	{ key: 'org_plaats', label: 'Plaatsnaam', source: 'organization', required: false }
];

const PROJECT_PLACEHOLDERS: PlaceholderDefinition[] = [
	{ key: 'project_name', label: 'Projectnaam', source: 'project', required: true },
	{ key: 'project_reference', label: 'Projectreferentie', source: 'project', required: false },
	{ key: 'cpv_code', label: 'Hoofd CPV-code', source: 'project', required: false },
	{ key: 'cpv_description', label: 'CPV-omschrijving', source: 'project', required: false },
	{ key: 'nuts_code', label: 'NUTS-code', source: 'project', required: false },
	{ key: 'nuts_label', label: 'NUTS-omschrijving', source: 'project', required: false },
	{ key: 'deadline_inschrijving', label: 'Inschrijfdeadline', source: 'project', required: false }
];

const CONTACT_PLACEHOLDERS: PlaceholderDefinition[] = [
	{ key: 'contactpersoon_naam', label: 'Contactpersoon naam', source: 'contact', required: false },
	{ key: 'contactpersoon_email', label: 'Contactpersoon email', source: 'contact', required: false },
	{ key: 'contactpersoon_tel', label: 'Contactpersoon telefoon', source: 'contact', required: false },
	{ key: 'inkoper_naam', label: 'Inkoper naam', source: 'contact', required: false }
];

const SUPPLIER_PLACEHOLDERS: PlaceholderDefinition[] = [
	{ key: 'supplier_name', label: 'Leveranciersnaam', source: 'supplier', required: false },
	{ key: 'supplier_adres', label: 'Leveranciersadres', source: 'supplier', required: false }
];

const AI_PLACEHOLDERS: PlaceholderDefinition[] = [
	{ key: 'scope_description', label: 'AI: scopebeschrijving', source: 'ai', required: false },
	{ key: 'requirements', label: 'AI: eisen', source: 'ai', required: false },
	{ key: 'award_criteria', label: 'AI: gunningscriteria', source: 'ai', required: false }
];

const SYSTEM_PLACEHOLDERS: PlaceholderDefinition[] = [
	{ key: 'datum_vandaag', label: 'Huidige datum', source: 'system', required: false }
];

const ALL_PLACEHOLDERS: PlaceholderDefinition[] = [
	...ORGANIZATION_PLACEHOLDERS,
	...PROJECT_PLACEHOLDERS,
	...CONTACT_PLACEHOLDERS,
	...SUPPLIER_PLACEHOLDERS,
	...AI_PLACEHOLDERS,
	...CORRESPONDENCE_PLACEHOLDERS,
	...SYSTEM_PLACEHOLDERS
];

const PLACEHOLDER_MAP = new Map<string, PlaceholderDefinition>(
	ALL_PLACEHOLDERS.map((p) => [p.key, p])
);

/** Get all registered placeholder definitions. */
export function getAllPlaceholders(): PlaceholderDefinition[] {
	return [...ALL_PLACEHOLDERS];
}

/** Get a placeholder definition by key. Returns undefined if not found. */
export function getPlaceholder(key: string): PlaceholderDefinition | undefined {
	return PLACEHOLDER_MAP.get(key);
}

/** Get all placeholder keys as a Set. */
export function getPlaceholderKeys(): Set<string> {
	return new Set(PLACEHOLDER_MAP.keys());
}

/** Get placeholders filtered by source. */
export function getPlaceholdersBySource(source: PlaceholderSource): PlaceholderDefinition[] {
	return ALL_PLACEHOLDERS.filter((p) => p.source === source);
}

/** Validate which placeholders in a template are recognized. */
export function validatePlaceholders(
	dataKeys: string[]
): { recognized: string[]; unrecognized: string[] } {
	const recognized: string[] = [];
	const unrecognized: string[] = [];

	for (const key of dataKeys) {
		if (PLACEHOLDER_MAP.has(key)) {
			recognized.push(key);
		} else {
			unrecognized.push(key);
		}
	}

	return { recognized, unrecognized };
}

/** Get correspondence-specific placeholders. */
export function getCorrespondencePlaceholders(): PlaceholderDefinition[] {
	return [...CORRESPONDENCE_PLACEHOLDERS];
}

/**
 * Get placeholder definitions for a specific letter type.
 * Uses slug suffix (e.g., 'invitation-rfi' from 'correspondence-invitation-rfi').
 */
export function getPlaceholdersForLetterType(
	letterTypeSlug: string
): PlaceholderDefinition[] {
	const suffix = letterTypeSlug.replace('correspondence-', '');
	const keys = LETTER_TYPE_PLACEHOLDER_KEYS[suffix];
	if (!keys) return [];
	return keys
		.map((k) => PLACEHOLDER_MAP.get(k))
		.filter((p): p is PlaceholderDefinition => p !== undefined);
}

/** Get all registered letter type slug suffixes. */
export function getRegisteredLetterTypes(): string[] {
	return Object.keys(LETTER_TYPE_PLACEHOLDER_KEYS);
}
