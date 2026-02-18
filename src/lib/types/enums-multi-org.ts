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

// =============================================================================
// CPV CATEGORY TYPE — Fase 4 (CPV referentietabel)
// =============================================================================

export const CPV_CATEGORY_TYPES = ['werken', 'leveringen', 'diensten'] as const;
export type CpvCategoryType = (typeof CPV_CATEGORY_TYPES)[number];

export const CPV_CATEGORY_TYPE_LABELS: Record<CpvCategoryType, string> = {
	werken: 'Werken',
	leveringen: 'Leveringen',
	diensten: 'Diensten'
};

// =============================================================================
// NUTS LEVELS — Fase 5 (NUTS referentietabel)
// =============================================================================

export const NUTS_LEVELS = [0, 1, 2, 3] as const;
export type NutsLevel = (typeof NUTS_LEVELS)[number];

export const NUTS_LEVEL_LABELS: Record<NutsLevel, string> = {
	0: 'Land',
	1: 'Landsdeel',
	2: 'Provincie',
	3: 'COROP-gebied'
};

// =============================================================================
// SUPPLIER ENUMS — Fase 8 (Leveranciers CRM)
// =============================================================================

export const SUPPLIER_PROJECT_STATUSES = [
	'prospect', 'geinteresseerd', 'ingeschreven',
	'gewonnen', 'afgewezen', 'gecontracteerd'
] as const;
export type SupplierProjectStatus = (typeof SUPPLIER_PROJECT_STATUSES)[number];

export const SUPPLIER_PROJECT_STATUS_LABELS: Record<SupplierProjectStatus, string> = {
	prospect: 'Prospect',
	geinteresseerd: 'Geïnteresseerd',
	ingeschreven: 'Ingeschreven',
	gewonnen: 'Gewonnen',
	afgewezen: 'Afgewezen',
	gecontracteerd: 'Gecontracteerd'
};

export const SUPPLIER_PROJECT_ROLES = [
	'genodigde', 'vragensteller', 'inschrijver',
	'winnaar', 'contractpartij'
] as const;
export type SupplierProjectRole = (typeof SUPPLIER_PROJECT_ROLES)[number];

export const SUPPLIER_PROJECT_ROLE_LABELS: Record<SupplierProjectRole, string> = {
	genodigde: 'Genodigde',
	vragensteller: 'Vragensteller',
	inschrijver: 'Inschrijver',
	winnaar: 'Winnaar',
	contractpartij: 'Contractpartij'
};

// =============================================================================
// QUESTION STATUS ENUMS — Fase 10 (Binnenkomende Vragen)
// =============================================================================

export const QUESTION_STATUSES = [
	'received', 'in_review', 'answered', 'approved', 'published'
] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
	received: 'Ontvangen',
	in_review: 'In behandeling',
	answered: 'Beantwoord',
	approved: 'Goedgekeurd',
	published: 'Gepubliceerd'
};
