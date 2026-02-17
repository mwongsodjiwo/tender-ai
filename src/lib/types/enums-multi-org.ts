// Multi-org enumerations (v2 Fase 1)

export const ORGANIZATION_TYPES = ['client', 'consultancy', 'government'] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
	client: 'Klant',
	consultancy: 'Adviesbureau',
	government: 'Overheidsinstelling'
};

export const CONTRACTING_AUTHORITY_TYPES = ['centraal', 'decentraal'] as const;
export type ContractingAuthorityType = (typeof CONTRACTING_AUTHORITY_TYPES)[number];

export const CONTRACTING_AUTHORITY_TYPE_LABELS: Record<ContractingAuthorityType, string> = {
	centraal: 'Centrale overheid',
	decentraal: 'Decentrale overheid'
};

export const ORGANIZATION_RELATIONSHIP_TYPES = ['consultancy', 'audit', 'legal', 'other'] as const;
export type OrganizationRelationshipType = (typeof ORGANIZATION_RELATIONSHIP_TYPES)[number];

export const ORGANIZATION_RELATIONSHIP_TYPE_LABELS: Record<OrganizationRelationshipType, string> = {
	consultancy: 'Advies',
	audit: 'Controle',
	legal: 'Juridisch',
	other: 'Overig'
};

export const RELATIONSHIP_STATUSES = ['active', 'inactive', 'pending'] as const;
export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number];

export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, string> = {
	active: 'Actief',
	inactive: 'Inactief',
	pending: 'In afwachting'
};

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
