import type {
	DataClassification,
	ArchiveStatus
} from '../enums.js';

// =============================================================================
// KNOWLEDGE BASE — Sprint R2 (Kennisbank)
// =============================================================================

export interface KnowledgeBaseTender {
	id: string;
	external_id: string;
	title: string;
	description: string | null;
	contracting_authority: string | null;
	procedure_type: string | null;
	estimated_value: number | null;
	currency: string | null;
	publication_date: string | null;
	deadline_date: string | null;
	cpv_codes: string[];
	nuts_codes: string[];
	source_url: string | null;
	raw_data: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface KnowledgeBaseRequirement {
	id: string;
	tender_id: string;
	requirement_text: string;
	category: string | null;
	source_section: string | null;
	metadata: Record<string, unknown>;
	created_at: string;
}

// =============================================================================
// DOCUMENT COMMENTS
// =============================================================================

export interface DocumentComment {
	id: string;
	project_id: string;
	artifact_id: string;
	selected_text: string;
	comment_text: string;
	resolved: boolean;
	resolved_at: string | null;
	resolved_by: string | null;
	data_classification: DataClassification;
	retention_until: string | null;
	anonymized_at: string | null;
	archive_status: ArchiveStatus;
	created_by: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface DocumentCommentWithAuthor extends DocumentComment {
	author: {
		first_name: string;
		last_name: string;
		email: string;
	};
}

// =============================================================================
// KNOWLEDGE BASE
// =============================================================================

export interface RequirementChunk {
	id: string;
	requirement_id: string;
	chunk_index: number;
	content: string;
	token_count: number | null;
	metadata: Record<string, unknown>;
	created_at: string;
}

export interface HarvestLog {
	id: string;
	source: string;
	started_at: string;
	finished_at: string | null;
	records_fetched: number;
	records_inserted: number;
	records_updated: number;
	errors: unknown[];
	metadata: Record<string, unknown>;
	created_at: string;
}
