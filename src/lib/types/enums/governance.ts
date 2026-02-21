// Governance domain enums — data classification, archiving, CPV, NUTS, audit

export const DATA_CLASSIFICATIONS = ['archive', 'personal', 'operational'] as const;
export type DataClassification = (typeof DATA_CLASSIFICATIONS)[number];

export const DATA_CLASSIFICATION_LABELS: Record<DataClassification, string> = {
	archive: 'Archief',
	personal: 'Persoonsgegevens',
	operational: 'Operationeel'
};

export const ARCHIVE_STATUSES = ['active', 'archived', 'retention_expired', 'anonymized', 'destroyed'] as const;
export type ArchiveStatus = (typeof ARCHIVE_STATUSES)[number];

export const ARCHIVE_STATUS_LABELS: Record<ArchiveStatus, string> = {
	active: 'Actief',
	archived: 'Gearchiveerd',
	retention_expired: 'Bewaartermijn verlopen',
	anonymized: 'Geanonimiseerd',
	destroyed: 'Vernietigd'
};

export const ANONYMIZATION_STRATEGIES = ['replace', 'remove'] as const;
export type AnonymizationStrategy = (typeof ANONYMIZATION_STRATEGIES)[number];

// CPV category types

export const CPV_CATEGORY_TYPES = ['werken', 'leveringen', 'diensten'] as const;
export type CpvCategoryType = (typeof CPV_CATEGORY_TYPES)[number];

export const CPV_CATEGORY_TYPE_LABELS: Record<CpvCategoryType, string> = {
	werken: 'Werken',
	leveringen: 'Leveringen',
	diensten: 'Diensten'
};

// NUTS levels

export const NUTS_LEVELS = [0, 1, 2, 3] as const;
export type NutsLevel = (typeof NUTS_LEVELS)[number];

export const NUTS_LEVEL_LABELS: Record<NutsLevel, string> = {
	0: 'Land',
	1: 'Landsdeel',
	2: 'Provincie',
	3: 'COROP-gebied'
};

// Audit actions

export const AUDIT_ACTIONS = [
	'create',
	'update',
	'delete',
	'login',
	'logout',
	'invite',
	'approve',
	'reject',
	'generate',
	'export',
	'upload',
	'admin_action',
	'archive',
	'unarchive'
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
