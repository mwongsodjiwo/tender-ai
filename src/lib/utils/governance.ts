// Data governance utilities for retention date calculation and classification
// Supports Archiefwet 2015, AVG, configurable per organization

import type { DataClassification } from '$types/enums';
import type { OrganizationSettings } from '$types/database';

/** Governance fields added to all data tables */
export interface GovernanceFields {
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: string;
}

/** Table-to-classification mapping per tender2-plan section 14.2 */
const TABLE_CLASSIFICATIONS: Record<string, DataClassification> = {
	correspondence: 'archive',
	artifacts: 'archive',
	evaluations: 'archive',
	documents: 'archive',
	conversations: 'operational',
	messages: 'operational',
	time_entries: 'operational',
	document_comments: 'operational',
	section_reviewers: 'operational',
	suppliers: 'personal',
	supplier_contacts: 'personal',
	project_suppliers: 'personal',
	incoming_questions: 'archive'
};

/** Returns the default data classification for a given table */
export function getDataClassification(
	tableName: string
): DataClassification {
	return TABLE_CLASSIFICATIONS[tableName] ?? 'operational';
}

/** Calculates the retention end date based on org settings */
export function calculateRetentionDate(
	orgSettings: Pick<
		OrganizationSettings,
		| 'retention_archive_years_granted'
		| 'retention_personal_data_years'
		| 'retention_operational_years'
	>,
	classification: DataClassification,
	contractEndDate: Date
): Date {
	const yearsMap: Record<DataClassification, number> = {
		archive: orgSettings.retention_archive_years_granted,
		personal: orgSettings.retention_personal_data_years,
		operational: orgSettings.retention_operational_years
	};

	const years = yearsMap[classification];
	const result = new Date(contractEndDate);
	result.setFullYear(result.getFullYear() + years);
	return result;
}

/** Returns all table names that have governance fields */
export function getGovernanceTables(): string[] {
	return Object.keys(TABLE_CLASSIFICATIONS);
}
