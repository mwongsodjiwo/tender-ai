// Shared enumerations matching database schema

export const ORGANIZATION_ROLES = ['owner', 'admin', 'member'] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const PROJECT_STATUSES = [
	'draft',
	'briefing',
	'generating',
	'review',
	'approved',
	'published',
	'archived'
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_ROLES = [
	'project_leader',
	'procurement_advisor',
	'legal_advisor',
	'budget_holder',
	'subject_expert',
	'viewer'
] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
	project_leader: 'Projectleider',
	procurement_advisor: 'Inkoopadviseur',
	legal_advisor: 'Jurist',
	budget_holder: 'Budgethouder',
	subject_expert: 'Vakinhoudelijk expert',
	viewer: 'Lezer'
};

export const ARTIFACT_STATUSES = ['draft', 'generated', 'review', 'approved', 'rejected'] as const;
export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number];

export const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const DOCUMENT_CATEGORIES = [
	'policy',
	'specification',
	'template',
	'reference',
	'tenderned'
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
	policy: 'Beleidsdocument',
	specification: 'Bestek',
	template: 'Sjabloon',
	reference: 'Referentie',
	tenderned: 'TenderNed'
};

export const PROCEDURE_TYPES = [
	'open',
	'restricted',
	'negotiated_with_publication',
	'negotiated_without_publication',
	'competitive_dialogue',
	'innovation_partnership',
	'national_open',
	'national_restricted',
	'single_source'
] as const;
export type ProcedureType = (typeof PROCEDURE_TYPES)[number];

export const PROCEDURE_TYPE_LABELS: Record<ProcedureType, string> = {
	open: 'Openbare procedure',
	restricted: 'Niet-openbare procedure',
	negotiated_with_publication: 'Mededingingsprocedure met onderhandeling',
	negotiated_without_publication: 'Onderhandelingsprocedure zonder aankondiging',
	competitive_dialogue: 'Concurrentiegerichte dialoog',
	innovation_partnership: 'Innovatiepartnerschap',
	national_open: 'Nationaal openbaar',
	national_restricted: 'Nationaal niet-openbaar',
	single_source: 'Enkelvoudige onderhandse gunning'
};

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

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
	'upload'
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
