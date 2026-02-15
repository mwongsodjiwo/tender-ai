import type {
	Organization,
	Profile,
	OrganizationMember,
	Project,
	ProjectMember,
	ProjectMemberRole,
	Artifact,
	Conversation,
	Message
} from './base.js';
import type { Document, TenderNedItem, DocumentChunk, TenderNedChunk } from './documents.js';
import type { SectionReviewer } from './reviews.js';

// =============================================================================
// JOINED / ENRICHED TYPES
// =============================================================================

export interface OrganizationMemberWithProfile extends OrganizationMember {
	profile: Profile;
}

export interface ProjectMemberWithProfile extends ProjectMember {
	profile: Profile;
	roles: ProjectMemberRole[];
}

export interface ConversationWithMessages extends Conversation {
	messages: Message[];
}

export interface ArtifactWithReviewers extends Artifact {
	reviewers: SectionReviewer[];
}

export interface DocumentWithChunks extends Document {
	chunks: DocumentChunk[];
}

export interface TenderNedItemWithChunks extends TenderNedItem {
	chunks: TenderNedChunk[];
}
