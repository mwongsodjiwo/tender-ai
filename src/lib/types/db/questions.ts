// Database row types for incoming questions (v2 Fase 10)

import type {
	QuestionStatus,
	DataClassification,
	ArchiveStatus
} from '../enums.js';

export interface IncomingQuestion {
	id: string;
	project_id: string;
	question_number: number;
	supplier_id: string | null;
	question_text: string;
	reference_document: string | null;
	reference_artifact_id: string | null;
	answer_text: string | null;
	is_rectification: boolean;
	rectification_text: string | null;
	status: QuestionStatus;
	approved_by: string | null;
	received_at: string;
	answered_at: string | null;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_at: string;
	updated_at: string;
}
