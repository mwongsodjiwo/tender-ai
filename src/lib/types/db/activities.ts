import type {
	ProjectPhase,
	ActivityStatus,
	CorrespondenceStatus,
	EvaluationStatus,
	DataClassification,
	ArchiveStatus
} from '../enums.js';

// =============================================================================
// PROJECT PROFILES — Sprint R2 (Projectprofiel)
// =============================================================================

export interface ProjectProfile {
	id: string;
	project_id: string;
	contracting_authority: string;
	department: string;
	contact_name: string;
	contact_email: string;
	contact_phone: string;
	project_goal: string;
	scope_description: string;
	estimated_value: number | null;
	currency: string;
	cpv_codes: string[];
	nuts_codes: string[];
	timeline_start: string | null;
	timeline_end: string | null;
	planning_generated_at: string | null;
	planning_approved: boolean;
	planning_approved_at: string | null;
	planning_approved_by: string | null;
	planning_metadata: Record<string, unknown>;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// PHASE ACTIVITIES — Sprint R2 (Fase-activiteiten)
// =============================================================================

export interface PhaseActivity {
	id: string;
	project_id: string;
	phase: ProjectPhase;
	activity_type: string;
	title: string;
	description: string;
	status: ActivityStatus;
	sort_order: number;
	assigned_to: string | null;
	due_date: string | null;
	completed_at: string | null;
	planned_start: string | null;
	planned_end: string | null;
	actual_start: string | null;
	actual_end: string | null;
	estimated_hours: number | null;
	progress_percentage: number;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// CORRESPONDENCE — Sprint R2 (Brieven)
// =============================================================================

export interface Correspondence {
	id: string;
	project_id: string;
	phase: ProjectPhase;
	letter_type: string;
	recipient: string;
	subject: string;
	body: string;
	status: CorrespondenceStatus;
	sent_at: string | null;
	metadata: Record<string, unknown>;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

// =============================================================================
// EVALUATIONS — Sprint R2 (Beoordelingen)
// =============================================================================

export interface Evaluation {
	id: string;
	project_id: string;
	tenderer_name: string;
	scores: Record<string, unknown>;
	total_score: number;
	ranking: number | null;
	status: EvaluationStatus;
	notes: string;
	metadata: Record<string, unknown>;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_by: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}
