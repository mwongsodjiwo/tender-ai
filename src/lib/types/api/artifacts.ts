// Artifact API types

import type { Artifact } from '../database.js';
import type { ArtifactStatus } from '../enums.js';

export interface CreateArtifactRequest {
	document_type_id: string;
	section_key: string;
	title: string;
	content?: string;
	sort_order?: number;
	metadata?: Record<string, unknown>;
}

export interface UpdateArtifactRequest {
	title?: string;
	content?: string;
	status?: ArtifactStatus;
	sort_order?: number;
	metadata?: Record<string, unknown>;
}

export type ArtifactResponse = Artifact;
export type ArtifactListResponse = Artifact[];

export interface CreateConversationRequest {
	project_id: string;
	artifact_id?: string;
	title?: string;
	context_type?: string;
}

export interface ChatRequest {
	conversation_id: string;
	message: string;
}

export interface ChatResponse {
	message_id: string;
	content: string;
	conversation_id: string;
}

export interface RegenerateSectionRequest {
	artifact_id: string;
	instructions?: string;
}

export interface RegenerateSectionResponse {
	artifact: Artifact;
	previous_version: number;
}

export interface InviteReviewerRequest {
	artifact_id: string;
	email: string;
	name: string;
}

export interface UpdateReviewRequest {
	review_status: 'approved' | 'rejected';
	feedback?: string;
}

export interface ReviewerResponse {
	id: string;
	artifact_id: string;
	email: string;
	name: string;
	review_status: string;
	feedback: string | null;
	reviewed_at: string | null;
	expires_at: string;
	created_at: string;
}

export interface MagicLinkReviewData {
	reviewer: ReviewerResponse;
	artifact: Artifact;
	project: { id: string; name: string };
}

export interface CreateDocumentCommentRequest {
	artifact_id: string;
	selected_text: string;
	comment_text: string;
}

export interface UpdateDocumentCommentRequest {
	comment_text?: string;
	resolved?: boolean;
}
