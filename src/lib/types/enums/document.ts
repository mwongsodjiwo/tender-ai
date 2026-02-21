// Document domain enums — artifacts, categories, roles, correspondence, letters, UEA

import type { ProjectPhase } from './project.js';

export const ARTIFACT_STATUSES = ['draft', 'generated', 'review', 'approved', 'rejected'] as const;
export type ArtifactStatus = (typeof ARTIFACT_STATUSES)[number];

export const DOCUMENT_EDIT_STATUSES = ['concept', 'in_review', 'approved'] as const;
export type DocumentEditStatus = (typeof DOCUMENT_EDIT_STATUSES)[number];

export const DOCUMENT_EDIT_STATUS_LABELS: Record<DocumentEditStatus, string> = {
	concept: 'Concept',
	in_review: 'In review',
	approved: 'Goedgekeurd'
};

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

export const DOCUMENT_ROLE_KEYS = [
	'contactpersoon', 'inkoper', 'projectleider',
	'budgethouder', 'juridisch_adviseur'
] as const;
export type DocumentRoleKey = (typeof DOCUMENT_ROLE_KEYS)[number];

export const DOCUMENT_ROLE_LABELS: Record<DocumentRoleKey, string> = {
	contactpersoon: 'Contactpersoon',
	inkoper: 'Inkoper',
	projectleider: 'Projectleider',
	budgethouder: 'Budgethouder',
	juridisch_adviseur: 'Juridisch adviseur'
};

export const CORRESPONDENCE_STATUSES = ['draft', 'ready', 'sent', 'archived'] as const;
export type CorrespondenceStatus = (typeof CORRESPONDENCE_STATUSES)[number];

export const CORRESPONDENCE_STATUS_LABELS: Record<CorrespondenceStatus, string> = {
	draft: 'Concept',
	ready: 'Gereed',
	sent: 'Verzonden',
	archived: 'Gearchiveerd'
};

export const EVALUATION_STATUSES = ['draft', 'scoring', 'completed', 'published'] as const;
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
	draft: 'Concept',
	scoring: 'Beoordelen',
	completed: 'Afgerond',
	published: 'Gepubliceerd'
};

// UEA — Uniform Europees Aanbestedingsdocument

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

// Letter types — Correspondentie als Document Types

export const LETTER_TYPES = [
	'invitation_rfi',
	'invitation_consultation',
	'thank_you',
	'nvi',
	'pv_opening',
	'pv_evaluation',
	'provisional_award',
	'rejection',
	'final_award',
	'invitation_signing',
	'cover_letter'
] as const;
export type LetterType = (typeof LETTER_TYPES)[number];

export const LETTER_TYPE_LABELS: Record<LetterType, string> = {
	invitation_rfi: 'Uitnodiging RFI',
	invitation_consultation: 'Uitnodiging marktconsultatie',
	thank_you: 'Bedankbrief deelname',
	nvi: 'Nota van Inlichtingen',
	pv_opening: 'PV opening inschrijvingen',
	pv_evaluation: 'PV beoordeling',
	provisional_award: 'Voorlopige gunningsbeslissing',
	rejection: 'Afwijzingsbrief',
	final_award: 'Definitieve gunning',
	invitation_signing: 'Uitnodiging tot ondertekening',
	cover_letter: 'Begeleidende brief'
};

export const LETTER_TYPE_SLUGS: Record<LetterType, string> = {
	invitation_rfi: 'correspondence-invitation-rfi',
	invitation_consultation: 'correspondence-invitation-consultation',
	thank_you: 'correspondence-thank-you',
	nvi: 'correspondence-nvi',
	pv_opening: 'correspondence-pv-opening',
	pv_evaluation: 'correspondence-pv-evaluation',
	provisional_award: 'correspondence-provisional-award',
	rejection: 'correspondence-rejection',
	final_award: 'correspondence-final-award',
	invitation_signing: 'correspondence-invitation-signing',
	cover_letter: 'correspondence-cover-letter'
};

export const LETTER_TYPE_PHASES: Record<LetterType, ProjectPhase[]> = {
	invitation_rfi: ['exploring'],
	invitation_consultation: ['exploring'],
	thank_you: ['exploring'],
	nvi: ['tendering'],
	pv_opening: ['tendering'],
	pv_evaluation: ['tendering'],
	provisional_award: ['tendering'],
	rejection: ['tendering'],
	final_award: ['tendering'],
	invitation_signing: ['contracting'],
	cover_letter: ['contracting']
};

export const DOCUMENT_TYPE_CATEGORIES = ['document', 'correspondence'] as const;
export type DocumentTypeCategory = (typeof DOCUMENT_TYPE_CATEGORIES)[number];

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
