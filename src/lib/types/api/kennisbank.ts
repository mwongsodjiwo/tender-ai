// Knowledge Base and Market Research API types

import type { KnowledgeBaseTender, KnowledgeBaseRequirement } from '../database.js';

export interface KnowledgeBaseSearchRequest {
	query: string;
	cpv_codes?: string[];
	limit?: number;
}

export interface KnowledgeBaseSearchResult {
	tender: KnowledgeBaseTender;
	requirement: KnowledgeBaseRequirement;
	snippet: string;
	relevance: number;
}

export interface KnowledgeBaseSearchResponse {
	results: KnowledgeBaseSearchResult[];
	total: number;
}

export interface DeskresearchRequest {
	project_id: string;
	query?: string;
	cpv_codes?: string[];
	limit?: number;
}

export interface DeskresearchResult {
	id: string;
	title: string;
	contracting_authority: string | null;
	cpv_codes: string[];
	estimated_value: number | null;
	currency: string | null;
	publication_date: string | null;
	snippet: string;
	relevance: number;
}

export interface DeskresearchResponse {
	results: DeskresearchResult[];
	total: number;
	ai_summary?: string;
}

export interface GenerateRfiRequest {
	project_id: string;
	additional_context?: string;
}

export interface GenerateRfiResponse {
	content: string;
	questions: string[];
}

export interface GenerateMarketReportRequest {
	project_id: string;
	additional_context?: string;
}

export interface GenerateMarketReportResponse {
	content: string;
}

export interface SaveMarketResearchRequest {
	activity_type: string;
	content: string;
	metadata?: Record<string, unknown>;
}
