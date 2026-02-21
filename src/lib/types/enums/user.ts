// User domain enums — organization roles, member status, org types, suppliers

export const ORGANIZATION_ROLES = ['owner', 'admin', 'member', 'external_advisor', 'auditor'] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const MEMBER_STATUSES = ['active', 'inactive'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
	active: 'Actief',
	inactive: 'Inactief'
};

export const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

// Multi-org types

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

// Supplier enums

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
