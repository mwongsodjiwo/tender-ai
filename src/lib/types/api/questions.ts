// API request/response types for incoming questions (v2 Fase 10)

import type { QuestionStatus } from '../enums.js';

export interface CreateQuestionRequest {
	question_text: string;
	supplier_id?: string;
	reference_document?: string;
	reference_artifact_id?: string;
	is_rectification?: boolean;
	rectification_text?: string;
}

export interface UpdateQuestionRequest {
	question_text?: string;
	answer_text?: string;
	status?: QuestionStatus;
	reference_document?: string;
	reference_artifact_id?: string;
	is_rectification?: boolean;
	rectification_text?: string;
}

export interface QuestionListQuery {
	status?: QuestionStatus;
	supplier_id?: string;
	limit?: number;
	offset?: number;
}
