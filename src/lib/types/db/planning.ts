import type {
	MilestoneType,
	ProjectPhase,
	ActivityStatus,
	DependencyType,
	NotificationType
} from '../enums.js';

// =============================================================================
// MILESTONES — Planning Sprint 1
// =============================================================================

export interface Milestone {
	id: string;
	project_id: string;
	milestone_type: MilestoneType;
	title: string;
	description: string;
	target_date: string;
	actual_date: string | null;
	phase: ProjectPhase | null;
	is_critical: boolean;
	status: ActivityStatus;
	sort_order: number;
	metadata: Record<string, unknown>;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// NOTIFICATIONS — Sprint 8 (Notificaties & Integraties)
// =============================================================================

export interface Notification {
	id: string;
	user_id: string;
	organization_id: string;
	project_id: string | null;
	notification_type: NotificationType;
	title: string;
	body: string;
	metadata: Record<string, unknown>;
	is_read: boolean;
	read_at: string | null;
	email_sent: boolean;
	email_sent_at: string | null;
	created_at: string;
}

export interface NotificationPreference {
	id: string;
	user_id: string;
	notification_type: NotificationType;
	in_app: boolean;
	email: boolean;
	days_before_deadline: number;
}

// =============================================================================
// ACTIVITY DEPENDENCIES — Planning Sprint 1
// =============================================================================

export interface ActivityDependency {
	id: string;
	project_id: string;
	source_type: 'activity' | 'milestone';
	source_id: string;
	target_type: 'activity' | 'milestone';
	target_id: string;
	dependency_type: DependencyType;
	lag_days: number;
	created_at: string;
	updated_at: string;
}
