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

// =============================================================================
// PROJECT PHASES — Sprint R1 (Projectfasen & Navigatie)
// =============================================================================

export const PROJECT_PHASES = [
	'preparing',
	'exploring',
	'specifying',
	'tendering',
	'contracting'
] as const;
export type ProjectPhase = (typeof PROJECT_PHASES)[number];

export const PROJECT_PHASE_LABELS: Record<ProjectPhase, string> = {
	preparing: 'Voorbereiden',
	exploring: 'Verkennen',
	specifying: 'Specificeren',
	tendering: 'Aanbesteden',
	contracting: 'Contracteren'
};

export const PROJECT_PHASE_DESCRIPTIONS: Record<ProjectPhase, string> = {
	preparing: 'Briefing, projectprofiel opstellen en bevestigen',
	exploring: 'Deskresearch, RFI, consultatie, rapport',
	specifying: 'PvE, Aanbestedingsleidraad, EMVI, UEA, Conceptovereenkomst',
	tendering: 'Publicatie, NvI, beoordeling, gunning, afwijzingsbrieven',
	contracting: 'Definitieve overeenkomst, ondertekening'
};

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

// =============================================================================
// REQUIREMENTS — Sprint R5 (PvE eisenmanager)
// =============================================================================

export const REQUIREMENT_TYPES = ['eis', 'wens'] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

export const REQUIREMENT_TYPE_LABELS: Record<RequirementType, string> = {
	eis: 'Eis (Knock-out)',
	wens: 'Wens'
};

export const REQUIREMENT_TYPE_PREFIXES: Record<RequirementType, string> = {
	eis: 'E',
	wens: 'W'
};

export const REQUIREMENT_CATEGORIES = [
	'functional',
	'technical',
	'process',
	'quality',
	'sustainability'
] as const;
export type RequirementCategory = (typeof REQUIREMENT_CATEGORIES)[number];

export const REQUIREMENT_CATEGORY_LABELS: Record<RequirementCategory, string> = {
	functional: 'Functioneel',
	technical: 'Technisch',
	process: 'Proces',
	quality: 'Kwaliteit',
	sustainability: 'Duurzaamheid'
};

// =============================================================================
// EMVI CRITERIA — Sprint R6 (wegingstool)
// =============================================================================

export const SCORING_METHODOLOGIES = ['lowest_price', 'emvi', 'best_price_quality'] as const;
export type ScoringMethodology = (typeof SCORING_METHODOLOGIES)[number];

export const SCORING_METHODOLOGY_LABELS: Record<ScoringMethodology, string> = {
	lowest_price: 'Laagste prijs',
	emvi: 'EMVI',
	best_price_quality: 'Beste prijs-kwaliteitverhouding'
};

export const SCORING_METHODOLOGY_DESCRIPTIONS: Record<ScoringMethodology, string> = {
	lowest_price:
		'De inschrijving met de laagste prijs wint. Geen kwaliteitscriteria.',
	emvi:
		'Economisch Meest Voordelige Inschrijving. Prijs en kwaliteit worden gewogen.',
	best_price_quality:
		'Beste Prijs-Kwaliteitverhouding. Focus op de verhouding tussen prijs en kwaliteit.'
};

export const CRITERION_TYPES = ['price', 'quality'] as const;
export type CriterionType = (typeof CRITERION_TYPES)[number];

export const CRITERION_TYPE_LABELS: Record<CriterionType, string> = {
	price: 'Prijs',
	quality: 'Kwaliteit'
};

// =============================================================================
// CONTRACT SETTINGS — Sprint R7 (Conceptovereenkomst wizard)
// =============================================================================

export const CONTRACT_TYPES = ['diensten', 'leveringen', 'werken'] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
	diensten: 'Diensten',
	leveringen: 'Leveringen',
	werken: 'Werken'
};

export const GENERAL_CONDITIONS_TYPES = [
	'arvodi_2018',
	'ariv_2018',
	'uav_gc_2005',
	'uav_2012',
	'dnr_2011',
	'custom'
] as const;
export type GeneralConditionsType = (typeof GENERAL_CONDITIONS_TYPES)[number];

export const GENERAL_CONDITIONS_LABELS: Record<GeneralConditionsType, string> = {
	arvodi_2018: 'ARVODI-2018',
	ariv_2018: 'ARIV-2018',
	uav_gc_2005: 'UAV-GC 2005',
	uav_2012: 'UAV 2012',
	dnr_2011: 'DNR 2011',
	custom: 'Eigen voorwaarden'
};

export const GENERAL_CONDITIONS_DESCRIPTIONS: Record<GeneralConditionsType, string> = {
	arvodi_2018: 'Algemene Rijksvoorwaarden bij IT-overeenkomsten 2018',
	ariv_2018: 'Algemene Rijksinkoopvoorwaarden 2018',
	uav_gc_2005: 'Uniforme Administratieve Voorwaarden voor Geïntegreerde Contractvormen 2005',
	uav_2012: 'Uniforme Administratieve Voorwaarden voor de uitvoering van werken 2012',
	dnr_2011: 'De Nieuwe Regeling 2011 — rechtsverhouding opdrachtgever-architect/adviseur',
	custom: 'Eigen algemene voorwaarden van de organisatie'
};

// =============================================================================
// UEA — Sprint R8 (Uniform Europees Aanbestedingsdocument)
// =============================================================================

export const UEA_PARTS = [2, 3, 4] as const;
export type UeaPart = (typeof UEA_PARTS)[number];

export const UEA_PART_TITLES: Record<UeaPart, string> = {
	2: 'Informatie over de ondernemer',
	3: 'Uitsluitingsgronden',
	4: 'Selectiecriteria'
};

export const UEA_PART_ROMAN: Record<UeaPart, string> = {
	2: 'II',
	3: 'III',
	4: 'IV'
};

// =============================================================================
// MARKET RESEARCH ACTIVITY TYPES — Sprint R5 (Marktverkenning)
// =============================================================================

export const MARKET_RESEARCH_ACTIVITY_TYPES = [
	'deskresearch',
	'rfi',
	'market_consultation',
	'conversations',
	'report'
] as const;
export type MarketResearchActivityType = (typeof MARKET_RESEARCH_ACTIVITY_TYPES)[number];

export const MARKET_RESEARCH_ACTIVITY_TYPE_LABELS: Record<MarketResearchActivityType, string> = {
	deskresearch: 'Deskresearch',
	rfi: 'Request for Information (RFI)',
	market_consultation: 'Marktconsultatie',
	conversations: 'Gesprekken',
	report: 'Marktverkenningsrapport'
};

// =============================================================================
// ACTIVITY STATUS — Sprint R2 (Fase-activiteiten)
// =============================================================================

export const ACTIVITY_STATUSES = ['not_started', 'in_progress', 'completed', 'skipped'] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
	not_started: 'Niet gestart',
	in_progress: 'Bezig',
	completed: 'Afgerond',
	skipped: 'Overgeslagen'
};

// =============================================================================
// CORRESPONDENCE STATUS — Sprint R2 (Brieven)
// =============================================================================

export const CORRESPONDENCE_STATUSES = ['draft', 'ready', 'sent', 'archived'] as const;
export type CorrespondenceStatus = (typeof CORRESPONDENCE_STATUSES)[number];

export const CORRESPONDENCE_STATUS_LABELS: Record<CorrespondenceStatus, string> = {
	draft: 'Concept',
	ready: 'Gereed',
	sent: 'Verzonden',
	archived: 'Gearchiveerd'
};

// =============================================================================
// EVALUATION STATUS — Sprint R2 (Beoordelingen)
// =============================================================================

export const EVALUATION_STATUSES = ['draft', 'scoring', 'completed', 'published'] as const;
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
	draft: 'Concept',
	scoring: 'Beoordelen',
	completed: 'Afgerond',
	published: 'Gepubliceerd'
};

// =============================================================================
// TIME ENTRY ACTIVITY TYPES — Urenregistratie module
// =============================================================================

export const TIME_ENTRY_ACTIVITY_TYPES = [
	'specifying',
	'evaluation',
	'nvi',
	'correspondence',
	'market_research',
	'meeting',
	'other'
] as const;
export type TimeEntryActivityType = (typeof TIME_ENTRY_ACTIVITY_TYPES)[number];

export const TIME_ENTRY_ACTIVITY_TYPE_LABELS: Record<TimeEntryActivityType, string> = {
	specifying: 'Specificeren',
	evaluation: 'Beoordeling',
	nvi: 'NvI',
	correspondence: 'Correspondentie',
	market_research: 'Marktverkenning',
	meeting: 'Overleg',
	other: 'Overig'
};

// =============================================================================
// AUDIT ACTIONS
// =============================================================================

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
	'admin_action'
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
