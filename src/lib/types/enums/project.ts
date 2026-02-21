// Project domain enums — status, phases, roles, procedures, requirements, scoring, contracts

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

// Requirements — PvE eisenmanager

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

// EMVI criteria — wegingstool

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

// Contract settings — Conceptovereenkomst wizard

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
