// Briefing API types

export interface BriefingStartRequest {
	project_id: string;
}

export interface BriefingMessageRequest {
	project_id: string;
	conversation_id: string;
	message: string;
}

export interface BriefingResponse {
	message_id: string;
	content: string;
	conversation_id: string;
	briefing_complete: boolean;
	artifacts_generated: number;
}
