// Planning domain enums — activities, milestones, dependencies, notifications, time tracking

export const ACTIVITY_STATUSES = ['not_started', 'in_progress', 'completed', 'skipped'] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
	not_started: 'Niet gestart',
	in_progress: 'Bezig',
	completed: 'Afgerond',
	skipped: 'Overgeslagen'
};

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

export const TIME_ENTRY_ACTIVITY_TYPES = [
	'preparing',
	'exploring',
	'specifying',
	'tendering',
	'contracting'
] as const;
export type TimeEntryActivityType = (typeof TIME_ENTRY_ACTIVITY_TYPES)[number];

export const TIME_ENTRY_ACTIVITY_TYPE_LABELS: Record<TimeEntryActivityType, string> = {
	preparing: 'Voorbereiden',
	exploring: 'Verkennen',
	specifying: 'Specificeren',
	tendering: 'Aanbesteden',
	contracting: 'Contracteren'
};

// Milestones

export const MILESTONE_TYPES = [
	'phase_start',
	'phase_end',
	'publication',
	'submission_deadline',
	'nota_van_inlichtingen',
	'award_decision',
	'standstill_end',
	'contract_signed',
	'custom'
] as const;
export type MilestoneType = (typeof MILESTONE_TYPES)[number];

export const MILESTONE_TYPE_LABELS: Record<MilestoneType, string> = {
	phase_start: 'Fase start',
	phase_end: 'Fase einde',
	publication: 'Publicatie',
	submission_deadline: 'Inschrijfdeadline',
	nota_van_inlichtingen: 'Nota van Inlichtingen',
	award_decision: 'Gunningsbesluit',
	standstill_end: 'Einde standstill',
	contract_signed: 'Contract getekend',
	custom: 'Aangepast'
};

export const MILESTONE_SOURCES = ['manual', 'calculated'] as const;
export type MilestoneSource = (typeof MILESTONE_SOURCES)[number];

// Dependencies

export const DEPENDENCY_TYPES = [
	'finish_to_start',
	'start_to_start',
	'finish_to_finish',
	'start_to_finish'
] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

export const DEPENDENCY_TYPE_LABELS: Record<DependencyType, string> = {
	finish_to_start: 'Einde → Start',
	start_to_start: 'Start → Start',
	finish_to_finish: 'Einde → Einde',
	start_to_finish: 'Start → Einde'
};

// Notifications

export const NOTIFICATION_TYPES = [
	'deadline_approaching',
	'deadline_overdue',
	'activity_assigned',
	'planning_changed',
	'milestone_completed',
	'overload_warning',
	'weekly_summary'
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
	deadline_approaching: 'Naderende deadline',
	deadline_overdue: 'Verlopen deadline',
	activity_assigned: 'Nieuwe toewijzing',
	planning_changed: 'Planning gewijzigd',
	milestone_completed: 'Milestone bereikt',
	overload_warning: 'Overbezetting',
	weekly_summary: 'Wekelijks overzicht'
};

export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
	deadline_approaching: 'Waarschuwing X dagen voor een deadline',
	deadline_overdue: 'Melding wanneer een deadline is verlopen',
	activity_assigned: 'Melding bij een nieuwe activiteittoewijzing',
	planning_changed: 'Melding wanneer de projectplanning wijzigt',
	milestone_completed: 'Melding wanneer een milestone is bereikt',
	overload_warning: 'Waarschuwing bij overbezetting teamlid',
	weekly_summary: 'Wekelijks overzicht van alle projecten'
};
